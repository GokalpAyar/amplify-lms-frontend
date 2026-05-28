// TeacherLayout.tsx
// ==========================================================
// Defines the main dashboard layout for Teacher users.
// Includes a persistent Sidebar and Header with a dynamic
// main content area that renders child pages (CreateAssignment,
// GradeSubmissions, etc.).
// ==========================================================

import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // Outer container: full-height flex layout
    <div className="flex h-screen bg-slate-50">
      {/* Left: role-based sidebar navigation */}
      <Sidebar role="teacher" />

      {/* Right: header and page content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        {/* Scrollable main content injected via props */}
        <main className="overflow-y-auto bg-slate-50 p-4">{children}</main>
      </div>
    </div>
  );
};

export default TeacherLayout;
