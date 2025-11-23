// TeacherDashboard.tsx
// ==========================================================
// Main landing page for teacher users after login.
// Displays quick-access options and an overview of
// available teaching actions.
// ==========================================================

const TeacherDashboard = () => {
  return (
    <div>
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>

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