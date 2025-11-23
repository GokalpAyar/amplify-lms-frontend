import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/utils/fetcher'

export interface DashboardStats {
  totalCourses: number
  totalActivities: number
  pendingSubmissions: number
  recent: { id: string; name: string; type: 'course' | 'activity' }[]
}

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetcher<DashboardStats>('/dashboard/stats'),
  })
