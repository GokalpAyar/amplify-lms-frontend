import { useRouter } from '@tanstack/react-router'
import SpeechField from '@/components/speech/SpeechField'
import { useActivity } from '@/hooks'

const ActivityDetail = () => {
  const { params } = useRouter().state.location
  const { courseId, activityId } = params as {
    courseId: string
    activityId: string
  }

  const {
    data: activity,
    isLoading,
    isError,
    error,
  } = useActivity(courseId, activityId)

  if (isLoading) {
    return <p className="p-4">Loading activity…</p>
  }

  if (isError) {
    return (
      <p className="p-4 text-red-600">
        Error loading activity: {(error as Error).message}
      </p>
    )
  }

  if (!activity) {
    return <p className="p-4">Activity not found.</p>
  }

  const { speechMode, name } = activity
  const speechRequired = speechMode === 'required' || speechMode === 'optional'

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{name}</h1>

      {speechRequired && (
        <div className="p-4 rounded bg-white shadow">
          <h2 className="font-semibold mb-2">
            {speechMode === 'required'
              ? 'Answer by speaking (required):'
              : 'Answer by speaking (optional):'}
          </h2>
          <SpeechField />
        </div>
      )}

      <div className="p-4 rounded bg-white shadow">
        <h2 className="font-semibold mb-2">Answer by typing:</h2>
        <textarea
          className="w-full h-40 p-2 border rounded"
          placeholder="Type your answer here…"
        />
      </div>
    </section>
  )
}

export default ActivityDetail
