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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Quick actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <ul className="space-y-2 text-gray-700">
          <li>📝 Create Assignments</li>
          <li>📄 View Submissions</li>
        </ul>
      </div>
    </div>
  );
};

export default TeacherDashboard;