import { Navigate } from "react-router-dom";

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: JSX.Element;
}) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  // TEMP (simple): treat all logged-in users as teacher unless you set userRole
  const role = (localStorage.getItem("userRole") || "teacher").toLowerCase();
  const allowed = allowedRoles.map((r) => r.toLowerCase());

  if (!allowed.includes(role)) {
    return <Navigate to="/dashboard/teacher" replace />;
  }

  return children;
}

