import { useRouter, Link } from '@tanstack/react-router'
import { useCourse, useActivities } from '@/hooks'

const CourseDetail = () => {
  const { params } = useRouter().state.location
  const { courseId } = params as { courseId: string }

  /* ── fetch course metadata (name, description) ── */
  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
    error: courseErr,
  } = useCourse(courseId)

  /* ── fetch activities for this course ── */
  const {
    data: activities,
    isLoading: activitiesLoading,
    isError: activitiesError,
    error: activitiesErr,
  } = useActivities(courseId)

  if (courseLoading || activitiesLoading) {
    return <p className="p-4">Loading course…</p>
  }

  if (courseError || activitiesError) {
    return (
      <p className="p-4 text-red-600">
        Error: {(courseErr || activitiesErr as Error).message}
      </p>
    )
  }

  if (!course) {
    return <p className="p-4">Course not found.</p>
  }

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">{course.name}</h1>

      <h2 className="text-xl font-semibold mb-2">Activities</h2>
      {activities && activities.length > 0 ? (
        <ul className="space-y-2">
          {activities.map(a => (
            <li key={a.id}>
              <Link
                to={`/courses/${courseId}/activities/${a.id}`}
                className="block px-4 py-2 rounded bg-white shadow hover:bg-gray-100"
              >
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No activities yet.</p>
      )}
    </section>
  )
}

export default CourseDetail
