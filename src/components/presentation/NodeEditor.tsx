import React from 'react';
import { usePresentationTreeStore } from '../../store/presentation-tree-store';
import { 
  Node, 
  PresentationNode, 
  SlideNode, 
  LayoutNode, 
  ElementNodeUnion,
  TextElementNode,
  ListElementNode,
  ImageElementNode,
  IconElementNode,
  VideoElementNode,
  ChartElementNode,
  ButtonElementNode
} from '../../types/presentation-tree';

// Редактор презентации
const PresentationEditor: React.FC<{ node: PresentationNode }> = ({ node }) => {
  const { updateNode } = usePresentationTreeStore();
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode<PresentationNode>(node.id, { title: e.target.value });
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode<PresentationNode>(node.id, { description: e.target.value });
  };
  
  return (
    <div className="node-editor presentation-editor">
      <h2>Редактирование презентации</h2>
      
      <div className="form-group">
        <label htmlFor="title">Название:</label>
        <input
          type="text"
          id="title"
          value={node.title}
          onChange={handleTitleChange}
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Описание:</label>
        <textarea
          id="description"
          value={node.description || ''}
          onChange={handleDescriptionChange}
          className="form-control"
          rows={4}
        />
      </div>
      
      <div className="form-group">
        <label>Создано:</label>
        <div>{new Date(node.createdAt).toLocaleString()}</div>
      </div>
      
      <div className="form-group">
        <label>Обновлено:</label>
        <div>{new Date(node.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
};

// Редактор слайда
const SlideEditor: React.FC<{ node: SlideNode }> = ({ node }) => {
  const { updateNode, addLayout, addElement } = usePresentationTreeStore();
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode<SlideNode>(node.id, { title: e.target.value });
  };
  
  const handleBackgroundTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNode<SlideNode>(node.id, { 
      background: {
        ...node.background,
        type: e.target.value as 'color' | 'image' | 'gradient'
      }
    });
  };
  
  const handleBackgroundValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode<SlideNode>(node.id, { 
      background: {
        ...node.background,
        value: e.target.value
      }
    });
  };
  
  const handleAddLayout = (layoutType: string) => {
    addLayout(node.id, layoutType as any);
  };
  
  // Функции для быстрого добавления элементов на слайд
  const handleAddTextElement = () => {
    const textElement: Omit<TextElementNode, 'id' | 'parentId' | 'type'> = {
      elementType: 'text',
      content: 'Двойной клик для редактирования текста',
      position: { x: 0, y: 0 },
      size: { width: 200, height: 50 },
      style: { fontSize: '16px', color: '#333333' },
      zIndex: 1,
    };
    addElement(node.id, textElement);
  };
  
  const handleAddHeadingElement = () => {
    const headingElement: Omit<TextElementNode, 'id' | 'parentId' | 'type'> = {
      elementType: 'heading',
      content: 'Заголовок',
      position: { x: 0, y: 0 },
      size: { width: 300, height: 60 },
      style: { fontSize: '24px', fontWeight: 'bold', color: '#111111', textAlign: 'center' },
      zIndex: 1,
    };
    addElement(node.id, headingElement);
  };
  
  const handleAddImageElement = () => {
    const imageElement: Omit<ImageElementNode, 'id' | 'parentId' | 'type'> = {
      elementType: 'image',
      src: 'https://via.placeholder.com/300x200',
      alt: 'Изображение',
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
      style: {},
      zIndex: 1,
    };
    addElement(node.id, imageElement);
  };
  
  return (
    <div className="node-editor slide-editor">
      <h2>Редактирование слайда</h2>
      
      <div className="form-group">
        <label htmlFor="title">Название:</label>
        <input
          type="text"
          id="title"
          value={node.title}
          onChange={handleTitleChange}
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="background-type">Тип фона:</label>
        <select
          id="background-type"
          value={node.background.type}
          onChange={handleBackgroundTypeChange}
          className="form-control"
        >
          <option value="color">Цвет</option>
          <option value="image">Изображение</option>
          <option value="gradient">Градиент</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="background-value">Значение фона:</label>
        <input
          type="text"
          id="background-value"
          value={node.background.value}
          onChange={handleBackgroundValueChange}
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label>Добавить элемент:</label>
        <div className="element-buttons">
          <button onClick={handleAddTextElement}>Текст</button>
          <button onClick={handleAddHeadingElement}>Заголовок</button>
          <button onClick={handleAddImageElement}>Изображение</button>
        </div>
      </div>
      
      <div className="form-group">
        <label>Добавить макет:</label>
        <div className="layout-buttons">
          <button onClick={() => handleAddLayout('single-column')}>Одна колонка</button>
          <button onClick={() => handleAddLayout('two-columns')}>Две колонки</button>
          <button onClick={() => handleAddLayout('three-columns')}>Три колонки</button>
          <button onClick={() => handleAddLayout('image-text')}>Изображение + текст</button>
          <button onClick={() => handleAddLayout('blank')}>Пустой макет</button>
        </div>
      </div>
    </div>
  );
};

