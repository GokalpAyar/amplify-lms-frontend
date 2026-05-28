// Enhanced ViewSubmissions.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BASE_URL, FRONTEND_ASSIGNMENT_URL } from "@/config";
import { supabase } from "@/supabaseClient";

type AnswerValue = string | OralAnswerEnvelope | null | undefined;

interface AudioSourceMeta {
  url: string;
  mimeType?: string;
  label?: string;
}

interface OralAnswerEnvelope {
  transcript?: string;
  audioUrl?: string;
  mimeType?: string;
  recordingUrl?: string;
  recordingMime?: string;
  durationMs?: number;
  sizeBytes?: number;
  sources?: AudioSourceMeta[];
  formats?: AudioSourceMeta[];
  [key: string]: unknown;
}

interface OralRecordingBundle {
  transcript?: string;
  sources: AudioSourceMeta[];
  sizeBytes?: number;
  durationMs?: number;
}

type AudioStatus = "idle" | "loading" | "ready" | "error";

interface AudioMetaState {
  status: AudioStatus;
  duration?: number;
  sizeBytes?: number;
  sizeError?: string | null;
  error?: string | null;
}

const SUPPORTED_MIME_TYPES = ["audio/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg"];
const SUPPORTED_AUDIO_LABELS = Array.from(
  new Set(
    SUPPORTED_MIME_TYPES.map((type) => {
      const [, subtype] = type.split("/");
      return (subtype || type).toUpperCase();
    })
  )
);
const AUDIO_EXTENSION_REGEX = /\.(webm|mp3|wav|m4a|aac|ogg)$/i;

const looksLikeAudioUrl = (value: string) =>
  /^https?:\/\//i.test(value) || value.startsWith("data:audio/") || AUDIO_EXTENSION_REGEX.test(value);

const safeNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const tryParseJson = (raw: string): unknown | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!["{", "["].includes(trimmed[0])) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const normalizeSourceMeta = (input: unknown): AudioSourceMeta | null => {
  if (!input) return null;
  if (typeof input === "string") {
    return looksLikeAudioUrl(input) ? { url: input } : null;
  }
  if (typeof input === "object") {
    const candidate = input as Record<string, any>;
    const url = typeof candidate.url === "string" ? candidate.url : typeof candidate.href === "string" ? candidate.href : undefined;
    if (!url) return null;
    return {
      url,
      mimeType: candidate.mimeType || candidate.type || candidate.format || candidate.contentType,
      label: candidate.label || candidate.quality || candidate.name,
    };
  }
  return null;
};

const dedupeSources = (sources: AudioSourceMeta[]) => {
  const seen = new Map<string, AudioSourceMeta>();
  sources.forEach((source) => {
    if (!source?.url) return;
    if (!seen.has(source.url)) {
      seen.set(source.url, source);
    }
  });
  return Array.from(seen.values());
};

const normalizeRecordingAnswer = (
  value: unknown,
  fallbackTranscript?: string
): OralRecordingBundle | null => {
  if (value == null) {
    return fallbackTranscript ? { transcript: fallbackTranscript, sources: [] } : null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizeRecordingAnswer(entry, fallbackTranscript);
      if (normalized?.sources?.length) return normalized;
    }
    return fallbackTranscript ? { transcript: fallbackTranscript, sources: [] } : null;
  }

  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    if (parsed) {
      return normalizeRecordingAnswer(parsed, fallbackTranscript);
    }
    if (looksLikeAudioUrl(value)) {
      return { transcript: fallbackTranscript, sources: [{ url: value }] };
    }
    return {
      transcript: value,
      sources: [],
    };
  }

  if (typeof value === "object") {
    const record = value as Record<string, any>;
    const candidateSources: AudioSourceMeta[] = [];
    const tryPush = (source: AudioSourceMeta | null) => {
      if (source?.url) {
        candidateSources.push(source);
      }
    };

    if (typeof record.audioUrl === "string") {
      candidateSources.push({
        url: record.audioUrl,
        mimeType: record.mimeType || record.audioMimeType || record.audioType,
      });
    }
    if (typeof record.recordingUrl === "string") {
      candidateSources.push({
        url: record.recordingUrl,
        mimeType: record.recordingMime || record.mimeType,
      });
    }
    if (typeof record.url === "string") {
      candidateSources.push({
        url: record.url,
        mimeType: record.mimeType || record.type,
        label: record.label,
      });
    }
    if (typeof record.blobUrl === "string") {
      candidateSources.push({ url: record.blobUrl, mimeType: record.mimeType });
    }
    [
      record.source,
      record.file,
      record.primary,
      record.original,
    ].forEach((entry) => tryPush(normalizeSourceMeta(entry)));

    (record.sources || record.formats || record.alternatives || record.variants || record.files)?.forEach?.((entry: unknown) => {
      tryPush(normalizeSourceMeta(entry));
    });

    const transcript =
      typeof record.transcript === "string"
        ? record.transcript
        : typeof record.answer === "string"
        ? record.answer
        : fallbackTranscript;

    const sizeBytes =
      safeNumber(record.sizeBytes) ??
      safeNumber(record.fileSize) ??
      safeNumber(record.file_size) ??
      safeNumber(record.metadata?.sizeBytes);

    const durationMs =
      safeNumber(record.durationMs) ??
      safeNumber(record.duration) ??
      safeNumber(record.metadata?.durationMs);

    return {
      transcript,
      sources: dedupeSources(candidateSources),
      sizeBytes,
      durationMs,
    };
  }

  return fallbackTranscript ? { transcript: fallbackTranscript, sources: [] } : null;
};

