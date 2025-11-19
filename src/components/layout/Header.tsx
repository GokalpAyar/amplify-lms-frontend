// Header.tsx
// ==========================================================
// Top navigation bar for demo mode. Displays a simple banner
// and provides an "Exit Demo" action that clears local access.
// ==========================================================

import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin");
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
      <div className="text-xl font-semibold text-gray-800">Amplify LMS Demo</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Demo mode unlocked</span>
        <button
          onClick={handleLogout}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Exit Demo
        </button>
      </div>
    </header>
  );
};

export default Header;

