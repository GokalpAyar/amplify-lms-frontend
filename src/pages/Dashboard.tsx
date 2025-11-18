import { Link } from '@tanstack/react-router'
import { useDashboard } from '@/hooks'

const Dashboard = () => {
  const { data, isLoading, isError, error } = useDashboard()

  if (isLoading) {
    return <p className="p-4">Loading dashboard…</p>
  }

  if (isError) {
    return (
      <p className="p-4 text-red-600">
        Error loading dashboard: {(error as Error).message}
      </p>
    )
  }

  if (!data) {
    return <p className="p-4">No data.</p>
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Courses" value={data.totalCourses} />
        <StatCard label="Activities" value={data.totalActivities} />
        <StatCard label="Pending Submissions" value={data.pendingSubmissions} />
      </div>

      {/* Recent activity list */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Recent</h2>
        <ul className="space-y-2">
          {data.recent.map(item => (
            <li key={item.id}>
              <Link
                to={
                  item.type === 'course'
                    ? `/courses/${item.id}`
                    : `/courses/???/activities/${item.id}` // replace ??? when backend returns courseId too
                }
                className="block px-4 py-2 rounded bg-white shadow hover:bg-gray-100"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="p-4 rounded bg-white shadow text-center">
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
)

export default Dashboard
