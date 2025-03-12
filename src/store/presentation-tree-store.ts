import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Node,
  PresentationNode,
  SlideNode,
  LayoutNode,
  ElementNode,
  ElementNodeUnion,
  TextElementNode,
  ListElementNode,
  ImageElementNode,
  DividerElementNode,
  IconElementNode,
  VideoElementNode,
  ChartElementNode,
  ButtonElementNode,
  LayoutType,
  ElementType
} from '../types/presentation-tree';

interface PresentationTreeState {
  // Все узлы хранятся в одной плоской структуре для удобства доступа по ID
  nodes: Record<string, Node>;
  
  // ID корневого узла (презентации)
  rootId: string | null;
  
  // Выбранные узлы
  selectedNodeId: string | null;
  
  // Методы для работы с деревом
  createPresentation: (title: string) => string;
  addSlide: (presentationId: string, title?: string) => string;
  addLayout: (slideId: string, layoutType: LayoutType) => string;
  addElement: <T extends ElementNodeUnion>(layoutId: string, element: Omit<T, 'id' | 'parentId' | 'type'>) => string;
  
  // Методы для обновления узлов
  updateNode: <T extends Node>(nodeId: string, data: Partial<Omit<T, 'id' | 'type' | 'parentId'>>) => void;
  
  // Методы для удаления узлов
  deleteNode: (nodeId: string) => void;
  
  // Методы для выбора узлов
  selectNode: (nodeId: string | null) => void;
  
  // Методы для перемещения элементов
  moveElement: (elementId: string, targetId: string) => void;
  
  // Вспомогательные методы
  getChildrenIds: (nodeId: string) => string[];
  getNodeById: (nodeId: string) => Node | null;
  getNodesByType: (type: Node['type']) => Node[];
  getNodesByParentId: (parentId: string) => Node[];
}

