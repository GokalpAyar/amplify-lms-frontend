import { Link } from '@tanstack/react-router'
import { useCourses } from '@/hooks'           // ← our hook

const Courses = () => {
  const {
    data: courses,
    isLoading,
    isError,
    error,
  } = useCourses()

  if (isLoading) {
    return <p className="p-4">Loading courses…</p>
  }

  if (isError) {
    return (
      <p className="p-4 text-red-600">
        Error loading courses: {(error as Error).message}
      </p>
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Courses</h1>

      {courses && courses.length > 0 ? (
        <ul className="space-y-2">
          {courses.map(c => (
            <li key={c.id}>
              <Link
                to={`/courses/${c.id}`}
                className="block px-4 py-2 rounded bg-white shadow hover:bg-gray-100"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No courses found.</p>
      )}
    </section>
  )
}

export default Courses
