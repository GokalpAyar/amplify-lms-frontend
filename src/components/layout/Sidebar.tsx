// Sidebar.tsx
// ==========================================================
// Role-based sidebar navigation component.
// Displays different menu items depending on whether
// the logged-in user is an Admin, Teacher, or Student.
// Highlights the current active route using `useLocation`.
// ==========================================================

import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// Navigation items mapped by role
const navItems: Record<
  string,
  { label: string; path: string; icon: LucideIcon; description?: string }[]
> = {
  admin: [
    { label: "Dashboard", path: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Manage Users", path: "/dashboard/admin/users", icon: Users },
    { label: "Manage Courses", path: "/dashboard/admin/courses", icon: BookOpen },
    { label: "Audit Logs", path: "/dashboard/admin/audit", icon: ShieldCheck },
  ],
  teacher: [
    {
      label: "Dashboard",
      path: "/dashboard/teacher",
      icon: LayoutDashboard,
      description: "Overview",
    },
    {
      label: "Create Assignment",
      path: "/dashboard/teacher/create",
      icon: ClipboardList,
      description: "Build work",
    },
    {
      label: "View Submissions",
      path: "/dashboard/teacher/submissions",
      icon: ClipboardCheck,
      description: "Review grades",
    },
  ],
  student: [
    { label: "Dashboard", path: "/dashboard/student", icon: LayoutDashboard },
    { label: "Take Test", path: "/dashboard/student/test", icon: FileText },
    { label: "Submit Feedback", path: "/dashboard/student/feedback", icon: MessageSquareText },
    { label: "My Transcripts", path: "/dashboard/student/transcripts", icon: ScrollText },
    { label: "My Grades", path: "/dashboard/student/grades", icon: BarChart3 },
    { label: "My Courses", path: "/dashboard/student/courses", icon: GraduationCap },
  ],
};

// Sidebar component (renders based on user role)
const Sidebar = ({ role }: { role: "admin" | "teacher" | "student" }) => {
  const location = useLocation();
  const items = navItems[role];
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  if (role !== "teacher") {
    return (
      <aside className="w-64 bg-white border-r h-full p-4 space-y-4 shadow-sm">
        <div className="text-lg font-bold mb-4 capitalize">{role} Panel</div>
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
  }

  return (
    <aside className="h-full w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 shadow-sm lg:w-72">
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Amplify LMS</p>
            <p className="text-xs text-slate-500">{roleLabel} workspace</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1" aria-label={`${roleLabel} navigation`}>
        {items.map(({ label, path, icon: Icon, description }) => {
          const isDashboard = path === `/dashboard/${role}`;
          const isActive = isDashboard
            ? location.pathname === path
            : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-md ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{label}</span>
                {description && (
                  <span className="block truncate text-xs text-slate-500">
                    {description}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
