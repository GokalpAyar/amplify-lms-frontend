// Header.tsx
// ==========================================================
// Top navigation bar for demo mode. Displays a simple banner
// and provides Clerk-powered auth controls.
// ==========================================================

import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: "/admin" });
    } catch (error) {
      console.error("Failed to sign out", error);
      navigate("/admin");
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
      <div className="text-xl font-semibold text-gray-800">Amplify LMS Demo</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {isSignedIn ? "Demo mode unlocked" : "Please sign in to continue"}
        </span>
        {isLoaded && isSignedIn ? (
          <button
            onClick={handleLogout}
            className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

