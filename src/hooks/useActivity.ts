import { useQuery } from '@tanstack/react-query'
import { Activity } from '@/types/domain'
import { fetcher } from '@/utils/fetcher'

export const useActivity = (
  courseId: string | undefined,
  activityId: string | undefined,
) =>
  useQuery({
    enabled: !!courseId && !!activityId,
    queryKey: ['activity', courseId, activityId],
    queryFn: () =>
      fetcher<Activity>(
        `/courses/${courseId}/activities/${activityId}`,
      ),
  })
