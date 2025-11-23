// ProtectedRoute.tsx
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Verifying your session…
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
