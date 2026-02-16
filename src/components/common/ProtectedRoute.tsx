import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    // Not logged in → go to /login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}



