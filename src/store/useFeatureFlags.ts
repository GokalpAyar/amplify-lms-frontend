import { create } from 'zustand'

interface FeatureFlags {
  speechGlobal: boolean
  setSpeechGlobal: (val: boolean) => void
}

export const useFeatureFlags = create<FeatureFlags>(set => ({
  speechGlobal: true,
  setSpeechGlobal: speechGlobal => set({ speechGlobal }),
}))
