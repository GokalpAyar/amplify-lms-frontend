// Enhanced ViewSubmissions.tsx
import { useState, useEffect, useMemo } from "react";
import { BASE_URL, FRONTEND_ASSIGNMENT_URL } from "@/config";

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
  answers: Record<string, string>;
  transcripts: Record<string, TranscriptRecord>;
  submittedAt: string;
}

type TranscriptSegment = {
  text: string;
  confidence?: number;
  speaker?: string;
  startTime?: number;
  endTime?: number;
};

type TranscriptRecord =
  | string
  | {
      text?: string;
      transcript?: string;
      confidence?: number;
      confidenceScore?: number;
      score?: number;
      segments?: TranscriptSegment[];
      [key: string]: any;
    };

interface NormalizedTranscript {
  text: string;
  confidence?: number;
  segments?: TranscriptSegment[];
}

const normalizeTranscript = (value?: TranscriptRecord): NormalizedTranscript => {
  if (!value) {
    return { text: "" };
  }

  const parseObject = (obj: any): NormalizedTranscript => ({
    text:
      typeof obj?.text === "string"
        ? obj.text
        : typeof obj?.transcript === "string"
        ? obj.transcript
        : "",
    confidence:
      typeof obj?.confidence === "number"
        ? obj.confidence
        : typeof obj?.confidenceScore === "number"
        ? obj.confidenceScore
        : typeof obj?.score === "number"
        ? obj.score
        : undefined,
    segments: Array.isArray(obj?.segments)
      ? obj.segments
          .filter((segment: TranscriptSegment) => segment && typeof segment.text === "string")
          .map((segment: TranscriptSegment) => ({
            text: segment.text,
            confidence:
              typeof segment.confidence === "number" ? segment.confidence : undefined,
            speaker: segment.speaker,
            startTime: segment.startTime,
            endTime: segment.endTime,
          }))
      : undefined,
  });

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return { text: "" };
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        return parseObject(parsed);
      }
    } catch {
      // Value was plain text, return as-is
    }
    return { text: value };
  }

  return parseObject(value);
};

const getConfidencePercentage = (score?: number) => {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return undefined;
  }
  const normalized = score <= 1 ? score * 100 : score;
  return Math.round(Math.max(0, Math.min(100, normalized)));
};

type TranscriptAccuracyRating = "accurate" | "unsure" | "needs_review";

const transcriptAccuracyOptions: { label: string; value: TranscriptAccuracyRating }[] = [
  { label: "Accurate", value: "accurate" },
  { label: "Unsure", value: "unsure" },
  { label: "Needs Review", value: "needs_review" },
];