const formatFileSize = (bytes?: number) => {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const formatDuration = (seconds?: number) => {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const clampStudentRating = (value: number) => Math.min(5, Math.max(1, Math.round(value)));

const renderStudentStars = (value: number) => {
  const clamped = clampStudentRating(value);
  const filled = "⭐".repeat(clamped);
  const empty = "☆".repeat(5 - clamped);
  return { stars: `${filled}${empty}`, clamped };
};

const resolveAnswerText = (value: AnswerValue) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.transcript === "string") return value.transcript;
    if (typeof value.answer === "string") return value.answer;
    if (typeof value.value === "string") return value.value;
  }
  return "";
};

const fetchFileSize = async (url: string, signal?: AbortSignal) => {
  const response = await fetch(url, { method: "HEAD", signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const length = response.headers.get("content-length");
  return length ? Number(length) : undefined;
};

interface Question {
  id: string;
  type: "short" | "multiple" | "oral";
  text: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  questions: Question[];
  createdAt?: string;
}

interface StudentResponse {
  id: string;
  assignment_id: string;
  studentName: string;
  jNumber: string;
  answers: Record<string, AnswerValue>;
  transcripts: Record<string, string>;
  submittedAt: string;
  audioResponses?: Record<string, AnswerValue>;
  grade?: number | null;
  student_accuracy_rating?: number | string | null;
  student_rating_comment?: string | null;
}

interface GradingQuestionResult {
  question_id?: string;
  question_type?: string;
  points_possible?: number | null;
  auto_score?: number | null;
  feedback?: string | null;
  strengths?: string | null;
  missing_points?: string | null;
  confidence?: number | null;
  source?: string | null;
  grading_method?: string | null;
  expected_answer?: string | null;
  needs_review?: boolean;
  [key: string]: unknown;
}

interface GradingResult {
  id: string;
  response_id: string;
  status: string;
  total_score?: number | null;
  max_score?: number | null;
  percentage?: number | null;
  question_results?: GradingQuestionResult[] | Record<string, unknown> | null;
  summary_feedback?: string | null;
  error_message?: string | null;
  grader_version?: string | null;
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string | null;
  approved_at?: string | null;
  approved_score?: number | null;
  approved_by?: string | null;
}

type GradingRequestStatus = "idle" | "loading" | "error";

const parseApiPayload = async (response: globalThis.Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const extractApiErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (record.detail) return JSON.stringify(record.detail);
  }
  return fallback;
};

const formatGradingNumber = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const normalizeQuestionResults = (
  value?: GradingResult["question_results"]
): GradingQuestionResult[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is GradingQuestionResult => Boolean(item) && typeof item === "object"
    );
  }
  if (typeof value === "object") {
    return Object.values(value).filter(
      (item): item is GradingQuestionResult => Boolean(item) && typeof item === "object"
    );
  }
  return [];
};

