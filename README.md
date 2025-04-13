# hello-pangea-dnd-scrolling

A cross-browser solution to scrolling during drag and drop for [@hello-pangea/dnd](https://github.com/hello-pangea/dnd).

## Installation

```bash
npm install @hello-pangea/dnd hello-pangea-dnd-scrolling
```

or

```bash
yarn add @hello-pangea/dnd hello-pangea-dnd-scrolling
```

## Usage

There are two main ways to use this library:

### 1. Using DndScrollingContext (Recommended)

This approach provides the best integration with @hello-pangea/dnd:

```jsx
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import withScrolling, { DndScrollingContext } from 'hello-pangea-dnd-scrolling';

// Create a scrollable container
const ScrollableDroppable = withScrolling(props => {
  const { children, ...rest } = props;
  return (
    <div
      style={{
        height: '400px',
        width: '300px',
        overflow: 'auto',
        border: '1px solid #ccc',
        padding: '8px'
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

// Use DndScrollingContext instead of DragDropContext
function App() {
  const onDragEnd = (result) => {
    // Your reordering logic here
  };

  return (
    <DndScrollingContext onDragEnd={onDragEnd}>
      <ScrollableDroppable>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {item.content}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </ScrollableDroppable>
    </DndScrollingContext>
  );
}
```

### 2. Using the Hook

```jsx
import React, { useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useDndScrolling } from 'hello-pangea-dnd-scrolling';

function ScrollableContainer({ children }) {
  const ref = useRef(null);
  useDndScrolling(ref);

  return (
    <div
      ref={ref}
      style={{
        height: '400px',
        width: '300px',
        overflow: 'auto',
        border: '1px solid #ccc',
        padding: '8px'
      }}
    >
      {children}
    </div>
  );
}

function App() {
  const onDragEnd = (result) => {
    // Your reordering logic here
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <ScrollableContainer>
        <Droppable droppableId="droppable">
          {/* ... */}
        </Droppable>
      </ScrollableContainer>
    </DragDropContext>
  );
}
```

## Options

Both the HOC and the hook accept the following options:

```jsx
// Default values
const options = {
  // Called with the new scrollLeft and scrollTop values when the container scrolls
  onScrollChange: () => {},
  // A function that returns the horizontal strength (between -1 and 1)
  horizontalStrength: defaultHorizontalStrength,
  // A function that returns the vertical strength (between -1 and 1)
  verticalStrength: defaultVerticalStrength,
  // Multiplier for the strength
  strengthMultiplier: 30
};

// Example usage
useDndScrolling(ref, options);
// or
withScrolling(Component, options);
```

## How It Works

The library tracks the drag position and automatically scrolls the container when the dragged item gets close to the edges. This works by:

1. With `DndScrollingContext`: We intercept drag events from @hello-pangea/dnd to get precise drag coordinates.
2. With `useDndScrolling`: We use DOM events to detect dragging and scroll accordingly.

## Example

Check out the `src/example.jsx` file for a complete example of how to use this library with @hello-pangea/dnd.

## License

MIT
