// Header.tsx
// ==========================================================
// Top navigation bar displayed across all dashboard layouts.
// Shows platform title, logged-in user info, and logout button.
// Integrates with Zustand auth store for state management.
// ==========================================================

import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuthStore(); // Access user data and logout function
  const navigate = useNavigate();

  // Handle logout → clear auth state and redirect to login page
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
      {/* Platform title */}
      <div className="text-xl font-semibold text-gray-800">Learning Platform</div>

      {/* User info and logout button */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Logged in as: <strong>{user?.name}</strong> ({user?.role})
        </span>
        <button
          onClick={handleLogout}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;

