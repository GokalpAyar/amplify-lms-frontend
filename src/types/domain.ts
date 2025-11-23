export interface Course {
  id: string
  name: string
  description?: string
}

export interface Activity {
  id: string
  courseId: string
  name: string
  speechMode: 'disabled' | 'optional' | 'required'
  maxPoints: number
}

export interface Submission {
  id: string
  activityId: string
  userId: string
  text?: string
  audioUrl?: string
  score?: number
  createdAt: string
}

/* Expand as you add endpoints */
