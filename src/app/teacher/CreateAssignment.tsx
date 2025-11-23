import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
} from "react";
import { nanoid } from "nanoid";
import { BASE_URL } from "@/config";

type QType = "short" | "multiple" | "oral";
type MediaType = "image" | "video" | null;

interface Question {
  id: string;
  type: QType;
  text: string;
  media?: { url: string; type: MediaType };
  options?: string[];
  correctOption?: number;
  points?: number;
  required?: boolean;
  timeLimit?: number; // seconds, for ALL question types
}

function newQuestion(type: QType = "short"): Question {
  const id = nanoid();
  if (type === "multiple") {
    return { id, type, text: "", options: ["", ""], points: 1, required: false };
  }
  if (type === "oral") {
    return { id, type, text: "", points: 1, required: false, timeLimit: 60 };
  }
  return { id, type, text: "", points: 1, required: false };
}

// -------- Time helpers (shared by all timers) --------
const formatSeconds = (total: number) => {
  if (!Number.isFinite(total) || total <= 0) return "";
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}`;
};

const parseTimeToSeconds = (val: string): number | null => {
  const v = val.trim();
  if (!v) return null;

  if (v.includes(":")) {
    const [mStr, sStr = "0"] = v.split(":");
    const m = Number(mStr);
    const s = Number(sStr);
    if (Number.isNaN(m) || Number.isNaN(s) || m < 0 || s < 0) return null;
    return m * 60 + s;
  }

  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.floor(n);
};

interface AssignmentDraftPayload {
  title: string;
  description: string;
  isQuiz: boolean;
  dueDate: string;
  assignmentTimeLimit: number | null;
  assignmentTimeInput: string;
  questions: Question[];
  timeInputs: Record<string, string>;
}

type DraftStatus = "idle" | "loading" | "saving" | "saved" | "offline" | "error";

const AUTOSAVE_INTERVAL_MS = 30_000;
const DRAFT_STORAGE_KEY = "teacher-create-assignment-draft";
const isBrowser = typeof window !== "undefined";

const normalizeDraftPayload = (
  raw?: Partial<AssignmentDraftPayload> | null
): AssignmentDraftPayload => {
  const normalizedQuestions =
    raw?.questions && raw.questions.length > 0
      ? raw.questions.map((question) => {
          const type: QType = (question.type as QType) ?? "short";
          const normalized: Question = {
            ...question,
            id: question.id || nanoid(),
            type,
            text: question.text ?? "",
          };

          if (type === "multiple") {
            normalized.options =
              question.options && question.options.length >= 2
                ? question.options
                : ["", ""];
          } else {
            normalized.options = undefined;
            normalized.correctOption = undefined;
          }

          if (
            typeof normalized.timeLimit !== "number" ||
            normalized.timeLimit <= 0
          ) {
            normalized.timeLimit = undefined;
          }

          return normalized;
        })
      : [newQuestion("short")];

  const assignmentTimeLimit =
    typeof raw?.assignmentTimeLimit === "number" && raw.assignmentTimeLimit > 0
      ? raw.assignmentTimeLimit
      : null;

  const sanitizedTimeInputs: Record<string, string> = {};
  if (raw?.timeInputs) {
    for (const [key, value] of Object.entries(raw.timeInputs)) {
      if (typeof value === "string") {
        sanitizedTimeInputs[key] = value;
      }
    }
  }

  return {
    title: raw?.title ?? "",
    description: raw?.description ?? "",
    isQuiz: raw?.isQuiz ?? false,
    dueDate: raw?.dueDate ?? "",
    assignmentTimeLimit,
    assignmentTimeInput:
      raw?.assignmentTimeInput ??
      (assignmentTimeLimit ? formatSeconds(assignmentTimeLimit) : ""),
    questions: normalizedQuestions,
    timeInputs: sanitizedTimeInputs,
  };
};

const persistLocalDraft = (value: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, value);
  } catch (err) {
    console.warn("Unable to persist draft locally", err);
  }
};

const readLocalDraft = (): AssignmentDraftPayload | null => {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return normalizeDraftPayload(JSON.parse(raw));
  } catch (err) {
    console.warn("Unable to parse local draft", err);
    return null;
  }
};

const removeLocalDraft = () => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn("Unable to remove local draft", err);
  }
};

export default function CreateAssignment() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isQuiz, setIsQuiz] = useState(false);
  const [dueDate, setDueDate] = useState("");

  // assignment-level timer (seconds)
  const [assignmentTimeLimit, setAssignmentTimeLimit] = useState<number | null>(null);
  const [assignmentTimeInput, setAssignmentTimeInput] = useState("");

  const [questions, setQuestions] = useState<Question[]>([newQuestion("short")]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    assignmentId: string;
    shareLink: string;
    questionsCount: number;
  } | null>(null);

  const [timeInputs, setTimeInputs] = useState<Record<string, string>>({});
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [draftErrorMessage, setDraftErrorMessage] = useState<string | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(true);

  const draftPayload = useMemo<AssignmentDraftPayload>(
    () => ({
      title,
      description,
      isQuiz,
      dueDate,
      assignmentTimeLimit,
      assignmentTimeInput,
      questions,
      timeInputs,
    }),
    [
      title,
      description,
      isQuiz,
      dueDate,
      assignmentTimeLimit,
      assignmentTimeInput,
      questions,
      timeInputs,
    ]
  );

  const serializedDraft = useMemo(
    () => JSON.stringify(draftPayload),
    [draftPayload]
  );
  const lastSavedDraftRef = useRef<string>(serializedDraft);

  // keep local timeInputs in sync with question list + timeLimit
  useEffect(() => {
    setTimeInputs((prev) => {
      const next = { ...prev };
      for (const q of questions) {
        if (next[q.id] === undefined) {
          next[q.id] = q.timeLimit ? formatSeconds(q.timeLimit) : "";
        }
      }
      // remove entries for deleted questions
      for (const id of Object.keys(next)) {
        if (!questions.find((q) => q.id === id)) delete next[id];
      }
      return next;
    });
  }, [questions]);

  const applyDraft = useCallback((draft: AssignmentDraftPayload) => {
    setTitle(draft.title ?? "");
    setDescription(draft.description ?? "");
    setIsQuiz(draft.isQuiz ?? false);
    setDueDate(draft.dueDate ?? "");
    setAssignmentTimeLimit(draft.assignmentTimeLimit ?? null);
    setAssignmentTimeInput(draft.assignmentTimeInput ?? "");
    setQuestions(
      draft.questions && draft.questions.length > 0
        ? draft.questions
        : [newQuestion("short")]
    );
    setTimeInputs({ ...(draft.timeInputs ?? {}) });
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await fetch(`${BASE_URL}/assignments/draft`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Failed to clear assignment draft", err);
    } finally {
      removeLocalDraft();
      setDraftStatus("idle");
      setDraftSavedAt(null);
      setDraftErrorMessage(null);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadExistingDraft = async () => {
      setDraftStatus("loading");
      try {
        const response = await fetch(`${BASE_URL}/assignments/draft`, {
          credentials: "include",
        });
        const text = await response.text();
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Draft not found");
          }
          throw new Error(text || `Failed to load draft (${response.status})`);
        }

        if (!isActive) return;
        if (text) {
          const parsed = normalizeDraftPayload(JSON.parse(text));
          applyDraft(parsed);
          const serialized = JSON.stringify(parsed);
          lastSavedDraftRef.current = serialized;
          persistLocalDraft(serialized);
          setDraftStatus("saved");
          setDraftSavedAt(Date.now());
          setDraftErrorMessage(null);
        } else {
          setDraftStatus("idle");
        }
      } catch (err) {
        if (!isActive) return;
        console.warn("Unable to load draft from backend", err);
        const localDraft = readLocalDraft();
        if (localDraft) {
          applyDraft(localDraft);
          const serialized = JSON.stringify(localDraft);
          lastSavedDraftRef.current = serialized;
          setDraftStatus("offline");
          setDraftSavedAt(Date.now());
          setDraftErrorMessage(
            "Working offline — restored your locally saved draft."
          );
        } else {
          setDraftStatus("idle");
        }
      } finally {
        if (isActive) {
          setIsDraftLoading(false);
        }
      }
    };

    loadExistingDraft();
    return () => {
      isActive = false;
    };
  }, [applyDraft]);

  // --------------------------------------------------
  // Basic validation before submit
  // --------------------------------------------------
  const validateAssignment = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (!description.trim()) return "Description is required.";
    if (questions.length === 0) return "At least one question is required.";

    // validate due date if provided
    if (dueDate) {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        return "Due date is not a valid date/time.";
      }
    }

    // reuse your existing per-question checks
    for (const q of questions) {
      if (!q.text.trim()) return "Every question must have text.";
      if (q.type === "multiple") {
        const nonEmpty = (q.options ?? []).filter((o) => o.trim().length > 0);
        if (nonEmpty.length < 2) {
          return "Each multiple-choice question must have at least two options.";
        }
        if (isQuiz && (q.correctOption === undefined || q.correctOption < 0)) {
          return "In quiz mode, each multiple-choice question must have a correct option selected.";
        }
      }
    }

    return null;
  };

    const canSave = useMemo(() => {
      if (!title.trim() || !description.trim()) return false;
      if (questions.length === 0) return false;
      return questions.every((q) => {
        if (!q.text.trim()) return false;
        if (q.type === "multiple") {
          const nonEmpty = (q.options ?? []).filter((o) => o.trim().length > 0);
          if (nonEmpty.length < 2) return false;
          if (isQuiz && (q.correctOption === undefined || q.correctOption < 0)) {
            return false;
          }
        }
        return true;
      });
    }, [title, description, questions, isQuiz]);

    const saveDraft = useCallback(async () => {
      if (isDraftLoading) return;
      if (serializedDraft === lastSavedDraftRef.current) return;

      setDraftStatus("saving");
      setDraftErrorMessage(null);
      try {
        const response = await fetch(`${BASE_URL}/assignments/draft`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: serializedDraft,
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text || `Failed to save draft (${response.status})`);
        }

        lastSavedDraftRef.current = serializedDraft;
        setDraftStatus("saved");
        setDraftSavedAt(Date.now());
        persistLocalDraft(serializedDraft);
      } catch (err) {
        console.error("Draft auto-save failed:", err);
        persistLocalDraft(serializedDraft);
        setDraftSavedAt(Date.now());
        const online =
          typeof navigator !== "undefined" ? navigator.onLine : true;
        if (online) {
          setDraftStatus("error");
          setDraftErrorMessage(
            err instanceof Error
              ? err.message
              : "Unable to save draft. Changes kept locally."
          );
        } else {
          setDraftStatus("offline");
          setDraftErrorMessage(
            "Offline — draft saved locally until connection returns."
          );
        }
      }
    }, [isDraftLoading, serializedDraft]);

    useEffect(() => {
      if (!isBrowser) return;
      const id = window.setInterval(() => {
        void saveDraft();
      }, AUTOSAVE_INTERVAL_MS);
      return () => window.clearInterval(id);
    }, [saveDraft]);

    useEffect(() => {
      if (!isBrowser) return;

      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          void saveDraft();
        }
      };

      const handleBeforeUnload = () => {
        void saveDraft();
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }, [saveDraft]);

  // ---- helpers ----
  const updateQuestion = (id: string, patch: Partial<Question>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const changeType = (id: string, type: QType) =>
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const { options, correctOption, ...rest } = q;

        if (type === "multiple") {
          return {
            ...rest,
            id,
            type,
            options: q.options && q.options.length > 0 ? q.options : ["", ""],
            points: q.points ?? 1,
          };
        }

        if (type === "oral") {
          return {
            ...rest,
            id,
            type,
            timeLimit: q.timeLimit ?? 60,
          };
        }

        // short answer
        return {
          ...rest,
          id,
          type,
        };
      })
    );

  const addQuestionRow = (type: QType) =>
    setQuestions((prev) => [...prev, newQuestion(type)]);

  const removeQuestion = (id: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const addOption = (qid: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid && q.type === "multiple"
          ? { ...q, options: [...(q.options ?? []), ""] }
          : q
      )
    );

  const updateOption = (qid: string, index: number, value: string) =>
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qid || q.type !== "multiple") return q;
        const opts = [...(q.options ?? [])];
        opts[index] = value;
        return { ...q, options: opts };
      })
    );

  const removeOption = (qid: string, index: number) =>
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qid || q.type !== "multiple") return q;
        const opts = (q.options ?? []).filter((_, i) => i !== index);
        return { ...q, options: opts.length >= 2 ? opts : ["", ""] };
      })
    );

  const setCorrectOption = (qid: string, index: number) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, correctOption: index } : q))
    );

    const handleReset = useCallback(() => {
      const initialQuestion = newQuestion("short");
      const blankDraft: AssignmentDraftPayload = {
        title: "",
        description: "",
        isQuiz: false,
        dueDate: "",
        assignmentTimeLimit: null,
        assignmentTimeInput: "",
        questions: [initialQuestion],
        timeInputs: { [initialQuestion.id]: "" },
      };

      setQuestions(blankDraft.questions);
      setTitle("");
      setDescription("");
      setDueDate("");
      setIsQuiz(false);
      setAssignmentTimeLimit(null);
      setAssignmentTimeInput("");
      setError(null);
      setResult(null);
      setTimeInputs(blankDraft.timeInputs);
      setSaving(false);
      lastSavedDraftRef.current = JSON.stringify(blankDraft);
      void clearDraft();
    }, [clearDraft]);

    const draftIndicator = useMemo(() => {
      if (isDraftLoading || draftStatus === "loading") {
        return { message: "Loading saved draft…", className: "text-gray-500" };
      }
      if (draftStatus === "saving") {
        return { message: "Saving draft…", className: "text-blue-600" };
      }
      if (draftStatus === "saved") {
        const timeLabel =
          draftSavedAt &&
          new Date(draftSavedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        return {
          message: timeLabel ? `Draft saved • ${timeLabel}` : "Draft saved",
          className: "text-green-600",
        };
      }
      if (draftStatus === "offline") {
        return {
          message: draftErrorMessage ?? "Offline — draft saved locally.",
          className: "text-amber-600",
        };
      }
      if (draftStatus === "error") {
        return {
          message:
            draftErrorMessage ??
            "Auto-save failed. Draft kept locally until connection returns.",
          className: "text-red-600",
        };
      }
      return null;
    }, [draftStatus, draftSavedAt, draftErrorMessage, isDraftLoading]);

  // ⚠️ Currently only creates a local preview URL (no backend upload yet).
  const handleMediaUpload = (qid: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file); // preview only, not persisted for students yet
    updateQuestion(qid, {
      media: { url, type: file.type.startsWith("video") ? "video" : "image" },
    });
  };

    // --------------------------------------------------
    // Submit to backend in demo mode
    // --------------------------------------------------
  const onSubmit = async () => {
    setError(null);
    setResult(null);

    const validationError = validateAssignment();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: any = {
      title,
      description,
      isQuiz,
      dueDate,
      questions,
    };

    if (assignmentTimeLimit && assignmentTimeLimit > 0) {
      payload.assignmentTimeLimit = assignmentTimeLimit; // already seconds
    }

    // 🔍 Debug logging
    console.log("Starting submit...");
    console.log("Payload:", {
      title,
      description,
      isQuiz,
      dueDate,
      questionsCount: questions.length,
      assignmentTimeLimit,
    });

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/assignments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);

      const data = await res.json().catch(() => null);
      console.log("Response data:", data);

      if (!res.ok) {
        const detail =
          (data && (data.detail || data.message)) ||
          `Server returned status ${res.status}`;
        throw new Error(detail);
      }

        setResult({
          assignmentId: data.id,
          shareLink: `/student/${data.id}`,
          questionsCount: questions.length,
        });
        await clearDraft();
        lastSavedDraftRef.current = serializedDraft;
    } catch (e: any) {
      console.error("Full error during assignment save:", e);
      if (e instanceof Error) {
        setError(`Failed to save assignment: ${e.message}`);
      } else {
        setError("Failed to save assignment. Please check your connection.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Assignment</h1>

      {/* Assignment meta */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Assignment Title"
          className="w-full border rounded-md p-2 mb-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Instructions for students"
          className="w-full border rounded-md p-2 mb-2"
          rows={2}
        />
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isQuiz}
              onChange={(e) => setIsQuiz(e.target.checked)}
            />
            <span>Quiz mode (auto-grade)</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Due:</span>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border rounded-md p-1"
            />
          </div>

          {/* Assignment-level timer (same format as question timers) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Assignment timer:</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g., 30:00 or 1800"
              value={assignmentTimeInput}
              onChange={(e) => setAssignmentTimeInput(e.target.value)}
              onBlur={() => {
                const sec = parseTimeToSeconds(assignmentTimeInput);
                if (sec && sec > 0) {
                  setAssignmentTimeLimit(sec);
                  setAssignmentTimeInput(formatSeconds(sec));
                } else {
                  setAssignmentTimeLimit(null);
                  setAssignmentTimeInput("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="border rounded-md p-1 w-28"
            />
            <span className="text-xs text-gray-500">(min:sec or seconds)</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Question {idx + 1}</span>
              <div className="flex gap-2">
                <select
                  value={q.type}
                  onChange={(e) => changeType(q.id, e.target.value as QType)}
                  className="border rounded-md p-1"
                >
                  <option value="short">Short answer</option>
                  <option value="multiple">Multiple choice</option>
                  <option value="oral">Oral response</option>
                </select>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Prompt */}
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              placeholder="Enter question text"
              className="w-full border rounded-md p-2 mb-3"
              rows={3}
            />

            {/* Media */}
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleMediaUpload(q.id, e)}
              className="mb-3"
            />
            {q.media && (
              <div className="mb-3">
                {q.media.type === "image" ? (
                  <img
                    src={q.media.url}
                    alt="Question media"
                    width={200}
                    className="rounded"
                  />
                ) : (
                  <video
                    src={q.media.url}
                    controls
                    width={220}
                    className="rounded"
                  />
                )}
              </div>
            )}

            {/* Multiple choice options */}
            {q.type === "multiple" && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Options
                </label>
                {q.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      value={opt}
                      onChange={(e) => updateOption(q.id, i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 border rounded-md p-2"
                    />
                    {isQuiz && (
                      <label className="text-sm flex items-center gap-1">
                        <input
                          type="radio"
                          checked={q.correctOption === i}
                          onChange={() => setCorrectOption(q.id, i)}
                        />
                        Correct
                      </label>
                    )}
                    <button
                      onClick={() => removeOption(q.id, i)}
                      disabled={(q.options?.length ?? 0) <= 2}
                      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addOption(q.id)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Add option
                </button>
              </div>
            )}

            {/* Per-question timer (ALL types, same style as oral) */}
            <div className="mb-3 space-y-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                Time limit for this question:
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 1:30 or 90"
                  value={timeInputs[q.id] ?? ""}
                  onChange={(e) =>
                    setTimeInputs((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    const seconds = parseTimeToSeconds(timeInputs[q.id] ?? "");
                    if (seconds && seconds >= 1) {
                      updateQuestion(q.id, { timeLimit: seconds });
                      setTimeInputs((prev) => ({
                        ...prev,
                        [q.id]: formatSeconds(seconds),
                      }));
                    } else {
                      updateQuestion(q.id, { timeLimit: undefined });
                      setTimeInputs((prev) => ({
                        ...prev,
                        [q.id]: "",
                      }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-32 border rounded-md p-1"
                />
                <span className="text-gray-500 text-xs">
                  (min:sec or seconds, leave empty for no limit)
                </span>
              </label>
            </div>

            {/* Points + Required */}
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Points</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Points"
                  value={q.points ?? ""}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const num = Number(val);
                    if (!isNaN(num) && num >= 0) {
                      updateQuestion(q.id, { points: num });
                    } else if (val === "") {
                      updateQuestion(q.id, { points: undefined });
                    }
                  }}
                  className="w-20 border rounded-md p-1"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={q.required ?? false}
                  onChange={(e) =>
                    updateQuestion(q.id, { required: e.target.checked })
                  }
                />
                <span className="text-sm">Required</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Add question buttons */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-sm text-gray-600">Add:</span>
        <button
          onClick={() => addQuestionRow("short")}
          className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
        >
          + Short
        </button>
        <button
          onClick={() => addQuestionRow("multiple")}
          className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
        >
          + Multiple choice
        </button>
        <button
          onClick={() => addQuestionRow("oral")}
          className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
        >
          + Oral
        </button>
      </div>

        {/* Save / Reset */}
        <div className="mt-6 flex gap-3">
          <button
            disabled={!canSave || saving}
            onClick={onSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & Publish"}
          </button>
          <button
            onClick={() => void handleReset()}
            className="px-4 py-2 border rounded-md"
          >
            Reset
          </button>
        </div>
        {draftIndicator && (
          <p
            className={`mt-2 text-sm ${draftIndicator.className}`}
            aria-live="polite"
          >
            {draftIndicator.message}
          </p>
        )}

      {/* Feedback */}
      {error && <p className="mt-3 text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
          <p>
            Created successfully! Total points:{" "}
            {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
          </p>
          <p>
            <strong>ID:</strong> {result.assignmentId}
          </p>
          <p>
            <strong>Link:</strong>{" "}
            <code>{`${window.location.origin}${result.shareLink}`}</code>
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() =>
                window.open(
                  `${window.location.origin}${result.shareLink}`,
                  "_blank"
                )
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Preview as Student
            </button>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}${result.shareLink}`
                )
              }
              className="border px-4 py-2 rounded-md"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