const getGradingStatusClass = (status?: string) => {
  switch (status) {
    case "completed":
      return "border-green-200 bg-green-50 text-green-700";
    case "approved":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "reviewed":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
};

const ViewSubmissions = () => {
  const [submissions, setSubmissions] = useState<StudentResponse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentResponse | null>(null);
  const [filterAssignment, setFilterAssignment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "assignment">("date");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedAssignmentId, setCopiedAssignmentId] = useState<string | null>(null);
  const [audioStates, setAudioStates] = useState<Record<string, AudioMetaState>>({});
  const [gradingResults, setGradingResults] = useState<Record<string, GradingResult | null>>({});
  const [gradingStatus, setGradingStatus] = useState<Record<string, GradingRequestStatus>>({});
  const [gradingErrors, setGradingErrors] = useState<Record<string, string | null>>({});
  const [approvalScores, setApprovalScores] = useState<Record<string, string>>({});
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const authedFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    const token = session?.access_token;
    if (!token) throw new Error("You are not logged in. Please login again.");

    const headers = new Headers(init.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(url, { ...init, headers });
  }, []);

  const storeGradingResult = useCallback((responseId: string, result: GradingResult | null) => {
    setGradingResults((prev) => ({
      ...prev,
      [responseId]: result,
    }));

    if (!result) return;

    const defaultScore = result.approved_score ?? result.total_score;
    setApprovalScores((prev) => ({
      ...prev,
      [responseId]:
        typeof defaultScore === "number" && Number.isFinite(defaultScore)
          ? String(defaultScore)
          : prev[responseId] ?? "",
    }));
  }, []);

  const getAssignmentLink = (assignmentId: string) =>
    `${FRONTEND_ASSIGNMENT_URL}/${assignmentId}`;

  const handleCopyAssignmentLink = async (assignmentId: string) => {
    const link = getAssignmentLink(assignmentId);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setCopiedAssignmentId(assignmentId);
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch (error) {
      console.warn("Failed to copy assignment link automatically.", error);
      if (typeof window !== "undefined") {
        window.prompt("Copy assignment link:", link);
      }
    }
  };

  useEffect(() => {
    if (!copiedAssignmentId) return;
    const timer = setTimeout(() => setCopiedAssignmentId(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedAssignmentId]);

  const activeAssignment = useMemo(
    () => (selected ? assignments.find((a) => a.id === selected.assignment_id) ?? null : null),
    [assignments, selected]
  );

  const oralResponsePayloads = useMemo(() => {
    if (!selected || !activeAssignment) return {};
    return activeAssignment.questions
      .filter((question) => question.type === "oral")
      .reduce<Record<string, OralRecordingBundle | null>>((acc, question) => {
        const fallbackTranscript = selected.transcripts?.[question.id];
        const audioCandidate =
          selected.audioResponses?.[question.id] ??
          selected.answers?.[question.id];
        acc[question.id] = normalizeRecordingAnswer(audioCandidate, fallbackTranscript);
        return acc;
      }, {});
  }, [selected, activeAssignment]);

  useEffect(() => {
    if (!selected || !activeAssignment) {
      setAudioStates({});
      audioRefs.current = {};
      return;
    }

    const nextAudioStates: Record<string, AudioMetaState> = {};
    activeAssignment.questions
      .filter((q) => q.type === "oral")
      .forEach((question) => {
        const payload = oralResponsePayloads[question.id];
        if (payload?.sources?.length) {
          nextAudioStates[question.id] = {
            status: "loading",
            duration: payload.durationMs ? payload.durationMs / 1000 : undefined,
            sizeBytes: payload.sizeBytes,
            error: null,
          };
        } else {
          nextAudioStates[question.id] = {
            status: "error",
            error: "No audio recording attached.",
          };
        }
      });
    setAudioStates(nextAudioStates);

    audioRefs.current = {};
  }, [selected, activeAssignment, oralResponsePayloads]);

  const requestFileSize = useCallback(
    (questionId: string, url: string, signal?: AbortSignal) => {
      if (!url) return;
      setAudioStates((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], sizeError: null },
      }));
      fetchFileSize(url, signal)
        .then((size) => {
          if (size == null) return;
          setAudioStates((prev) => ({
            ...prev,
            [questionId]: { ...prev[questionId], sizeBytes: size },
          }));
        })
        .catch((error) => {
          if (signal?.aborted) return;
          setAudioStates((prev) => ({
            ...prev,
            [questionId]: {
              ...prev[questionId],
              sizeError: error instanceof Error ? error.message : "Unable to fetch file size.",
            },
          }));
        });
    },
    []
  );

  useEffect(() => {
    if (!selected || !activeAssignment) return;
    const controller = new AbortController();
    Object.entries(oralResponsePayloads).forEach(([questionId, payload]) => {
      if (!payload?.sources?.length || payload.sizeBytes) return;
      const primaryUrl = payload.sources[0]?.url;
      if (!primaryUrl) return;
      requestFileSize(questionId, primaryUrl, controller.signal);
    });
    return () => controller.abort();
  }, [selected, activeAssignment, oralResponsePayloads, requestFileSize]);

  const handleAudioMetadataLoaded = (questionId: string, duration: number) => {
    setAudioStates((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        status: "ready",
        duration: Number.isFinite(duration) ? duration : prev[questionId]?.duration,
      },
    }));
  };

  const handleAudioError = (questionId: string, message?: string) => {
    setAudioStates((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        status: "error",
        error: message || "Unable to play audio. Please try again.",
      },
    }));
  };

  const handleRetryAudio = (questionId: string) => {
    const node = audioRefs.current[questionId];
    if (node) {
      node.load();
      setAudioStates((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], status: "loading", error: null },
      }));
    }
  };

  const handlePlayOriginal = (questionId: string) => {
    const node = audioRefs.current[questionId];
    if (!node) return;
    const playPromise = node.play();
    if (playPromise instanceof Promise) {
      playPromise.catch((error) => {
        handleAudioError(questionId, error instanceof Error ? error.message : "Playback failed.");
      });
    }
  };

  const handleRetryMetadata = (questionId: string) => {
    const source = oralResponsePayloads[questionId]?.sources?.[0];
    if (source?.url) {
      requestFileSize(questionId, source.url);
    }
  };

  // Load all responses + assignments from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const assignRes = await authedFetch(`${BASE_URL}/assignments/`);
        const assignData = await assignRes.json();
        setAssignments(Array.isArray(assignData) ? assignData : []);

        const respRes = await authedFetch(`${BASE_URL}/responses/`);
        const respData = await respRes.json();
        setSubmissions(Array.isArray(respData) ? respData : []);
      } catch (err) {
        console.error("❌ Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authedFetch]);

  useEffect(() => {
    if (!selected) return;
    if (Object.prototype.hasOwnProperty.call(gradingResults, selected.id)) return;

    let isCancelled = false;

    const fetchExistingGradingResult = async () => {
      try {
        const response = await authedFetch(`${BASE_URL}/responses/${selected.id}/grading-result`);

        if (response.status === 404) {
          if (!isCancelled) storeGradingResult(selected.id, null);
          return;
        }

        const payload = await parseApiPayload(response);
        if (!response.ok) {
          throw new Error(
            extractApiErrorMessage(payload, "Failed to load automatic grading result.")
          );
        }

        if (!isCancelled) {
          storeGradingResult(selected.id, payload as GradingResult);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error("❌ Failed to load grading result:", error);
        setGradingErrors((prev) => ({
          ...prev,
          [selected.id]:
            error instanceof Error
              ? error.message
              : "Failed to load automatic grading result.",
        }));
      }
    };

    fetchExistingGradingResult();

    return () => {
      isCancelled = true;
    };
  }, [selected, gradingResults, authedFetch, storeGradingResult]);

  const handleGradeAutomatically = async (submission: StudentResponse) => {
    setSelected(submission);
    setGradingStatus((prev) => ({ ...prev, [submission.id]: "loading" }));
    setGradingErrors((prev) => ({ ...prev, [submission.id]: null }));

    try {
      const response = await authedFetch(`${BASE_URL}/responses/${submission.id}/grade`, {
        method: "POST",
      });
      const payload = await parseApiPayload(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(payload, "Automatic grading failed."));
      }

      storeGradingResult(submission.id, payload as GradingResult);
      setGradingStatus((prev) => ({ ...prev, [submission.id]: "idle" }));
    } catch (error) {
      console.error("❌ Automatic grading failed:", error);
      setGradingErrors((prev) => ({
        ...prev,
        [submission.id]:
          error instanceof Error ? error.message : "Automatic grading failed.",
      }));
      setGradingStatus((prev) => ({ ...prev, [submission.id]: "error" }));
    }
  };

  const handleApproveGrade = async (submission: StudentResponse) => {
    const rawScore = approvalScores[submission.id] ?? "";
    const approvedScore = Number(rawScore);

    if (!rawScore.trim() || !Number.isFinite(approvedScore) || approvedScore < 0) {
      setGradingErrors((prev) => ({
        ...prev,
        [submission.id]: "Enter a valid approved score before approving.",
      }));
      return;
    }

    setApprovingIds((prev) => ({ ...prev, [submission.id]: true }));
    setGradingErrors((prev) => ({ ...prev, [submission.id]: null }));

    try {
      const response = await authedFetch(
        `${BASE_URL}/responses/${submission.id}/grading-result/review`,
        {
          method: "POST",
          body: JSON.stringify({
            approved_score: approvedScore,
            approved: true,
          }),
        }
      );
      const payload = await parseApiPayload(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(payload, "Failed to approve grade."));
      }

      const result = payload as GradingResult;
      const finalScore = result.approved_score ?? approvedScore;
      storeGradingResult(submission.id, result);
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === submission.id ? { ...item, grade: finalScore } : item
        )
      );
      setSelected((prev) =>
        prev?.id === submission.id ? { ...prev, grade: finalScore } : prev
      );
    } catch (error) {
      console.error("❌ Failed to approve grade:", error);
      setGradingErrors((prev) => ({
        ...prev,
        [submission.id]:
          error instanceof Error ? error.message : "Failed to approve grade.",
      }));
    } finally {
      setApprovingIds((prev) => ({ ...prev, [submission.id]: false }));
    }
  };

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filter by assignment
    if (filterAssignment !== "all") {
      filtered = filtered.filter(sub => sub.assignment_id === filterAssignment);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.studentName.toLowerCase().includes(term) ||
        sub.jNumber.toLowerCase().includes(term) ||
        assignments.find(a => a.id === sub.assignment_id)?.title.toLowerCase().includes(term)
      );
    }

    // Sort submissions
    filtered = [...filtered].sort((a, b) => {
      const assignmentA = assignments.find(asg => asg.id === a.assignment_id);
      const assignmentB = assignments.find(asg => asg.id === b.assignment_id);

      switch (sortBy) {
        case "name":
          return a.studentName.localeCompare(b.studentName);
        case "assignment":
          return (assignmentA?.title || "").localeCompare(assignmentB?.title || "");
        case "date":
        default:
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
    });

    return filtered;
  }, [submissions, assignments, filterAssignment, sortBy, searchTerm]);

    // Group assignments by class (you can enhance this with actual class data later)
    const assignmentGroups = useMemo(() => {
      // For now, we'll group by assignment title pattern or you can add a "class" field later
      const groups: Record<string, Assignment[]> = {};

      assignments.forEach((assignment) => {
        // Simple grouping by first word of title (you can change this logic)
        const groupName = assignment.title.split(" ")[0] || "Other";
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(assignment);
      });

      return groups;
    }, [assignments]);

    const selectedStudentRatingValue = selected ? safeNumber(selected.student_accuracy_rating) : undefined;
    const selectedStudentRatingDisplay =
      typeof selectedStudentRatingValue === "number" && selectedStudentRatingValue > 0
        ? renderStudentStars(selectedStudentRatingValue)
        : null;
    const selectedStudentRatingComment =
      typeof selected?.student_rating_comment === "string" ? selected.student_rating_comment.trim() : "";

  const handleDeleteAssignment = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this assignment? All submissions will be lost."
    );
    if (!confirmDelete) return;

    setDeleteFeedback(null);
    setDeletingAssignmentId(assignmentId);

    try {
      const response = await authedFetch(`${BASE_URL}/assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete assignment.";

        if (errorText) {
          try {
            const parsed = JSON.parse(errorText);
            errorMessage = parsed?.message || errorMessage;
          } catch {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setSubmissions(prev => prev.filter(sub => sub.assignment_id !== assignmentId));

      if (filterAssignment === assignmentId) {
        setFilterAssignment("all");
      }

      setDeleteFeedback({
        type: "success",
        message: `"${assignment?.title || "Assignment"}" deleted successfully.`,
      });
    } catch (error) {
      console.error("❌ Failed to delete assignment:", error);
      setDeleteFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete assignment. Please try again.",
      });
    } finally {
      setDeletingAssignmentId(null);
    }
  };

  const renderGradingPanel = (submission: StudentResponse) => {
    const result = gradingResults[submission.id] ?? null;
    const questionResults = normalizeQuestionResults(result?.question_results);
    const isGrading = gradingStatus[submission.id] === "loading";
    const isApproving = Boolean(approvingIds[submission.id]);
    const localError = gradingErrors[submission.id];
    const approvedScore = approvalScores[submission.id] ?? "";
    const isApproved = result?.status === "approved" || Boolean(result?.approved_at);

    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Automatic Grading</h4>
            {result?.grader_version && (
              <p className="mt-1 text-xs text-gray-500">{result.grader_version}</p>
            )}
          </div>
          <button
            onClick={() => handleGradeAutomatically(submission)}
            disabled={isGrading}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              isGrading
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isGrading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            )}
            {isGrading ? "Grading..." : "Grade Automatically"}
          </button>
        </div>

        {localError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Status</p>
                <span
                  className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getGradingStatusClass(
                    result.status
                  )}`}
                >
                  {result.status || "unknown"}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Score</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatGradingNumber(result.total_score)} / {formatGradingNumber(result.max_score)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Percentage</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {typeof result.percentage === "number"
                    ? `${formatGradingNumber(result.percentage)}%`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Approved</p>
                <p className={`mt-1 text-sm font-semibold ${isApproved ? "text-green-700" : "text-gray-500"}`}>
                  {isApproved ? "Yes" : "Not yet"}
                </p>
              </div>
            </div>

            {result.summary_feedback && (
              <div className="rounded-md border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Summary Feedback</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                  {result.summary_feedback}
                </p>
              </div>
            )}

            {result.error_message && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold uppercase text-red-700">Error</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                  {result.error_message}
                </p>
              </div>
            )}

            {questionResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Question Results</p>
                {questionResults.map((questionResult, index) => (
                  <div
                    key={`${questionResult.question_id || "question"}-${index}`}
                    className="rounded-md border border-gray-200 bg-white p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Question {index + 1}
                          {questionResult.question_id ? ` · ${questionResult.question_id}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                          {questionResult.question_type && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 capitalize">
                              {questionResult.question_type}
                            </span>
                          )}
                          {questionResult.grading_method && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 capitalize">
                              {questionResult.grading_method}
                            </span>
                          )}
                          {questionResult.source && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 capitalize">
                              {questionResult.source}
                            </span>
                          )}
                          {questionResult.needs_review && (
                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-800">
                              Needs review
                            </span>
                          )}
                          {typeof questionResult.confidence === "number" && (
                            <span className="rounded-full bg-gray-100 px-2 py-1">
                              Confidence {Math.round(questionResult.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatGradingNumber(questionResult.auto_score)} /{" "}
                        {formatGradingNumber(questionResult.points_possible)}
                      </p>
                    </div>
                    {questionResult.feedback && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {questionResult.feedback}
                      </p>
                    )}
                    {(questionResult.strengths || questionResult.missing_points) && (
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {questionResult.strengths && (
                          <div className="rounded-md bg-green-50 p-2 text-sm text-green-800">
                            <p className="text-xs font-semibold uppercase text-green-700">
                              Strengths
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {questionResult.strengths}
                            </p>
                          </div>
                        )}
                        {questionResult.missing_points && (
                          <div className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">
                            <p className="text-xs font-semibold uppercase text-amber-700">
                              Missing Points
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">
                              {questionResult.missing_points}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {questionResult.expected_answer && (
                      <p className="mt-2 text-xs text-gray-500">
                        Expected answer: {questionResult.expected_answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="sm:w-48">
                  <label className="block text-sm font-medium text-gray-700" htmlFor={`approved-score-${submission.id}`}>
                    Approved Score
                  </label>
                  <input
                    id={`approved-score-${submission.id}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={approvedScore}
                    onChange={(event) =>
                      setApprovalScores((prev) => ({
                        ...prev,
                        [submission.id]: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleApproveGrade(submission)}
                  disabled={isApproving}
                  className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                    isApproving
                      ? "cursor-not-allowed bg-gray-200 text-gray-500"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isApproving ? "Approving..." : "Approve Grade"}
                </button>
              </div>
              {isApproved && (
                <p className="mt-3 text-sm font-medium text-green-700">
                  Grade approved
                  {result.approved_at ? ` on ${new Date(result.approved_at).toLocaleString()}` : ""}.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {isGrading ? "Grading this submission..." : "No automatic grading result yet."}
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Student Submissions</h1>
          <p className="text-gray-600 mt-1">
            {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <input
              type="text"
              placeholder="Search by name or JNumber..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter by Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Assignment
            </label>
            <select
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Assignments</option>
              {assignments.map(assignment => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Submission Date</option>
              <option value="name">Student Name</option>
              <option value="assignment">Assignment Title</option>
            </select>
          </div>

          {/* Quick Stats */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-800 font-medium">Total Submissions</div>
            <div className="text-2xl font-bold text-blue-900">{submissions.length}</div>
          </div>
        </div>
      </div>

        {/* Class Groups Section (Optional) */}
        {Object.keys(assignmentGroups).length > 1 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Classes/Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(assignmentGroups).map(([groupName, groupAssignments]) => (
                <div key={groupName} className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-2">{groupName}</h3>
                  <p className="text-sm text-gray-600">
                    {groupAssignments.length} assignment{groupAssignments.length !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 space-y-1">
                    {groupAssignments.map(assignment => (
                      <div key={assignment.id} className="text-xs text-gray-500 truncate">
                        • {assignment.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments List */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
              <p className="text-sm text-gray-600">
                Manage assignments and remove those you no longer need.
              </p>
            </div>
            <span className="text-sm text-gray-500">{assignments.length} total</span>
          </div>

          {deleteFeedback && (
            <div
              className={`mb-4 rounded-md border px-4 py-3 text-sm ${
                deleteFeedback.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
              role="alert"
            >
              {deleteFeedback.message}
            </div>
          )}

            {assignments.length === 0 ? (
              <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
                No assignments available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment) => {
                  const assignmentLink = getAssignmentLink(assignment.id);
                  return (
                    <div
                      key={assignment.id}
                      className="bg-white border rounded-lg shadow-sm p-4 flex flex-col"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                        )}
                        <div className="mt-3 text-sm text-gray-500 space-y-1">
                          {assignment.dueDate && (
                            <p>Due {new Date(assignment.dueDate).toLocaleDateString()}</p>
                          )}
                          <p>{assignment.questions?.length || 0} question{assignment.questions?.length !== 1 ? "s" : ""}</p>
                          {assignment.createdAt && (
                            <p>Created {new Date(assignment.createdAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                              Assignment Link
                            </p>
                            <a
                              href={assignmentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-700 break-all hover:underline"
                            >
                              {assignmentLink}
                            </a>
                          </div>
                          <button
                            onClick={() => handleCopyAssignmentLink(assignment.id)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-200 transition-colors hover:bg-blue-50"
                          >
                            Copy Link
                          </button>
                        </div>
                        {copiedAssignmentId === assignment.id && (
                          <p className="mt-2 text-xs font-semibold text-green-600">Link copied!</p>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          disabled={deletingAssignmentId === assignment.id}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            deletingAssignmentId === assignment.id
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {deletingAssignmentId === assignment.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

      {/* Submissions Table */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-600">
            {searchTerm || filterAssignment !== "all" 
              ? "Try adjusting your filters or search terms."
              : "Students haven't submitted any work yet."
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    J Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubmissions.map((sub) => {
                  const assignment = assignments.find(a => a.id === sub.assignment_id);
                  const studentRatingValue = safeNumber(sub.student_accuracy_rating);
                  const hasStudentRating = typeof studentRatingValue === "number" && studentRatingValue > 0;
                  const studentRatingDisplay = hasStudentRating ? renderStudentStars(studentRatingValue) : null;
                  const studentRatingComment = sub.student_rating_comment?.trim();
                  const rowGradingResult = gradingResults[sub.id] ?? null;
                  const rowIsGrading = gradingStatus[sub.id] === "loading";
                  const rowGradingError = gradingErrors[sub.id];
                  const rowApproved =
                    rowGradingResult?.status === "approved" || Boolean(rowGradingResult?.approved_at);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{sub.studentName}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{sub.jNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {assignment?.title || "Unknown Assignment"}
                        </div>
                        {assignment?.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {assignment.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(sub.submittedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {studentRatingDisplay ? (
                          <div className="space-y-1">
                            <p className="font-medium text-gray-800">
                              Student Rating:{" "}
                              <span className="text-yellow-600">
                                {studentRatingDisplay.stars} ({studentRatingDisplay.clamped}/5)
                              </span>
                            </p>
                            {studentRatingComment && (
                              <p className="text-gray-600">
                                Student Comment: <span className="text-gray-800">{studentRatingComment}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">No student rating yet</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleGradeAutomatically(sub)}
                              disabled={rowIsGrading}
                              className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                                rowIsGrading
                                  ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {rowIsGrading ? "Grading..." : "Grade Automatically"}
                            </button>
                            <button
                              onClick={() => setSelected(sub)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                          {rowGradingResult && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={`rounded-full border px-2 py-1 font-semibold capitalize ${getGradingStatusClass(
                                  rowGradingResult.status
                                )}`}
                              >
                                {rowGradingResult.status}
                              </span>
                              <span className="text-gray-600">
                                {formatGradingNumber(rowGradingResult.total_score)} /{" "}
                                {formatGradingNumber(rowGradingResult.max_score)}
                              </span>
                              {rowApproved && (
                                <span className="font-semibold text-green-700">Approved</span>
                              )}
                            </div>
                          )}
                          {rowGradingError && (
                            <p className="max-w-xs text-xs text-red-600">{rowGradingError}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for viewing submission details */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    🧑‍🎓 {selected.studentName} ({selected.jNumber})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Submitted: {new Date(selected.submittedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {activeAssignment ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-blue-900">
                        {activeAssignment.title}
                      </h3>
                      {activeAssignment.description && (
                        <p className="text-blue-700 mt-1">
                          {activeAssignment.description}
                        </p>
                      )}
                    </div>

                    {renderGradingPanel(selected)}

                    {activeAssignment.questions.map((q, i) => {
                        const answerValue = selected.answers?.[q.id];
                        const answerText = resolveAnswerText(answerValue);
                        const isOral = q.type === "oral";
                        const oralBundle = isOral ? oralResponsePayloads[q.id] : null;
                        const audioState = isOral ? audioStates[q.id] : undefined;
                        const transcriptText = isOral
                          ? oralBundle?.transcript ?? selected.transcripts?.[q.id] ?? "No transcript available."
                          : "";
                        const formatBadges = isOral
                          ? ((oralBundle?.sources || [])
                              .map((source) => {
                                if (source.mimeType) {
                                  const [, subtype] = source.mimeType.split("/");
                                  return (subtype || source.mimeType).toUpperCase();
                                }
                                const ext = source.url.split(".").pop();
                                return ext ? ext.toUpperCase() : null;
                              })
                              .filter(Boolean) as string[])
                          : [];
                        const availableFormats = isOral
                          ? formatBadges.length > 0
                            ? formatBadges.join(" · ")
                            : SUPPORTED_AUDIO_LABELS.join(" · ")
                          : "";
                        const hasAudioSources = isOral ? Boolean(oralBundle?.sources?.length) : false;

                      return (
                        <div key={q.id} className="border-l-4 border-blue-500 pl-4 py-2 space-y-4">
                          <p className="font-medium text-gray-800 mb-2">
                            {i + 1}. {q.text}
                          </p>

                          {q.type === "short" && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {answerText || "No answer provided."}
                              </p>
                            </div>
                          )}

                          {q.type === "multiple" && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-gray-700">
                                Selected: <strong>{answerText || "No answer selected."}</strong>
                              </p>
                            </div>
                          )}

                          {isOral && (
                            <div className="space-y-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="bg-purple-50 rounded-lg p-3">
                                  <p className="text-sm text-purple-700 font-medium mb-1">
                                    🎙️ Oral Response Transcript
                                  </p>
                                  <p className="text-gray-700 whitespace-pre-wrap">
                                    {transcriptText}
                                  </p>
                                </div>
                                <div className="rounded-lg border bg-white p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                      Original Recording
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Supports {SUPPORTED_AUDIO_LABELS.join(" · ")}
                                    </p>
                                  </div>

                                  {hasAudioSources ? (
                                    <>
                                      {audioState?.status === "loading" && (
                                        <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                          <span>Loading audio metadata…</span>
                                        </div>
                                      )}
                                      <audio
                                        ref={(node) => {
                                          if (node) {
                                            audioRefs.current[q.id] = node;
                                          } else {
                                            delete audioRefs.current[q.id];
                                          }
                                        }}
                                        className="w-full"
                                        preload="metadata"
                                        controls
                                        onLoadedMetadata={(event) =>
                                          handleAudioMetadataLoaded(q.id, event.currentTarget.duration)
                                        }
                                        onError={() => handleAudioError(q.id)}
                                      >
                                        {oralBundle?.sources?.map((source, idx) => (
                                          <source
                                            key={`${source.url}-${idx}`}
                                            src={source.url}
                                            type={source.mimeType}
                                          />
                                        ))}
                                        Your browser does not support audio playback.
                                      </audio>
                                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                                        <span>
                                          Duration:{" "}
                                          {formatDuration(
                                            audioState?.duration ??
                                              (oralBundle?.durationMs ? oralBundle.durationMs / 1000 : undefined)
                                          )}
                                        </span>
                                        <span>
                                          File Size:{" "}
                                          {audioState?.sizeBytes
                                            ? formatFileSize(audioState.sizeBytes)
                                            : oralBundle?.sizeBytes
                                            ? formatFileSize(oralBundle.sizeBytes)
                                            : audioState?.sizeError
                                            ? `Unavailable (${audioState.sizeError})`
                                            : "Calculating…"}
                                        </span>
                                      </div>
                                      {audioState?.sizeError && (
                                        <button
                                          onClick={() => handleRetryMetadata(q.id)}
                                          className="mt-2 text-sm text-blue-600 hover:underline"
                                        >
                                          Retry metadata lookup
                                        </button>
                                      )}
                                      {audioState?.error && (
                                        <div className="mt-3 space-y-2">
                                          <p className="text-sm text-red-600">{audioState.error}</p>
                                          <button
                                            onClick={() => handleRetryAudio(q.id)}
                                            className="text-sm text-blue-600 underline"
                                          >
                                            Retry playback
                                          </button>
                                        </div>
                                      )}
                                      <div className="mt-4 flex flex-wrap gap-3">
                                        <button
                                          onClick={() => handlePlayOriginal(q.id)}
                                          disabled={audioState?.status !== "ready"}
                                          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          Play Original Recording
                                        </button>
                                        {oralBundle?.sources?.map((source, idx) => (
                                          <a
                                            key={`download-${source.url}-${idx}`}
                                            href={source.url}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                          >
                                            Download{" "}
                                            {source.label ||
                                              (source.mimeType
                                                ? source.mimeType.split("/").pop()?.toUpperCase()
                                                : `File ${idx + 1}`)}
                                          </a>
                                        ))}
                                      </div>
                                      <p className="mt-3 text-xs text-gray-500">
                                        Available formats: {availableFormats}
                                      </p>
                                    </>
                                  ) : (
                                    <div className="text-sm text-gray-600">
                                      No recording on file for this response.
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}

                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <h4 className="text-lg font-semibold text-yellow-900 mb-2">Student Self-Rating</h4>
                        {selectedStudentRatingDisplay ? (
                          <div className="space-y-2 text-yellow-900">
                            <p className="font-medium">
                              Student Rating:{" "}
                              <span className="text-xl">{selectedStudentRatingDisplay.stars}</span>{" "}
                              <span className="text-sm text-yellow-800">
                                ({selectedStudentRatingDisplay.clamped}/5)
                              </span>
                            </p>
                            {selectedStudentRatingComment && (
                              <p className="text-sm">
                                Student Comment:{" "}
                                <span className="font-medium text-yellow-900">
                                  {selectedStudentRatingComment}
                                </span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-yellow-900">No student rating yet.</p>
                        )}
                      </div>
                  </div>
                ) : (
                  <p className="text-red-500 text-center py-8">
                    ⚠️ Assignment data not found
                  </p>
                )}
              </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelected(null)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSubmissions;