export const usePresentationTreeStore = create<PresentationTreeState>((set, get) => ({
  nodes: {},
  rootId: null,
  selectedNodeId: null,
  
  // Создание новой презентации (корневого узла)
  createPresentation: (title: string) => {
    const id = uuidv4();
    const now = Date.now();
    
    const presentationNode: PresentationNode = {
      id,
      parentId: null,
      type: 'presentation',
      title,
      createdAt: now,
      updatedAt: now,
    };
    
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: presentationNode,
      },
      rootId: id,
    }));
    
    return id;
  },
  
  // Добавление нового слайда
  addSlide: (presentationId: string, title = 'Новый слайд') => {
    const id = uuidv4();
    
    const slideNode: SlideNode = {
      id,
      parentId: presentationId,
      type: 'slide',
      title,
      background: {
        type: 'color',
        value: '#ffffff',
      },
    };
    
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: slideNode,
      },
    }));
    
    // Обновляем время изменения презентации
    get().updateNode<PresentationNode>(presentationId, {
      updatedAt: Date.now(),
    });
    
    // Автоматически создаем пустой макет для нового слайда
    const layoutId = get().addLayout(id, 'blank');
    
    return id;
  },
  
  // Добавление нового макета
  addLayout: (slideId: string, layoutType: LayoutType) => {
    const id = uuidv4();
    
    const layoutNode: LayoutNode = {
      id,
      parentId: slideId,
      type: 'layout',
      layoutType,
      gridTemplate: {},
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: {},
      zIndex: 1,
    };
    
    // Настраиваем шаблон сетки в зависимости от типа макета
    switch (layoutType) {
      case 'single-column':
        layoutNode.gridTemplate = {
          areas: '"content"',
          columns: '1fr',
          rows: 'auto',
        };
        break;
        
      case 'two-columns':
        layoutNode.gridTemplate = {
          areas: '"left right"',
          columns: '1fr 1fr',
          rows: 'auto',
        };
        break;
        
      case 'three-columns':
        layoutNode.gridTemplate = {
          areas: '"col1 col2 col3"',
          columns: '1fr 1fr 1fr',
          rows: 'auto',
        };
        break;
        
      case 'four-columns':
        layoutNode.gridTemplate = {
          areas: '"col1 col2 col3 col4"',
          columns: '1fr 1fr 1fr 1fr',
          rows: 'auto',
        };
        break;
        
      case 'image-text':
        layoutNode.gridTemplate = {
          areas: '"image text"',
          columns: '1fr 1fr',
          rows: 'auto',
        };
        break;
        
      case 'text-image':
        layoutNode.gridTemplate = {
          areas: '"text image"',
          columns: '1fr 1fr',
          rows: 'auto',
        };
        break;
        
      case 'cards':
        layoutNode.gridTemplate = {
          areas: '"card1 card2 card3"',
          columns: '1fr 1fr 1fr',
          rows: 'auto',
        };
        break;
        
      case 'icons-with-text':
        layoutNode.gridTemplate = {
          areas: '"icon1 icon2 icon3" "text1 text2 text3"',
          columns: '1fr 1fr 1fr',
          rows: 'auto auto',
        };
        break;
        
      case 'grid':
        layoutNode.gridTemplate = {
          areas: '". . ." ". . ." ". . ."',
          columns: '1fr 1fr 1fr',
          rows: '1fr 1fr 1fr',
        };
        break;
        
      case 'blank':
      default:
        // Для пустого макета не задаем шаблон
        break;
    }
    
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: layoutNode,
      },
    }));
    
    return id;
  },
  
  // Добавление нового элемента
  addElement: <T extends ElementNodeUnion>(layoutId: string, element: Omit<T, 'id' | 'parentId' | 'type'>) => {
    const id = uuidv4();
    
    // Проверяем, существует ли макет
    const layout = get().getNodeById(layoutId);
    
    // Если layoutId указывает на слайд, а не на макет, создаем новый макет и добавляем элемент в него
    if (layout && layout.type === 'slide') {
      const slideId = layoutId;
      const newLayoutId = get().addLayout(slideId, 'blank');
      
      // Рекурсивно вызываем addElement с новым ID макета
      return get().addElement(newLayoutId, element);
    }
    
    const elementNode: ElementNodeUnion = {
      id,
      parentId: layoutId,
      type: 'element',
      ...element,
    } as ElementNodeUnion;
    
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: elementNode,
      },
    }));
    
    return id;
  },
  
  // Обновление узла
  updateNode: <T extends Node>(nodeId: string, data: Partial<Omit<T, 'id' | 'type' | 'parentId'>>) => {
    set((state) => {
      const node = state.nodes[nodeId];
      
      if (!node) return state;
      
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: {
            ...node,
            ...data,
          },
        },
      };
    });
    
    // Если обновляем не презентацию, то обновляем время изменения презентации
    const node = get().nodes[nodeId];
    if (node && node.type !== 'presentation') {
      // Находим корневой узел (презентацию)
      let currentNode: Node = node;
      let parentNode: Node | null = null;
      
      while (currentNode.parentId !== null) {
        parentNode = get().nodes[currentNode.parentId];
        if (!parentNode) break;
        currentNode = parentNode;
      }
      
      // Обновляем время изменения презентации
      if (parentNode && currentNode.type === 'presentation') {
        set((state) => {
          const presentationNode = state.nodes[currentNode.id] as PresentationNode;
          return {
            nodes: {
              ...state.nodes,
              [currentNode.id]: {
                ...presentationNode,
                updatedAt: Date.now(),
              },
            },
          };
        });
      }
    }
  },
  
  // Удаление узла и всех его дочерних узлов
  deleteNode: (nodeId: string) => {
    const childrenIds = get().getChildrenIds(nodeId);
    
    set((state) => {
      const newNodes = { ...state.nodes };
      
      // Удаляем все дочерние узлы
      childrenIds.forEach((id) => {
        delete newNodes[id];
      });
      
      // Удаляем сам узел
      delete newNodes[nodeId];
      
      return {
        nodes: newNodes,
        // Если удаляем корневой узел, сбрасываем rootId
        rootId: state.rootId === nodeId ? null : state.rootId,
        // Если удаляем выбранный узел, сбрасываем selectedNodeId
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      };
    });
  },
  
  // Выбор узла
  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },
  
  // Перемещение элемента между контейнерами (макетами или слайдами)
  moveElement: (elementId: string, targetId: string) => {
    const element = get().getNodeById(elementId);
    const target = get().getNodeById(targetId);
    
    // Проверяем, что элемент и целевой контейнер существуют
    if (!element || !target) return;
    
    // Проверяем, что элемент - это элемент, а целевой контейнер - макет или слайд
    if (element.type !== 'element' || (target.type !== 'layout' && target.type !== 'slide')) return;
    
    // Если целевой контейнер - слайд, создаем новый макет и перемещаем элемент в него
    if (target.type === 'slide') {
      const slideId = targetId;
      const newLayoutId = get().addLayout(slideId, 'blank');
      
      // Обновляем родителя элемента
      set((state) => {
        const updatedElement = {
          ...state.nodes[elementId],
          parentId: newLayoutId,
        };
        
        return {
          nodes: {
            ...state.nodes,
            [elementId]: updatedElement,
          },
        };
      });
    } else {
      // Обновляем родителя элемента
      set((state) => {
        const updatedElement = {
          ...state.nodes[elementId],
          parentId: targetId,
        };
        
        return {
          nodes: {
            ...state.nodes,
            [elementId]: updatedElement,
          },
        };
      });
    }
  },
  
  // Получение всех дочерних узлов (рекурсивно)
  getChildrenIds: (nodeId: string) => {
    const result: string[] = [];
    
    const addChildrenIds = (id: string) => {
      const children = get().getNodesByParentId(id);
      
      children.forEach((child) => {
        result.push(child.id);
        addChildrenIds(child.id);
      });
    };
    
    addChildrenIds(nodeId);
    
    return result;
  },
  
  // Получение узла по ID
  getNodeById: (nodeId: string) => {
    return get().nodes[nodeId] || null;
  },
  
  // Получение узлов по типу
  getNodesByType: (type: Node['type']) => {
    return Object.values(get().nodes).filter((node) => node.type === type);
  },
  
  // Получение узлов по родительскому ID
  getNodesByParentId: (parentId: string) => {
    return Object.values(get().nodes).filter((node) => node.parentId === parentId);
  },
})); 