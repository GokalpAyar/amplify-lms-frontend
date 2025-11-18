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
      transcripts 
    };

    try {
      console.log("🔄 Submitting assignment...");
      const res = await fetch(`${BASE_URL}/responses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Submission failed with status ${res.status}`);
      }
      
      console.log("✅ Submission successful");
      localStorage.removeItem(draftKey);
      setSubmitted(true);
      
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert(`Error submitting your responses: ${err.message}`);
    } finally {
      setSubmitting(false); // 🔓 Unlock the submit
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

  if (submitted)
    return (
      <div className="max-w-2xl mx-auto p-6 bg-green-50 rounded-xl shadow text-center">
        <h1 className="text-2xl font-semibold text-green-700 mb-2">✅ Submitted!</h1>
        <p>Your responses and transcripts have been sent successfully.</p>
      </div>
    );

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