import { useQuery } from '@tanstack/react-query'
import { Course } from '@/types/domain'
import { fetcher } from '@/utils/fetcher'

export const useCourse = (courseId: string | undefined) =>
  useQuery({
    enabled: !!courseId,
    queryKey: ['course', courseId],
    queryFn: () => fetcher<Course>(`/courses/${courseId}`),
  })
