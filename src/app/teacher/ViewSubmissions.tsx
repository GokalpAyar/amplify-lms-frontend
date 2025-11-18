// Enhanced ViewSubmissions.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "@/config";

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
  transcripts: Record<string, string>;
  submittedAt: string;
}

const ViewSubmissions = () => {
  const [submissions, setSubmissions] = useState<StudentResponse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentResponse | null>(null);
  const [filterAssignment, setFilterAssignment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "assignment">("date");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Load all responses + assignments from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Load assignments
        const assignRes = await fetch(`${BASE_URL}/assignments/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assignData = await assignRes.json();
        setAssignments(Array.isArray(assignData) ? assignData : []);

        // Load responses
        const respRes = await fetch(`${BASE_URL}/responses/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
              {assignments.find(a => a.id === selected.assignment_id) ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-blue-900">
                      {assignments.find(a => a.id === selected.assignment_id)?.title}
                    </h3>
                    <p className="text-blue-700 mt-1">
                      {assignments.find(a => a.id === selected.assignment_id)?.description}
                    </p>
                  </div>

                  {assignments.find(a => a.id === selected.assignment_id)?.questions.map((q, i) => (
                    <div key={q.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-medium text-gray-800 mb-2">
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

                      {q.type === "oral" && (
                        <div className="space-y-2">
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-sm text-purple-700 font-medium mb-1">🎙️ Oral Response Transcript</p>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {selected.transcripts[q.id] || "No transcript available."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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