import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Presentation, Slide, Layout, Element, LayoutType, GridStructure, getPredefinedGridStructures } from '@/types';
import { devtools, persist } from 'zustand/middleware'
import { generateId } from '@/utils/id';

interface PresentationState {
  presentations: Presentation[];

  // Работа с презентациями
  createPresentation: (title: string) => string;
  updatePresentation: (id: string, data: Partial<Presentation>) => void;
  deletePresentation: (id: string) => void;
  getPresentation: (id: string) => Presentation | undefined;

  // Работа со слайдами
  addSlide: (presentationId: string, title?: string) => string;
  updateSlide: (presentationId: string, slideId: string, data: Partial<Slide>) => void;
  deleteSlide: (presentationId: string, slideId: string) => void;
  duplicateSlide: (presentationId: string, slideId: string) => string;
  reorderSlides: (presentationId: string, startIndex: number, endIndex: number) => void;

  // Работа с макетами
  addLayout: (presentationId: string, slideId: string, layout: Omit<Layout, 'id'> | LayoutType) => string;
  updateLayout: (presentationId: string, slideId: string, layoutId: string, data: Partial<Layout>) => void;
  deleteLayout: (presentationId: string, slideId: string, layoutId: string) => void;
  updateAndPotentiallyDeleteLayout: (
    presentationId: string, 
    slideId: string, 
    layoutId: string, 
    data: Partial<Layout>, 
    deleteIfEmpty?: boolean
  ) => void;

  // Работа с элементами
  addElement: (presentationId: string, slideId: string, layoutId: string, element: Omit<Element, 'id'>) => string;
  updateElement: (presentationId: string, slideId: string, layoutId: string, elementId: string, data: Partial<Element>) => void;
  deleteElement: (presentationId: string, slideId: string, layoutId: string, elementId: string) => void;
}

