// pages/dashboard/StudentDashboard.tsx
export default function StudentDashboard() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Courses" link="/courses" />
        <Card title="Start Recording" link="/recordings" />
        <Card title="Messages" link="/messages" />
      </div>
    </div>
  )
}
