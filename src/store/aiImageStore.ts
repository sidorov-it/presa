import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface GeneratedImage {
    id: string;
    url: string;
    alt?: string;
}

export interface AIImageGenerationState {
    // Element-specific generation states
    generating: Record<string, boolean>; // elementId -> isGenerating
    generatedImages: Record<string, GeneratedImage[]>; // elementId -> images
    selectedImages: Record<string, string>; // elementId -> selectedImageId
    prompts: Record<string, string>; // elementId -> prompt
    styles: Record<string, string>; // elementId -> style
    customStyles: Record<string, string>; // elementId -> custom style text
    errors: Record<string, string>; // elementId -> error message
}

interface AIImageStore extends AIImageGenerationState {
    // Actions
    setGenerating: (elementId: string, isGenerating: boolean) => void;
    setGeneratedImages: (elementId: string, images: GeneratedImage[]) => void;
    setSelectedImage: (elementId: string, imageId: string) => void;
    setPrompt: (elementId: string, prompt: string) => void;
    setStyle: (elementId: string, style: string) => void;
    setCustomStyle: (elementId: string, customStyle: string) => void;
    setError: (elementId: string, error: string) => void;
    clearError: (elementId: string) => void;
    clearElementState: (elementId: string) => void;

    // Getters
    isGenerating: (elementId: string) => boolean;
    getGeneratedImages: (elementId: string) => GeneratedImage[];
    getSelectedImage: (elementId: string) => GeneratedImage | null;
    getPrompt: (elementId: string) => string;
    getStyle: (elementId: string) => string;
    getCustomStyle: (elementId: string) => string;
    getError: (elementId: string) => string | null;
}

export const useAIImageStore = create<AIImageStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            generating: {},
            generatedImages: {},
            selectedImages: {},
            prompts: {},
            styles: {},
            customStyles: {},
            errors: {},

            // Actions
            setGenerating: (elementId: string, isGenerating: boolean) =>
                set(state => ({
                    generating: {
                        ...state.generating,
                        [elementId]: isGenerating,
                    },
                })),

            setGeneratedImages: (elementId: string, images: GeneratedImage[]) =>
                set(state => ({
                    generatedImages: {
                        ...state.generatedImages,
                        [elementId]: images,
                    },
                })),

            setSelectedImage: (elementId: string, imageId: string) =>
                set(state => ({
                    selectedImages: {
                        ...state.selectedImages,
                        [elementId]: imageId,
                    },
                })),

            setPrompt: (elementId: string, prompt: string) =>
                set(state => ({
                    prompts: {
                        ...state.prompts,
                        [elementId]: prompt,
                    },
                })),

            setStyle: (elementId: string, style: string) =>
                set(state => ({
                    styles: {
                        ...state.styles,
                        [elementId]: style,
                    },
                })),

            setCustomStyle: (elementId: string, customStyle: string) =>
                set(state => ({
                    customStyles: {
                        ...state.customStyles,
                        [elementId]: customStyle,
                    },
                })),

            setError: (elementId: string, error: string) =>
                set(state => ({
                    errors: {
                        ...state.errors,
                        [elementId]: error,
                    },
                })),

            clearError: (elementId: string) =>
                set(state => ({
                    errors: {
                        ...state.errors,
                        [elementId]: '',
                    },
                })),

            clearElementState: (elementId: string) =>
                set(state => {
                    const newState = { ...state };
                    delete newState.generating[elementId];
                    delete newState.generatedImages[elementId];
                    delete newState.selectedImages[elementId];
                    delete newState.prompts[elementId];
                    delete newState.styles[elementId];
                    delete newState.customStyles[elementId];
                    delete newState.errors[elementId];
                    return newState;
                }),

            // Getters
            isGenerating: (elementId: string) => get().generating[elementId] || false,
            
            getGeneratedImages: (elementId: string) => get().generatedImages[elementId] || [],
            
            getSelectedImage: (elementId: string) => {
                const images = get().generatedImages[elementId] || [];
                const selectedId = get().selectedImages[elementId];
                return images.find(img => img.id === selectedId) || null;
            },
            
            getPrompt: (elementId: string) => get().prompts[elementId] || '',
            
            getStyle: (elementId: string) => get().styles[elementId] || 'none',
            
            getCustomStyle: (elementId: string) => get().customStyles[elementId] || '',
            
            getError: (elementId: string) => get().errors[elementId] || null,
        }),
        {
            name: 'ai-image-store',
            enabled: process.env.NODE_ENV === 'development',
        }
    )
); 