import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminAccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If Supabase token exists → go to dashboard
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/dashboard/teacher", { replace: true });
    } else {
      // Otherwise go to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
};

export default AdminAccess;