// Редактор макета
const LayoutEditor: React.FC<{ node: LayoutNode }> = ({ node }) => {
  const { updateNode } = usePresentationTreeStore();
  
  const handleLayoutTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNode<LayoutNode>(node.id, { layoutType: e.target.value as any });
  };
  
  const handleGridTemplateChange = (field: keyof LayoutNode['gridTemplate'], value: string) => {
    updateNode<LayoutNode>(node.id, { 
      gridTemplate: {
        ...node.gridTemplate,
        [field]: value
      }
    });
  };
  
  return (
    <div className="node-editor layout-editor">
      <h2>Редактирование макета</h2>
      
      <div className="form-group">
        <label htmlFor="layout-type">Тип макета:</label>
        <select
          id="layout-type"
          value={node.layoutType}
          onChange={handleLayoutTypeChange}
          className="form-control"
        >
          <option value="single-column">Одна колонка</option>
          <option value="two-columns">Две колонки</option>
          <option value="three-columns">Три колонки</option>
          <option value="four-columns">Четыре колонки</option>
          <option value="image-text">Изображение + текст</option>
          <option value="text-image">Текст + изображение</option>
          <option value="cards">Карточки</option>
          <option value="icons-with-text">Иконки с текстом</option>
          <option value="grid">Сетка</option>
          <option value="blank">Пустой макет</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="grid-areas">Grid Areas:</label>
        <textarea
          id="grid-areas"
          value={node.gridTemplate.areas || ''}
          onChange={(e) => handleGridTemplateChange('areas', e.target.value)}
          className="form-control"
          rows={3}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="grid-columns">Grid Columns:</label>
        <input
          type="text"
          id="grid-columns"
          value={node.gridTemplate.columns || ''}
          onChange={(e) => handleGridTemplateChange('columns', e.target.value)}
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="grid-rows">Grid Rows:</label>
        <input
          type="text"
          id="grid-rows"
          value={node.gridTemplate.rows || ''}
          onChange={(e) => handleGridTemplateChange('rows', e.target.value)}
          className="form-control"
        />
      </div>
    </div>
  );
};

// Редактор текстового элемента
const TextElementEditor: React.FC<{ node: TextElementNode }> = ({ node }) => {
  const { updateNode } = usePresentationTreeStore();
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode<TextElementNode>(node.id, { content: e.target.value });
  };
  
  const handleStyleChange = (field: string, value: string) => {
    updateNode<TextElementNode>(node.id, { 
      style: {
        ...node.style || {},
        [field]: value
      }
    });
  };
  
  return (
    <div className="node-editor element-editor text-element-editor">
      <h2>Редактирование текста</h2>
      
      <div className="form-group">
        <label htmlFor="content">Содержимое:</label>
        <textarea
          id="content"
          value={node.content}
          onChange={handleContentChange}
          className="form-control"
          rows={5}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="font-size">Размер шрифта:</label>
        <input
          type="text"
          id="font-size"
          value={node.style?.fontSize || ''}
          onChange={(e) => handleStyleChange('fontSize', e.target.value)}
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="color">Цвет текста:</label>
        <input
          type="color"
          id="color"
          value={node.style?.color || '#000000'}
          onChange={(e) => handleStyleChange('color', e.target.value)}
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="text-align">Выравнивание:</label>
        <select
          id="text-align"
          value={node.style?.textAlign || 'left'}
          onChange={(e) => handleStyleChange('textAlign', e.target.value)}
          className="form-control"
        >
          <option value="left">По левому краю</option>
          <option value="center">По центру</option>
          <option value="right">По правому краю</option>
          <option value="justify">По ширине</option>
        </select>
      </div>
    </div>
  );
};

// Главный компонент редактора узлов
const NodeEditor: React.FC = () => {
  const { selectedNodeId, getNodeById } = usePresentationTreeStore();
  
  if (!selectedNodeId) {
    return (
      <div className="node-editor-empty">
        <p>Выберите узел для редактирования</p>
      </div>
    );
  }
  
  const node = getNodeById(selectedNodeId);
  if (!node) {
    return (
      <div className="node-editor-empty">
        <p>Узел не найден</p>
      </div>
    );
  }
  
  // Рендерим соответствующий редактор в зависимости от типа узла
  switch (node.type) {
    case 'presentation':
      return <PresentationEditor node={node as PresentationNode} />;
    case 'slide':
      return <SlideEditor node={node as SlideNode} />;
    case 'layout':
      return <LayoutEditor node={node as LayoutNode} />;
    case 'element':
      const element = node as ElementNodeUnion;
      
      // Выбираем редактор в зависимости от типа элемента
      switch (element.elementType) {
        case 'text':
        case 'heading':
        case 'paragraph':
          return <TextElementEditor node={element as TextElementNode} />;
        // Здесь можно добавить редакторы для других типов элементов
        default:
          return (
            <div className="node-editor-empty">
              <p>Редактор для этого типа элемента еще не реализован</p>
            </div>
          );
      }
    default:
      return (
        <div className="node-editor-empty">
          <p>Неизвестный тип узла</p>
        </div>
      );
  }
};

export default NodeEditor; 