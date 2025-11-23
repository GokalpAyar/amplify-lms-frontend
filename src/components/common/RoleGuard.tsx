// RoleGuard.tsx
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: JSX.Element;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Checking permissions…
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
