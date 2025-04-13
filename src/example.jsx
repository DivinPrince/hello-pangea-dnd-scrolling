import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import withScrolling, { DndScrollingContext } from './index.jsx';

// Create a scrollable container that uses our scrolling functionality
const ScrollableDroppable = withScrolling(props => {
  const { children, ...rest } = props;
  return (
    <div
      style={{
        height: '400px',
        width: '300px',
        overflow: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px'
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

// Example item component
const Item = ({ item, index }) => {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            userSelect: 'none',
            padding: 16,
            margin: '0 0 8px 0',
            backgroundColor: snapshot.isDragging ? '#e1f5fe' : '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            ...provided.draggableProps.style
          }}
        >
          {item.content}
        </div>
      )}
    </Draggable>
  );
};

// Example list component
const List = ({ items }) => {
  return (
    <Droppable droppableId="list-1">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {items.map((item, index) => (
            <Item key={item.id} item={item} index={index} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

// Example app component
const Example = () => {
  // Generate some sample items
  const generateItems = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      content: `Item ${i + 1}`
    }));
  };

  const [items, setItems] = useState(generateItems(20));

  // Handle drag end event
  const onDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    // Reorder the items
    const newItems = Array.from(items);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);

    setItems(newItems);
  };

  return (
    <div>
      <h1>@hello-pangea/dnd Scrolling Example</h1>
      <p>Try dragging items near the edges to see automatic scrolling</p>
      
      {/* Use our custom DndScrollingContext instead of the standard DragDropContext */}
      <DndScrollingContext onDragEnd={onDragEnd}>
        <ScrollableDroppable>
          <List items={items} />
        </ScrollableDroppable>
      </DndScrollingContext>
    </div>
  );
};

export default Example; 