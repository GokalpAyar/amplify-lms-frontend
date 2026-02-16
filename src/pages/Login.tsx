// src/router.tsx
// ==========================================================
// Amplify-LMS Main Application Router
// ----------------------------------------------------------
// Updated: Adds /login route and makes "/" go to /login
// ==========================================================

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ---------- Auth & Common Pages ----------
import AdminAccess from "./pages/AdminAccess";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// ---------- Admin ----------
import AdminDashboard from "./app/admin/AdminDashboard";
import AdminLayout from "./app/admin/AdminLayout";
import ManageUsers from "./app/admin/ManageUsers";
import ManageCourses from "./app/admin/ManageCourses";
import AuditDashboard from "./app/admin/AuditDashboard";

// ---------- Teacher ----------
import TeacherDashboard from "./app/teacher/TeacherDashboard";
import TeacherLayout from "./app/teacher/TeacherLayout";
import CreateAssignment from "./app/teacher/CreateAssignment";
import GradeSubmissions from "./app/teacher/GradeSubmissions";
import CourseMaterialUpload from "./app/teacher/CourseMaterialUpload";
import ViewSubmissions from "./app/teacher/ViewSubmissions";

// ---------- Student ----------
import StudentDashboard from "./app/student/StudentDashboard";
import StudentLayout from "./app/student/StudentLayout";
import SubmitFeedback from "./app/student/SubmitFeedback";
import TakeTest from "./app/student/TakeTest";
import MyTranscripts from "./app/student/MyTranscripts";
import ViewGrades from "./app/student/ViewGrades";
import MyCourses from "./app/student/courses/MyCourses";
import CourseDetail from "./app/student/courses/CourseDetail";
import AssignmentsList from "./app/student/courses/tabs/AssignmentsList";
import CourseMaterials from "./app/student/courses/tabs/CourseMaterials";
import CourseGrades from "./app/student/courses/tabs/CourseGrades";
import CourseFeedback from "./app/student/courses/tabs/CourseFeedback";
import Syllabus from "./app/student/courses/tabs/Syllabus";
import AssignmentView from "./app/student/courses/tabs/AssignmentView";
import QuizView from "./app/student/courses/tabs/QuizView";

// ---------- Common Components ----------
import RootLayout from "./app/layout/RootLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RoleGuard from "./components/common/RoleGuard";

// ---------- Public Shared Link ----------
import TakeAssignment from "./app/student/TakeAssignment";

// ==========================================================
// AppRouter Component
// ==========================================================
const AppRouter = () => (
  <Router>
    <Routes>
      {/* ---------- Public Routes ---------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminAccess />} />
      <Route path="/student/:assignmentId" element={<TakeAssignment />} />

      {/* Back-compat redirect (optional) */}
      <Route path="/teacher/dashboard" element={<Navigate to="/dashboard/teacher" replace />} />

      {/* ---------- Protected Routes ---------- */}
      <Route
        element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }
      >
        {/* ---------- Admin Routes ---------- */}
        <Route
          path="/dashboard/admin"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/admin/users"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminLayout>
                <ManageUsers />
              </AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/admin/courses"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminLayout>
                <ManageCourses />
              </AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/admin/audit"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminLayout>
                <AuditDashboard />
              </AdminLayout>
            </RoleGuard>
          }
        />

        {/* ---------- Teacher Routes ---------- */}
        <Route
          path="/dashboard/teacher"
          element={
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherLayout>
                <TeacherDashboard />
              </TeacherLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/teacher/create"
          element={
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherLayout>
                <CreateAssignment />
              </TeacherLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/teacher/grade"
          element={
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherLayout>
                <GradeSubmissions />
              </TeacherLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/teacher/materials"
          element={
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherLayout>
                <CourseMaterialUpload />
              </TeacherLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/teacher/submissions"
          element={
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherLayout>
                <ViewSubmissions />
              </TeacherLayout>
            </RoleGuard>
          }
        />

        {/* ---------- Student Routes ---------- */}
        <Route
          path="/dashboard/student"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <StudentDashboard />
              </StudentLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/student/feedback"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <SubmitFeedback />
              </StudentLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/student/test"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <TakeTest />
              </StudentLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/student/transcripts"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <MyTranscripts />
              </StudentLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/student/grades"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <ViewGrades />
              </StudentLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/student/courses"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <MyCourses />
              </StudentLayout>
            </RoleGuard>
          }
        />

        {/* ---------- Student Course Detail + Tabs ---------- */}
        <Route
          path="/dashboard/student/courses/:courseId"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <CourseDetail />
              </StudentLayout>
            </RoleGuard>
          }
        >
          <Route path="assignments" element={<AssignmentsList />} />
          <Route path="materials" element={<CourseMaterials />} />
          <Route path="grades" element={<CourseGrades />} />
          <Route path="feedback" element={<CourseFeedback />} />
          <Route path="syllabus" element={<Syllabus />} />
        </Route>

        {/* Assignment & Quiz Views */}
        <Route
          path="/dashboard/student/courses/:courseId/assignments/:assignmentId"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <AssignmentView />
              </StudentLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/dashboard/student/courses/:courseId/quizzes/:quizId"
          element={
            <RoleGuard allowedRoles={["student"]}>
              <StudentLayout>
                <QuizView />
              </StudentLayout>
            </RoleGuard>
          }
        />

        {/* Default redirect after login (→ Teacher Dashboard) */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/teacher" />} />
      </Route>

      {/* ---------- Fallback Routes ---------- */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default AppRouter;
