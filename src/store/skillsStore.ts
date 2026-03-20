import { create } from 'zustand'
import { SkillManifest } from '../types'

interface SkillsState {
  skills: SkillManifest[]
  setSkills: (skills: SkillManifest[]) => void
}

export const useSkillsStore = create<SkillsState>((set) => ({
  skills: [],
  setSkills: (skills) => set({ skills }),
}))
