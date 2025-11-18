import { useQuery } from '@tanstack/react-query'
import { Activity } from '@/types/domain'
import { fetcher } from '@/utils/fetcher'

export const useActivities = (courseId: string | undefined) =>
  useQuery({
    enabled: !!courseId,
    queryKey: ['activities', courseId],
    queryFn: () => fetcher<Activity[]>(`/courses/${courseId}/activities`),
  })
