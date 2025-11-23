// routes/index.tsx
<Route path="/dashboard" element={<ProtectedLayout />}>
  <Route path="admin" element={<AdminDashboard />} />
  <Route path="teacher" element={<TeacherDashboard />} />
  <Route path="student" element={<StudentDashboard />} />
</Route>