// Create the store with properly configured middleware
export const usePresentationStore = create<PresentationState>()(
  devtools(
    (set, get) => ({
      presentations: [],

      // Методы для работы с презентациями
      createPresentation: (title: string) => {
        const id = uuidv4();
        const now = Date.now();

        const newPresentation: Presentation = {
          id,
          title,
          slides: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          presentations: [...state.presentations, newPresentation],
        }));

        // Добавляем первый слайд по умолчанию
        get().addSlide(id, 'Титульный слайд');

        return id;
      },

      updatePresentation: (id, data) => {
        set((state) => ({
          presentations: state.presentations.map((presentation) =>
            presentation.id === id
              ? { ...presentation, ...data, updatedAt: Date.now() }
              : presentation
          ),
        }));
      },

      deletePresentation: (id) => {
        set((state) => ({
          presentations: state.presentations.filter((presentation) => presentation.id !== id),
        }));
      },

      getPresentation: (id) => {
        return get().presentations.find((presentation) => presentation.id === id);
      },

      // Методы для работы со слайдами
      addSlide: (presentationId, title = 'Новый слайд') => {
        const slideId = uuidv4();

        const defaultGridType = 'single-column';
        const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

        const elements: Element[] = defaultLayoutGridStructure.rows.map(row => {
          return row.cells.map(cell => ({
            id: generateId(),
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            style: {},
            zIndex: 0,
            cellId: cell.id,
          }))
        }).flat();

        const layout: Layout = {
          id: generateId(),
          gridStructure: defaultLayoutGridStructure,
          type: defaultGridType,
          style: {},
          elements,
        }

        const newSlide: Slide = {
          id: slideId,
          title,
          layouts: [layout],
          background: {
            type: 'color',
            value: '#ffffff',
          },
          style: {},
        };

        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: [...presentation.slides, newSlide],
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));

        // Добавляем пустой макет по умолчанию
        // get().addLayout(presentationId, slideId, 'blank');

        return slideId;
      },

      updateSlide: (presentationId, slideId, data) => {
        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.map((slide) =>
                  slide.id === slideId ? { ...slide, ...data } : slide
                ),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));
      },

      deleteSlide: (presentationId, slideId) => {
        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.filter((slide) => slide.id !== slideId),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));
      },

      duplicateSlide: (presentationId, slideId) => {
        const { presentations } = get();
        const presentation = presentations.find((p) => p.id === presentationId);

        if (!presentation) return '';

        const slideToClone = presentation.slides.find((s) => s.id === slideId);

        if (!slideToClone) return '';

        const newSlideId = uuidv4();

        // Глубокое клонирование слайда с новыми ID
        const clonedSlide: Slide = {
          ...JSON.parse(JSON.stringify(slideToClone)),
          id: newSlideId,
          title: `${slideToClone.title} (копия)`,
          layouts: slideToClone.layouts.map((layout) => ({
            ...layout,
            id: uuidv4(),
            elements: layout.elements.map((element) => ({
              ...element,
              id: uuidv4(),
            })),
          })),
        };

        set((state) => ({
          presentations: state.presentations.map((p) => {
            if (p.id === presentationId) {
              return {
                ...p,
                slides: [...p.slides, clonedSlide],
                updatedAt: Date.now(),
              };
            }
            return p;
          }),
        }));

        return newSlideId;
      },

      reorderSlides: (presentationId, startIndex, endIndex) => {
        set((state) => {
          const presentation = state.presentations.find((p) => p.id === presentationId);

          if (!presentation) return state;

          const newSlides = [...presentation.slides];
          const [removed] = newSlides.splice(startIndex, 1);
          newSlides.splice(endIndex, 0, removed);

          return {
            presentations: state.presentations.map((p) =>
              p.id === presentationId
                ? { ...p, slides: newSlides, updatedAt: Date.now() }
                : p
            ),
          };
        });
      },

      // Методы для работы с макетами
      addLayout: (presentationId, slideId, layout) => {
        console.log('addLayot', layout)
        const layoutId = uuidv4();

        // Если передан только тип макета (строка), создаем объект макета
        const newLayout: Layout = typeof layout === 'string'
          ? {
            id: layoutId,
            type: layout,
            elements: [],
            style: {},
          }
          : {
            ...layout,
            id: layoutId,
          };

        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.map((slide) => {
                  if (slide.id === slideId) {
                    return {
                      ...slide,
                      layouts: [...slide.layouts, newLayout],
                    };
                  }
                  return slide;
                }),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));

        return layoutId;
      },

      updateLayout: (presentationId, slideId, layoutId, data) => {
        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.map((slide) => {
                  if (slide.id === slideId) {
                    return {
                      ...slide,
                      layouts: slide.layouts.map((layout) =>
                        layout.id === layoutId ? { ...layout, ...data } : layout
                      ),
                    };
                  }
                  return slide;
                }),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));
      },

      deleteLayout: (presentationId, slideId, layoutId) => {
        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.map((slide) => {
                  if (slide.id === slideId) {
                    return {
                      ...slide,
                      layouts: slide.layouts.filter((layout) => layout.id !== layoutId),
                    };
                  }
                  return slide;
                }),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));
      },

      updateAndPotentiallyDeleteLayout: (
        presentationId, 
        slideId, 
        layoutId, 
        data, 
        deleteIfEmpty = false
      ) => {
        set((state) => {
          const presentation = state.presentations.find((p) => p.id === presentationId);
          if (!presentation) return state;

          // First, update the layout with the new data
          const updatedSlides = presentation.slides.map((slide) => {
            if (slide.id !== slideId) return slide;
            
            // Get the updated layout
            const updatedLayouts = slide.layouts.map((layout) => 
              layout.id === layoutId ? { ...layout, ...data } : layout
            );
            
            // Check if we need to delete the layout
            const updatedLayout = updatedLayouts.find((layout) => layout.id === layoutId);
            
            if (deleteIfEmpty && updatedLayout && updatedLayout.elements.length === 0) {
              // If the layout is now empty and deleteIfEmpty is true, remove it
              return {
                ...slide,
                layouts: updatedLayouts.filter((layout) => layout.id !== layoutId)
              };
            }
            
            // Otherwise just return the slide with updated layouts
            return {
              ...slide,
              layouts: updatedLayouts
            };
          });

          // Return the updated state
          return {
            presentations: state.presentations.map((p) =>
              p.id === presentationId 
                ? { ...presentation, slides: updatedSlides, updatedAt: Date.now() } 
                : p
            )
          };
        });
      },

      // Методы для работы с элементами
      addElement: (presentationId, slideId, layoutId, elementData) => {
        const elementId = uuidv4();

        const newElement: Element = {
          ...elementData as Element,
          id: elementId,
        };

        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.map((slide) => {
                  if (slide.id === slideId) {
                    return {
                      ...slide,
                      layouts: slide.layouts.map((layout) => {
                        if (layout.id === layoutId) {
                          return {
                            ...layout,
                            elements: [...layout.elements, newElement],
                          };
                        }
                        return layout;
                      }),
                    };
                  }
                  return slide;
                }),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));

        return elementId;
      },

      updateElement: (presentationId, slideId, layoutId, elementId, data) => {
        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.map((slide) => {
                  if (slide.id === slideId) {
                    return {
                      ...slide,
                      layouts: slide.layouts.map((layout) => {
                        if (layout.id === layoutId) {
                          return {
                            ...layout,
                            elements: layout.elements.map((element) =>
                              element.id === elementId ? { ...element, ...data } : element
                            ),
                          };
                        }
                        return layout;
                      }),
                    };
                  }
                  return slide;
                }),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));
      },

      deleteElement: (presentationId, slideId, layoutId, elementId) => {
        set((state) => ({
          presentations: state.presentations.map((presentation) => {
            if (presentation.id === presentationId) {
              return {
                ...presentation,
                slides: presentation.slides.map((slide) => {
                  if (slide.id === slideId) {
                    return {
                      ...slide,
                      layouts: slide.layouts.map((layout) => {
                        if (layout.id === layoutId) {
                          return {
                            ...layout,
                            elements: layout.elements.filter(
                              (element) => element.id !== elementId
                            ),
                          };
                        }
                        return layout;
                      }),
                    };
                  }
                  return slide;
                }),
                updatedAt: Date.now(),
              };
            }
            return presentation;
          }),
        }));
      },
    }),
    {
      name: 'presentation-store',
      enabled: true,
    }
  )
); 