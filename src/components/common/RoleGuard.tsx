// RoleGuard.tsx
import { Navigate } from "react-router-dom";

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: JSX.Element;
}) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

