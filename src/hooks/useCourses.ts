import { useQuery } from '@tanstack/react-query'
import { Course } from '@/types/domain'
import { fetcher } from '@/utils/fetcher'

export const COURSES_KEY = ['courses']

export const useCourses = () =>
  useQuery({
    queryKey: COURSES_KEY,
    queryFn: () => fetcher<Course[]>('/courses'),
  })
