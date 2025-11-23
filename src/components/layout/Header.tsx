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

  if (!isLoaded) {
    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
        <div className="text-xl font-semibold text-gray-800">Amplify LMS Demo</div>
        <span className="text-sm text-gray-500">Checking your session…</span>
      </header>
    );
  }

  if (!isSignedIn) {
    return (
      <header className="flex flex-col gap-4 bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-800">Amplify LMS Demo</div>
          <span className="text-sm text-gray-600">Please sign in to continue</span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/admin")}
            className="rounded border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          >
            Go to sign-in
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
      <div className="text-xl font-semibold text-gray-800">Amplify LMS Demo</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Demo mode unlocked</span>
        <button
          onClick={handleLogout}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Header;

