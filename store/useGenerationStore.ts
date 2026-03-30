import { create } from 'zustand'
import { StyleOption } from '@/constants'

export interface ReferenceImage {
  uri: string
  id: string
}

export interface GenerationResult {
  uri: string
  id: string
}

export type GenerationStatus = 'idle' | 'compressing' | 'uploading' | 'generating' | 'success' | 'error'

interface GenerationStore {
  // State
  referenceImages: ReferenceImage[]
  selfieUri: string | null
  selectedStyle: StyleOption
  status: GenerationStatus
  results: GenerationResult[]
  error: string | null

  // Actions
  addReferenceImage: (uri: string) => void
  removeReferenceImage: (id: string) => void
  setReferenceImages: (images: ReferenceImage[]) => void
  setSelfie: (uri: string | null) => void
  setStyle: (style: StyleOption) => void
  setStatus: (status: GenerationStatus) => void
  setResults: (results: GenerationResult[]) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  referenceImages: [],
  selfieUri: null,
  selectedStyle: 'realistic' as StyleOption,
  status: 'idle' as GenerationStatus,
  results: [],
  error: null,
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  ...initialState,

  addReferenceImage: (uri) =>
    set((state) => ({
      referenceImages: [
        ...state.referenceImages,
        { uri, id: `ref_${Date.now()}_${Math.random().toString(36).slice(2)}` },
      ],
    })),

  removeReferenceImage: (id) =>
    set((state) => ({
      referenceImages: state.referenceImages.filter((img) => img.id !== id),
    })),

  setReferenceImages: (images) => set({ referenceImages: images }),

  setSelfie: (uri) => set({ selfieUri: uri }),

  setStyle: (style) => set({ selectedStyle: style }),

  setStatus: (status) => set({ status }),

  setResults: (results) => set({ results, status: 'success' }),

  setError: (error) => set({ error, status: 'error' }),

  reset: () => set(initialState),
}))
