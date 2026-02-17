// src/components/common/RoleGuard.tsx
import { Navigate, useLocation } from "react-router-dom";

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: JSX.Element;
}) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // TEMP (simple): treat all logged-in users as teacher unless you set userRole
  const role = (localStorage.getItem("userRole") || "teacher").toLowerCase();

  // If no roles specified, allow
  if (!allowedRoles || allowedRoles.length === 0) return children;

  const allowed = allowedRoles.map((r) => r.toLowerCase());
  if (!allowed.includes(role)) {
    return <Navigate to="/dashboard/teacher" replace />;
  }

  return children;
}


