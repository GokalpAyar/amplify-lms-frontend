// GradeSubmissions.tsx
// ==========================================================
// Teacher page to view and grade student submissions.
// Fetches responses from the backend and allows entering grades.
// Grades are updated via PUT /responses/{response_id}/grade.
// ==========================================================

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/config";

interface ResponseItem {
  id: string;
  assignment_id: string;
  studentName: string;
  jNumber: string;
  submittedAt: string;
  answers: Record<string, string>;
  transcripts: Record<string, string>;
  grade?: number;
}

export default function GradeSubmissions() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Load all student submissions from backend
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await fetch(`${BASE_URL}/responses/`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        setResponses(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load student submissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, []);

  // 🔹 Handle grade update
  const handleGradeChange = (id: string, value: string) => {
    setResponses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, grade: Number(value) } : r))
    );
  };

  // 🔹 Submit grade to backend
  const submitGrade = async (id: string, grade: number) => {
    try {
      const res = await fetch(`${BASE_URL}/responses/${id}/grade?grade=${grade}`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error(`Failed to update grade`);
      toast.success(`✅ Grade ${grade} saved!`);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to save grade.");
    }
  };

  // 🔹 Page render
  if (loading)
    return <p className="p-6 text-gray-600">Loading submissions…</p>;
  if (error)
    return <p className="p-6 text-red-600">⚠️ {error}</p>;
  if (responses.length === 0)
    return <p className="p-6 text-gray-600">No submissions yet.</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Grade Submissions</h1>

      {responses.map((sub) => (
        <div key={sub.id} className="p-4 border rounded bg-gray-50 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">
              {sub.studentName} <span className="text-sm text-gray-500">({sub.jNumber})</span>
            </h2>
            <span className="text-xs text-gray-600">
              Submitted: {new Date(sub.submittedAt).toLocaleString()}
            </span>
          </div>

          <p className="text-sm text-gray-700">
            <strong>Assignment ID:</strong> {sub.assignment_id}
          </p>

          {/* Written / multiple-choice answers */}
          {Object.entries(sub.answers).length > 0 && (
            <div className="mt-2">
              <strong>Answers:</strong>
              <ul className="list-disc ml-5 text-sm">
                {Object.entries(sub.answers).map(([qid, ans]) => (
                  <li key={qid}>
                    <strong>{qid}:</strong> {ans}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcripts (expandable) */}
          {Object.entries(sub.transcripts).length > 0 && (
            <div className="mt-2">
              <strong>Oral Responses:</strong>
              {Object.entries(sub.transcripts).map(([qid, tr]) => (
                <details key={qid} className="mb-1 text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    View Transcript ({qid})
                  </summary>
                  <p className="whitespace-pre-wrap mt-1 text-gray-700">{tr}</p>
                </details>
              ))}
            </div>
          )}

          {/* Grade input */}
          <div className="flex items-center gap-2 mt-3">
            <label className="text-sm">Grade:</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={sub.grade ?? ""}
              onChange={(e) => handleGradeChange(sub.id, e.target.value)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) submitGrade(sub.id, val);
              }}
              placeholder="e.g. 95"
              className="border px-3 py-1 rounded w-24"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
