// store/auth.ts
import { create } from 'zustand'

type Role = 'admin' | 'teacher' | 'student'

interface AuthState {
  user: { name: string, role: Role } | null
  setUser: (user: AuthState['user']) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
