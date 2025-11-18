// ProtectedRoute.tsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");

  // If no token → go to login
  if (!token) return <Navigate to="/login" replace />;

  // If token exists → allow page
  return children;
}