const transcriptAccuracyBadgeStyles: Record<TranscriptAccuracyRating, string> = {
  accurate: "border-green-200 bg-green-50 text-green-700",
  unsure: "border-amber-200 bg-amber-50 text-amber-700",
  needs_review: "border-red-200 bg-red-50 text-red-700",
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
  const [transcriptAccuracy, setTranscriptAccuracy] = useState<Record<string, TranscriptAccuracyRating | null>>({});

  const getAssignmentLink = (assignmentId: string) =>
    `${FRONTEND_ASSIGNMENT_URL}/${assignmentId}`;

  const handleAccuracySelection = (questionId: string, rating: TranscriptAccuracyRating) => {
    setTranscriptAccuracy(prev => ({
      ...prev,
      [questionId]: prev[questionId] === rating ? null : rating,
    }));
  };

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

  useEffect(() => {
    setTranscriptAccuracy({});
  }, [selected?.id]);

  // Load all responses + assignments from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load assignments
        const assignRes = await fetch(`${BASE_URL}/assignments/`);
        const assignData = await assignRes.json();
        setAssignments(Array.isArray(assignData) ? assignData : []);

        // Load responses
        const respRes = await fetch(`${BASE_URL}/responses/`);
        const respData = await respRes.json();
        setSubmissions(Array.isArray(respData) ? respData : []);
      } catch (err) {
        console.error("❌ Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    
    assignments.forEach(assignment => {
      // Simple grouping by first word of title (you can change this logic)
      const groupName = assignment.title.split(' ')[0] || 'Other';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(assignment);
    });

    return groups;
  }, [assignments]);

  const selectedAssignment = useMemo(
    () => (selected ? assignments.find(a => a.id === selected.assignment_id) : undefined),
    [assignments, selected]
  );

  const handleDeleteAssignment = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this assignment? All submissions will be lost."
    );
    if (!confirmDelete) return;

    setDeleteFeedback(null);
    setDeletingAssignmentId(assignmentId);

    try {
      const response = await fetch(`${BASE_URL}/assignments/${assignmentId}`, {
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubmissions.map((sub) => {
                  const assignment = assignments.find(a => a.id === sub.assignment_id);
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(sub)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
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
              {selectedAssignment ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 shadow-inner">
                    <h3 className="text-lg font-bold text-blue-900">
                      {selectedAssignment.title}
                    </h3>
                    {selectedAssignment.description && (
                      <p className="text-blue-700 mt-1">
                        {selectedAssignment.description}
                      </p>
                    )}
                  </div>

                  {selectedAssignment.questions.map((q, i) => {
                    const isOral = q.type === "oral";
                    const transcriptDetails = isOral
                      ? normalizeTranscript(selected.transcripts?.[q.id])
                      : undefined;
                    const transcriptText = transcriptDetails?.text?.trim() ?? "";
                    const transcriptParagraphs = transcriptText
                      ? transcriptText.split(/\n{2,}|\r\n\r\n/g).filter(Boolean)
                      : [];
                    const transcriptSegments =
                      transcriptDetails?.segments?.filter(
                        segment => segment?.text && segment.text.trim().length > 0
                      ) ?? [];
                    const confidencePercent = transcriptDetails
                      ? getConfidencePercentage(transcriptDetails.confidence)
                      : undefined;
                    const rating = transcriptAccuracy[q.id];
                    const ratingLabel = transcriptAccuracyOptions.find(
                      option => option.value === rating
                    )?.label;

                    return (
                      <div key={q.id} className="border-l-4 border-blue-500 pl-4 py-2 space-y-3">
                        <p className="font-medium text-gray-800">
                          {i + 1}. {q.text}
                        </p>

                        {q.type === "short" && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {selected.answers[q.id] || "No answer provided."}
                            </p>
                          </div>
                        )}

                        {q.type === "multiple" && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700">
                              Selected: <strong>{selected.answers[q.id] || "No answer selected."}</strong>
                            </p>
                          </div>
                        )}

                        {isOral && (
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-white p-4 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-purple-900 uppercase tracking-wide flex items-center gap-2">
                                  <span role="img" aria-label="microphone">
                                    🎙️
                                  </span>
                                  Oral Response Transcript
                                </p>
                                {confidencePercent !== undefined ? (
                                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                                    <span>Confidence</span>
                                    <div className="h-2 w-24 rounded-full bg-purple-100 overflow-hidden">
                                      <span
                                        className="block h-full rounded-full bg-purple-500"
                                        style={{ width: `${confidencePercent}%` }}
                                      ></span>
                                    </div>
                                    <span>{confidencePercent}%</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-medium text-purple-500">
                                    Confidence score unavailable
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 rounded-xl border border-purple-50 bg-white/80 p-4 shadow-inner max-h-72 overflow-y-auto">
                                {transcriptParagraphs.length > 0 ? (
                                  <div className="space-y-4 text-gray-800 text-sm md:text-base leading-relaxed">
                                    {transcriptParagraphs.map((paragraph, idx) => (
                                      <p key={idx} className="whitespace-pre-wrap break-words">
                                        {paragraph}
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">
                                    {transcriptText ? transcriptText : "No transcript available."}
                                  </p>
                                )}
                              </div>

                              {transcriptSegments.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {transcriptSegments.slice(0, 4).map((segment, idx) => {
                                    const segmentConfidence = getConfidencePercentage(
                                      segment.confidence
                                    );
                                    return (
                                      <span
                                        key={`${segment.text}-${idx}`}
                                        className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                                      >
                                        {segment.text}
                                        {segmentConfidence !== undefined && (
                                          <span className="ml-1 text-[10px] text-purple-500">
                                            ({segmentConfidence}%)
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                  {transcriptSegments.length > 4 && (
                                    <span className="text-xs font-medium text-purple-600">
                                      +{transcriptSegments.length - 4} more segment
                                      {transcriptSegments.length - 4 === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">Transcript Accuracy</p>
                                  <p className="text-xs text-gray-500">
                                    Rate how close the AI transcript is for this response.
                                  </p>
                                </div>
                                {rating && ratingLabel && (
                                  <span
                                    className={`text-xs font-semibold uppercase tracking-wide rounded-full border px-3 py-1 ${transcriptAccuracyBadgeStyles[rating]}`}
                                  >
                                    {ratingLabel}
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {transcriptAccuracyOptions.map(option => {
                                  const isActive = rating === option.value;
                                  return (
                                    <button
                                      type="button"
                                      key={option.value}
                                      onClick={() => handleAccuracySelection(q.id, option.value)}
                                      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition ${
                                        isActive
                                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                          : "text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700"
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-3 text-xs text-gray-400">
                                Ratings are local-only for the demo and help highlight transcripts that may need a manual review.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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