import React, { useState } from 'react';
import { usePresentationTreeStore } from '../../store/presentation-tree-store';
import { 
  Node, 
  SlideNode, 
  LayoutNode, 
  ElementNodeUnion,
  TextElementNode,
  ListElementNode,
  ImageElementNode,
  DividerElementNode,
  IconElementNode,
  VideoElementNode,
  ChartElementNode,
  ButtonElementNode
} from '../../types/presentation-tree';

// Компонент для отображения текстового элемента
const TextElementPreview: React.FC<{ element: TextElementNode }> = ({ element }) => {
  const { content, style, elementType } = element;
  
  // Определяем тег в зависимости от типа текстового элемента
  const Tag = elementType === 'heading' ? 'h2' : elementType === 'paragraph' ? 'p' : 'div';
  
  return React.createElement(
    Tag,
    {
      className: `element-preview text-element-preview ${elementType}-preview`,
      style: {
        color: style?.color,
        fontSize: style?.fontSize,
        fontWeight: style?.fontWeight,
        textAlign: style?.textAlign as any,
        ...style
      }
    },
    content
  );
};

// Компонент для отображения элемента списка
const ListElementPreview: React.FC<{ element: ListElementNode }> = ({ element }) => {
  const { items, listType, style } = element;
  
  const ListTag = listType === 'bullet' ? 'ul' : 'ol';
  
  return React.createElement(
    ListTag,
    {
      className: "element-preview list-element-preview",
      style: {
        color: style?.color,
        fontSize: style?.fontSize,
        ...style
      }
    },
    items.map((item, index) => (
      <li key={index}>{item}</li>
    ))
  );
};

// Компонент для отображения элемента изображения
const ImageElementPreview: React.FC<{ element: ImageElementNode }> = ({ element }) => {
  const { src, alt, style } = element;
  
  return (
    <img
      src={src}
      alt={alt}
      className="element-preview image-element-preview"
      style={{
        borderRadius: style?.borderRadius,
        ...style
      }}
    />
  );
};

// Компонент для отображения элемента разделителя
const DividerElementPreview: React.FC<{ element: DividerElementNode }> = ({ element }) => {
  const { style } = element;
  
  return (
    <hr
      className="element-preview divider-element-preview"
      style={{
        backgroundColor: style?.backgroundColor || '#e0e0e0',
        height: '2px',
        border: 'none',
        ...style
      }}
    />
  );
};

// Компонент для отображения элемента
const ElementPreview: React.FC<{ element: ElementNodeUnion }> = ({ element }) => {
  const { moveElement } = usePresentationTreeStore();
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'element-move',
      elementId: element.id
    }));
  };
  
  return (
    <div 
      className="element-preview-wrapper"
      draggable
      onDragStart={handleDragStart}
    >
      {(() => {
        switch (element.elementType) {
          case 'text':
          case 'heading':
          case 'paragraph':
            return <TextElementPreview element={element as TextElementNode} />;
          case 'list':
            return <ListElementPreview element={element as ListElementNode} />;
          case 'image':
            return <ImageElementPreview element={element as ImageElementNode} />;
          case 'divider':
            return <DividerElementPreview element={element as DividerElementNode} />;
          // Здесь можно добавить другие типы элементов
          default:
            return <div className="element-preview-placeholder">Элемент: {element.elementType}</div>;
        }
      })()}
    </div>
  );
};

// Компонент для отображения макета
const LayoutPreview: React.FC<{ layout: LayoutNode, elements: ElementNodeUnion[] }> = ({ layout, elements }) => {
  const { moveElement } = usePresentationTreeStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'element-move') {
        moveElement(data.elementId, layout.id);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };
  
  return (
    <div 
      className={`layout-preview ${layout.layoutType}-layout ${isDraggingOver ? 'dragging-over' : ''}`}
      style={{
        display: 'grid',
        gridTemplateAreas: layout.gridTemplate.areas,
        gridTemplateColumns: layout.gridTemplate.columns,
        gridTemplateRows: layout.gridTemplate.rows,
        gap: layout.gap,
        ...layout.style
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {elements.map((element) => (
        <div 
          key={element.id}
          className="element-container"
          style={{
            gridArea: element.gridArea || 'auto',
            position: 'relative',
            zIndex: element.zIndex || 1
          }}
        >
          <ElementPreview element={element} />
        </div>
      ))}
    </div>
  );
};

// Компонент для отображения слайда
const SlidePreview: React.FC = () => {
  const { selectedNodeId, getNodeById, getNodesByParentId, moveElement } = usePresentationTreeStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  if (!selectedNodeId) {
    return (
      <div className="slide-preview-empty">
        <p>Выберите слайд для предпросмотра</p>
      </div>
    );
  }
  
  const node = getNodeById(selectedNodeId);
  
  // Обработчики для перетаскивания элементов на слайд
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, slideId: string) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'element-move') {
        moveElement(data.elementId, slideId);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };
  
  // Если выбран слайд, показываем его
  if (node?.type === 'slide') {
    const slide = node as SlideNode;
    
    // Получаем все макеты слайда
    const layouts = getNodesByParentId(slide.id).filter(n => n.type === 'layout') as LayoutNode[];
    
    // Получаем все элементы, которые могут быть добавлены напрямую на слайд
    const directElements = getNodesByParentId(slide.id).filter(n => n.type === 'element') as ElementNodeUnion[];
    
    return (
      <div 
        className={`slide-preview ${isDraggingOver ? 'dragging-over' : ''}`}
        style={{
          backgroundColor: slide.background.type === 'color' ? slide.background.value : undefined,
          backgroundImage: slide.background.type === 'image' ? `url(${slide.background.value})` : undefined,
          ...slide.style
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, slide.id)}
      >
        <h2 className="slide-title">{slide.title}</h2>
        
        {/* Отображаем элементы, добавленные напрямую на слайд */}
        {directElements.length > 0 && (
          <div className="direct-elements">
            {directElements.map((element) => (
              <div 
                key={element.id}
                className="element-container"
                style={{
                  position: 'relative',
                  zIndex: element.zIndex || 1
                }}
              >
                <ElementPreview element={element} />
              </div>
            ))}
          </div>
        )}
        
        {/* Отображаем макеты */}
        <div className="slide-content">
          {layouts.map((layout) => {
            const elements = getNodesByParentId(layout.id).filter(n => n.type === 'element') as ElementNodeUnion[];
            return (
              <LayoutPreview 
                key={layout.id} 
                layout={layout} 
                elements={elements} 
              />
            );
          })}
        </div>
      </div>
    );
  }
  
  // Если выбран макет, показываем только его
  if (node?.type === 'layout') {
    const layout = node as LayoutNode;
    const elements = getNodesByParentId(layout.id).filter(n => n.type === 'element') as ElementNodeUnion[];
    
    return (
      <div className="layout-preview-container">
        <h3>Предпросмотр макета</h3>
        <LayoutPreview layout={layout} elements={elements} />
      </div>
    );
  }
  
  // Если выбран элемент, показываем только его
  if (node?.type === 'element') {
    const element = node as ElementNodeUnion;
    
    return (
      <div className="element-preview-container">
        <h3>Предпросмотр элемента</h3>
        <ElementPreview element={element} />
      </div>
    );
  }
  
  return (
    <div className="slide-preview-empty">
      <p>Выберите слайд, макет или элемент для предпросмотра</p>
    </div>
  );
};

export default SlidePreview; 