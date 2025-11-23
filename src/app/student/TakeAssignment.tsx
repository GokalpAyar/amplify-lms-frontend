import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { BASE_URL } from "@/config";
import AudioRecorder from "../../components/speech/AudioRecorder";

interface Question {
  id: string;
  type: "short" | "multiple" | "oral";
  text: string;
  media?: { url: string; type: "image" | "video" | null };
  options?: string[];
  required?: boolean;
  points?: number;
  timeLimit?: number;
}

interface Assignment {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignmentTimeLimit?: number; // seconds
  questions: Question[];
}

type RatingStatus = "idle" | "saving" | "saved" | "error";

interface StudentAccuracyRatingEntry {
  rating: number;
  comment?: string;
  updatedAt?: string;
}

const clampRating = (value: number) => Math.min(5, Math.max(1, Math.round(value)));

const normalizeStudentRatingMap = (input: unknown): Record<string, StudentAccuracyRatingEntry> => {
  if (!input || typeof input !== "object") return {};

  return Object.entries(input as Record<string, any>).reduce<Record<string, StudentAccuracyRatingEntry>>(
    (acc, [questionId, value]) => {
      if (value == null) return acc;

      if (typeof value === "number" || typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          acc[questionId] = { rating: clampRating(parsed) };
        }
        return acc;
      }

      if (typeof value === "object") {
        const maybeEntry = value as Record<string, any>;
        const parsed = Number(maybeEntry.rating ?? maybeEntry.score ?? maybeEntry.value);
        if (Number.isFinite(parsed)) {
          acc[questionId] = {
            rating: clampRating(parsed),
            comment:
              typeof maybeEntry.comment === "string"
                ? maybeEntry.comment
                : typeof maybeEntry.note === "string"
                ? maybeEntry.note
                : undefined,
            updatedAt: typeof maybeEntry.updatedAt === "string" ? maybeEntry.updatedAt : undefined,
          };
        }
      }

      return acc;
    },
    {}
  );
};

