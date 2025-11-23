// Sidebar.tsx
// ==========================================================
// Role-based sidebar navigation component.
// Displays different menu items depending on whether
// the logged-in user is an Admin, Teacher, or Student.
// Highlights the current active route using `useLocation`.
// ==========================================================

import { Link, useLocation } from "react-router-dom";

// Navigation items mapped by role
const navItems: Record<string, { label: string; path: string }[]> = {
  admin: [
    { label: "Dashboard", path: "/dashboard/admin" },
    { label: "Manage Users", path: "/dashboard/admin/users" },
    { label: "Manage Courses", path: "/dashboard/admin/courses" },
    { label: "Audit Logs", path: "/dashboard/admin/audit" },
  ],
  teacher: [
    { label: "Dashboard", path: "/dashboard/teacher" },
    { label: "Create Assignment", path: "/dashboard/teacher/create" },
    { label: "Grade Submissions", path: "/dashboard/teacher/grade" },
    { label: "Upload Materials", path: "/dashboard/teacher/materials" },
    { label: "View Submissions", path: "/dashboard/teacher/submissions" }, // 🆕 Added
  ],
  student: [
    { label: "Dashboard", path: "/dashboard/student" },
    { label: "Take Test", path: "/dashboard/student/test" },
    { label: "Submit Feedback", path: "/dashboard/student/feedback" },
    { label: "My Transcripts", path: "/dashboard/student/transcripts" },
    { label: "My Grades", path: "/dashboard/student/grades" },
    { label: "My Courses", path: "/dashboard/student/courses" },
  ],
};

// Sidebar component (renders based on user role)
const Sidebar = ({ role }: { role: "admin" | "teacher" | "student" }) => {
  const location = useLocation();
  const items = navItems[role];

  return (
    <aside className="w-64 bg-white border-r h-full p-4 space-y-4 shadow-sm">
      {/* Sidebar Header */}
      <div className="text-lg font-bold mb-4 capitalize">{role} Panel</div>

      {/* Navigation Links */}
      <nav className="space-y-2">
        {items.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            className={`block px-4 py-2 rounded hover:bg-gray-100 ${
              location.pathname === path ? "bg-gray-200 font-medium" : ""
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
