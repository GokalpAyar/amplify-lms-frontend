// TeacherDashboard.tsx
// ==========================================================
// Main landing page for teacher users after login.
// Displays quick-access options and an overview of
// available teaching actions.
// ==========================================================

import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();

    // Clear stored session data
    localStorage.clear();

    // Redirect back to login
    navigate("/login", { replace: true });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Quick links or summary of teacher actions */}
      <ul className="space-y-2">
        <li>📝 Create Assignments</li>
        <li>🧑‍🎓 Grade Submissions</li>
        <li>📊 View Class Stats</li>
      </ul>
    </div>
  );
};

export default TeacherDashboard;