const formatSeconds = (total: number | undefined | null) => {
  if (!total || total <= 0) return "0:00";
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function TakeAssignment() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [studentName, setStudentName] = useState("");
  const [jNumber, setJNumber] = useState("");
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // 🆕 Added loading state for submissions

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);
  const [accuracyRatings, setAccuracyRatings] = useState<Record<string, number | null>>({});
  const [accuracyComments, setAccuracyComments] = useState<Record<string, string>>({});
  const [ratingStatus, setRatingStatus] = useState<Record<string, RatingStatus>>({});
  const [ratingErrors, setRatingErrors] = useState<Record<string, string | null>>({});

  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);
  const [assignmentTimeLeft, setAssignmentTimeLeft] = useState<number | null>(null);

  const draftKey = assignmentId ? `responsesDraft-${assignmentId}` : "";

  // ---------- Load assignment ----------
  useEffect(() => {
    if (!assignmentId) return;
    const fetchAssignment = async () => {
      try {
        const res = await fetch(`${BASE_URL}/assignments/${assignmentId}`);
        if (res.ok) {
          const data = await res.json();
          // Default to 30 min if no timer is set
          if (!data.assignmentTimeLimit) data.assignmentTimeLimit = 1800;
          setAssignment(data);
        } else {
          const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
          const current = allAssignments[assignmentId] as Assignment | undefined;
          if (current && !current.assignmentTimeLimit) current.assignmentTimeLimit = 1800;
          setAssignment(current ?? null);
        }
      } catch (err) {
        console.error("Error loading assignment:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  // ---------- Load draft ----------
  useEffect(() => {
    const draft = JSON.parse(localStorage.getItem(draftKey) || "{}");
    if (draft?.answers) setAnswers(draft.answers);
    if (draft?.transcripts) setTranscripts(draft.transcripts);
    if (draft?.studentName) setStudentName(draft.studentName);
    if (draft?.jNumber) setJNumber(draft.jNumber);
  }, [draftKey]);

  // ---------- Auto-save ----------
  useEffect(() => {
    if (!assignmentId) return;
    const payload = { studentName, jNumber, answers, transcripts };
    localStorage.setItem(draftKey, JSON.stringify(payload));
  }, [studentName, jNumber, answers, transcripts, assignmentId, draftKey]);

  // ---------- Start timers ----------
  useEffect(() => {
    if (!started || !assignment) return;

    // Assignment timer (always active)
    setAssignmentTimeLeft(assignment.assignmentTimeLimit || 1800);

    // Per-question timer
    const q = assignment.questions[currentIdx];
    setQuestionTimeLeft(q.timeLimit ?? null);
  }, [started, assignment, currentIdx]);

  // Assignment-level timer countdown
  useEffect(() => {
    if (!started || assignmentTimeLeft == null) return;
    const timer = setInterval(() => {
      setAssignmentTimeLeft((prev) => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(timer);
        // 🆕 Only submit if not already submitting
        if (!submitting) {
          alert("⏰ Assignment time is over! Submitting automatically...");
          handleSubmit();
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, assignmentTimeLeft, submitting]); // 🆕 Added submitting dependency

  // Question-level timer countdown
  useEffect(() => {
    if (!started || questionTimeLeft == null) return;
    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(timer);
        // 🆕 Only advance if not submitting
        if (!submitting) {
          handleNext();
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, currentIdx, questionTimeLeft, submitting]); // 🆕 Added submitting dependency

  // ---------- Handlers ----------
  const handleAnswerChange = (qid: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }));

  const handleTranscript = (qid: string, text: string) => {
    setTranscripts((prev) => ({ ...prev, [qid]: text }));
    setAnswers((prev) => ({ ...prev, [qid]: text }));
  };

  const handleNext = () => {
    if (!assignment) return;
    if (currentIdx < assignment.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const hydrateRatingsFromMap = (entries: Record<string, StudentAccuracyRatingEntry>) => {
    if (!entries || !Object.keys(entries).length) return;

    setAccuracyRatings((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(entries).forEach(([questionId, entry]) => {
        if (next[questionId] !== entry.rating) {
          next[questionId] = entry.rating;
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    setAccuracyComments((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(entries).forEach(([questionId, entry]) => {
        const commentValue = entry.comment ?? "";
        if (next[questionId] !== commentValue) {
          next[questionId] = commentValue;
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    setRatingStatus((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(entries).forEach((questionId) => {
        if (next[questionId] !== "saved") {
          next[questionId] = "saved";
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    setRatingErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(entries).forEach((questionId) => {
        if (next[questionId] !== null) {
          next[questionId] = null;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  };

  // 🆕 FIXED: Added loading state to prevent duplicate submissions
  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (submitting || submitted || !assignment || !assignmentId) return;

    if (!studentName.trim() || !jNumber.trim()) {
      alert("Please enter your name and J-number before submitting.");
      return;
    }

    setSubmitting(true); // 🔒 Lock the submit

    const submission = {
      assignment_id: assignmentId,
      studentName: studentName.trim(),
      jNumber: jNumber.trim(),
      answers,
      transcripts,
    };

    try {
      console.log("🔄 Submitting assignment...");
      const res = await fetch(`${BASE_URL}/responses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      const rawBody = await res.text();
      let parsedBody: any = null;
      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = null;
        }
      }

      if (!res.ok) {
        const errorMessage =
          (parsedBody && (parsedBody.detail || parsedBody.message || parsedBody.error)) ||
          rawBody ||
          `Submission failed with status ${res.status}`;
        throw new Error(errorMessage);
      }

      console.log("✅ Submission successful");
      localStorage.removeItem(draftKey);

      const responseIdFromBody =
        parsedBody?.id ||
        parsedBody?._id ||
        parsedBody?.responseId ||
        parsedBody?.response_id ||
        null;
      const responseIdFromHeader = res.headers.get("Location")?.split("/").filter(Boolean).pop() || null;
      const resolvedResponseId = responseIdFromBody || responseIdFromHeader;

      if (resolvedResponseId) {
        setSubmittedResponseId(resolvedResponseId);
      } else {
        console.warn("⚠️ No response ID returned; transcript accuracy ratings will remain disabled.");
      }

      if (parsedBody) {
        const ratingPayload = normalizeStudentRatingMap(
          parsedBody.studentAccuracyRatings ??
            parsedBody.student_accuracy_ratings ??
            parsedBody.accuracyRatings ??
            parsedBody.accuracy_rating ??
            parsedBody.accuracy
        );
        hydrateRatingsFromMap(ratingPayload);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("❌ Submission error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Error submitting your responses: ${message}`);
    } finally {
      setSubmitting(false); // 🔓 Unlock the submit
    }
  };

  const handleAccuracyStarSelect = (questionId: string, value: number) => {
    setAccuracyRatings((prev) => ({ ...prev, [questionId]: clampRating(value) }));
    setRatingStatus((prev) => {
      if (prev[questionId] === "saving") return prev;
      return { ...prev, [questionId]: "idle" };
    });
    setRatingErrors((prev) => ({ ...prev, [questionId]: null }));
  };

  const handleAccuracyCommentChange = (questionId: string, value: string) => {
    setAccuracyComments((prev) => ({ ...prev, [questionId]: value }));
    setRatingStatus((prev) => {
      if (prev[questionId] === "saving") return prev;
      return { ...prev, [questionId]: prev[questionId] === "saved" ? "idle" : prev[questionId] ?? "idle" };
    });
    setRatingErrors((prev) => ({ ...prev, [questionId]: null }));
  };

  const handleSaveAccuracyRating = async (questionId: string) => {
    const rating = accuracyRatings[questionId];
    if (!rating) {
      setRatingErrors((prev) => ({ ...prev, [questionId]: "Select a rating before saving." }));
      return;
    }

    if (!submittedResponseId) {
      setRatingErrors((prev) => ({
        ...prev,
        [questionId]: "Submit your assignment to enable saving this rating.",
      }));
      return;
    }

    setRatingStatus((prev) => ({ ...prev, [questionId]: "saving" }));
    setRatingErrors((prev) => ({ ...prev, [questionId]: null }));

    try {
      const res = await fetch(`${BASE_URL}/responses/${submittedResponseId}/accuracy-rating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          rating,
          comment: accuracyComments[questionId]?.trim() || undefined,
        }),
      });

      const payloadText = await res.text();
      let payloadJson: any = null;
      if (payloadText) {
        try {
          payloadJson = JSON.parse(payloadText);
        } catch {
          payloadJson = null;
        }
      }

      if (!res.ok) {
        const errorMessage =
          (payloadJson && (payloadJson.detail || payloadJson.message || payloadJson.error)) ||
          payloadText ||
          "Failed to save rating.";
        throw new Error(errorMessage);
      }

      if (payloadJson) {
        const ratingPayload = normalizeStudentRatingMap(
          payloadJson.studentAccuracyRatings ??
            payloadJson.student_accuracy_ratings ??
            payloadJson.accuracyRatings ??
            payloadJson.accuracy_rating ??
            payloadJson.accuracy ??
            payloadJson
        );
        hydrateRatingsFromMap(ratingPayload);
        if (!ratingPayload[questionId]) {
          setRatingStatus((prev) => ({ ...prev, [questionId]: "saved" }));
        }
      } else {
        setRatingStatus((prev) => ({ ...prev, [questionId]: "saved" }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save rating.";
      setRatingErrors((prev) => ({ ...prev, [questionId]: message }));
      setRatingStatus((prev) => ({ ...prev, [questionId]: "error" }));
    }
  };

  // ---------- UI ----------
  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading assignment...</div>;

  if (!assignment)
    return (
      <div className="p-6 text-center text-gray-600">
        Assignment not found or invalid link.
      </div>
    );

    if (submitted) {
      const oralQuestions = assignment.questions.filter((question) => question.type === "oral");

      return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-green-700">✅ Submitted!</h1>
            <p className="text-gray-700">Thanks for completing {assignment.title}.</p>
            <p className="text-sm text-gray-500">
              Rate the transcript accuracy below to help improve speech recognition.
            </p>
          </div>

          {oralQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600">
              This assignment didn&apos;t include any oral responses, so there&apos;s nothing to rate.
            </div>
          ) : (
            <div className="space-y-5">
              {oralQuestions.map((question, index) => {
                const transcriptText = transcripts[question.id] || answers[question.id] || "";
                const ratingValue = accuracyRatings[question.id] ?? null;
                const status = ratingStatus[question.id] ?? "idle";
                const error = ratingErrors[question.id];
                const commentValue = accuracyComments[question.id] ?? "";
                const saveDisabled = !submittedResponseId || !ratingValue || status === "saving";

                return (
                  <div key={question.id} className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Oral Response {index + 1}
                      </p>
                      <p className="text-base font-semibold text-gray-800">{question.text}</p>
                    </div>

                    <div className="rounded-lg bg-white p-3 shadow-inner">
                      <p className="text-sm font-medium text-gray-600 mb-1">My transcript</p>
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">
                        {transcriptText || "No transcript captured for this response."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Rate transcript accuracy:</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleAccuracyStarSelect(question.id, score)}
                            className="rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400"
                            aria-label={`Set transcript accuracy rating to ${score} out of 5`}
                          >
                            <span
                              className={`text-2xl ${
                                ratingValue && ratingValue >= score ? "text-yellow-500" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          </button>
                        ))}
                        {ratingValue && (
                          <span className="text-sm font-medium text-gray-600">{ratingValue}/5</span>
                        )}
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700">
                      Add comments about transcription accuracy
                      <textarea
                        value={commentValue}
                        onChange={(event) => handleAccuracyCommentChange(question.id, event.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional: mention pronunciation issues, missed words, or anything else."
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveAccuracyRating(question.id)}
                        disabled={saveDisabled}
                        className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors ${
                          saveDisabled
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        }`}
                      >
                        {status === "saving" ? "Saving..." : "Save Rating"}
                      </button>
                      {status === "saved" && (
                        <span className="text-sm font-semibold text-green-600">Rating saved</span>
                      )}
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {!submittedResponseId && (
                      <p className="text-sm text-amber-600">
                        Your submission is still finalizing. Ratings will sync once it&apos;s ready.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

  if (!started)
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-2 text-center">{assignment.title}</h1>
        <p className="text-gray-600 text-center mb-4">{assignment.description}</p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">J Number</label>
            <input
              type="text"
              value={jNumber}
              onChange={(e) => setJNumber(e.target.value)}
              placeholder="Enter your J-number"
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>
        <button
          disabled={!studentName.trim() || !jNumber.trim()}
          onClick={() => setStarted(true)}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Start Test
        </button>
      </div>
    );

  // ---------- Main Test ----------
  const q = assignment.questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow overflow-hidden">
      {/* Always visible assignment timer */}
      <div className="sticky top-0 w-full bg-gray-100 border-b px-4 py-3 flex justify-between items-center z-10">
        <span className="text-sm font-medium text-gray-700">🕒 Total Time Remaining</span>
        <span
          className={`text-lg font-semibold ${
            assignmentTimeLeft && assignmentTimeLeft <= 60
              ? "text-red-600"
              : "text-blue-700"
          }`}
        >
          {formatSeconds(assignmentTimeLeft)}
        </span>
      </div>

      {/* Question content */}
      <div className="p-6">
        {q.timeLimit && (
          <div className="text-right mb-2 text-sm text-gray-700">
            ⏳ Question Time Left: {formatSeconds(questionTimeLeft)}
          </div>
        )}

        <h2 className="text-lg font-semibold mb-2">
          Question {currentIdx + 1} of {assignment.questions.length}
        </h2>
        <p className="mb-3 text-gray-800 font-medium">{q.text}</p>

        {q.media && (
          <div className="mb-2">
            {q.media.type === "image" ? (
              <img src={q.media.url} alt="media" className="rounded w-64" />
            ) : (
              <video src={q.media.url} controls className="rounded w-64" />
            )}
          </div>
        )}

        {q.type === "short" && (
          <textarea
            className="w-full border rounded-md p-2"
            rows={2}
            placeholder="Type your answer..."
            value={answers[q.id] || ""}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
          />
        )}

        {q.type === "multiple" &&
          q.options?.map((opt, i) => (
            <label key={i} className="block text-sm mb-1">
              <input
                type="radio"
                name={`q-${q.id}`}
                value={opt}
                checked={answers[q.id] === opt}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="mr-2"
              />
              {opt}
            </label>
          ))}

        {q.type === "oral" && (
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Record your voice response (limit: {formatSeconds(q.timeLimit)}s)
            </p>
            <AudioRecorder
              limitSeconds={q.timeLimit ?? 60}
              setTranscript={(text) => handleTranscript(q.id, text)}
              context="assignment"
            />
            {transcripts[q.id] && (
              <div className="mt-3 p-3 border rounded bg-gray-50">
                <h3 className="font-semibold mb-1">Transcript:</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{transcripts[q.id]}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            disabled={submitting} // 🆕 Disable button while submitting
            className={`px-5 py-2 rounded-md ${
              submitting 
                ? "bg-gray-400 cursor-not-allowed text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {submitting 
              ? "Submitting..." 
              : currentIdx === assignment.questions.length - 1 
                ? "Submit" 
                : "Next"
            }
          </button>
        </div>
      </div>
    </div>
  );
}