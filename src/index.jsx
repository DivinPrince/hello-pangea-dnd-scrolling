import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from '@hello-pangea/dnd';
import hoist from 'hoist-non-react-statics';
import { noop } from './util';
import ScrollingMonitor from './ScrollingMonitor';

const DEFAULT_BUFFER = 150;

const getDisplayName = PassedComponent =>
  PassedComponent.displayName ||
  PassedComponent.name ||
  (typeof PassedComponent === 'string' && PassedComponent.length > 0
    ? PassedComponent
    : 'Unknown');

export function createHorizontalStrength(_buffer) {
  return function defaultHorizontalStrength({ x, w, y, h }, point) {
    const buffer = Math.min(w / 2, _buffer);
    const inRange = point.x >= x && point.x <= x + w;
    const inBox = inRange && point.y >= y && point.y <= y + h;

    if (inBox) {
      if (point.x < x + buffer) {
        return (point.x - x - buffer) / buffer;
      } else if (point.x > x + w - buffer) {
        return -(x + w - point.x - buffer) / buffer;
      }
    }

    return 0;
  };
}

export function createVerticalStrength(_buffer) {
  return function defaultVerticalStrength({ y, h, x, w }, point) {
    const buffer = Math.min(h / 2, _buffer);
    const inRange = point.y >= y && point.y <= y + h;
    const inBox = inRange && point.x >= x && point.x <= x + w;

    if (inBox) {
      if (point.y < y + buffer) {
        return (point.y - y - buffer) / buffer;
      } else if (point.y > y + h - buffer) {
        return -(y + h - point.y - buffer) / buffer;
      }
    }

    return 0;
  };
}

export const defaultHorizontalStrength = createHorizontalStrength(DEFAULT_BUFFER);

export const defaultVerticalStrength = createVerticalStrength(DEFAULT_BUFFER);

const defaultOptions = {
  onScrollChange: noop,
  verticalStrength: defaultVerticalStrength,
  horizontalStrength: defaultHorizontalStrength,
  strengthMultiplier: 30
};

// Custom DragDropContext that allows us to intercept drag events
export const DndScrollingContext = ({ children, onDragEnd, ...props }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);
  
  const handleDragStart = (start) => {
    setIsDragging(true);
    if (props.onDragStart) {
      props.onDragStart(start);
    }
  };

  const handleDragUpdate = (update) => {
    if (update.clientY && update.clientX) {
      setDragPosition({ x: update.clientX, y: update.clientY });
    }
    if (props.onDragUpdate) {
      props.onDragUpdate(update);
    }
  };

  const handleDragEnd = (result) => {
    setIsDragging(false);
    setDragPosition(null);
    if (onDragEnd) {
      onDragEnd(result);
    }
  };

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
      {...props}
    >
      {children}
    </DragDropContext>
  );
};

DndScrollingContext.propTypes = {
  children: PropTypes.node.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onDragStart: PropTypes.func,
  onDragUpdate: PropTypes.func
};

export function useDndScrolling(componentRef, scrollingOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);
  
  // Setup event listeners for mouse movement when using the hook directly
  useEffect(() => {
    if (!componentRef.current) {
      return () => {};
    }
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleDragStart = () => {
      setIsDragging(true);
    };
    
    const handleDragEnd = () => {
      setIsDragging(false);
      setDragPosition(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, [isDragging]);
  
  // Start scrolling when dragging
  useEffect(() => {
    if (!componentRef.current || !isDragging || !dragPosition) {
      return () => {};
    }
    
    const options = { ...defaultOptions, ...scrollingOptions };
    const monitor = new ScrollingMonitor(null, componentRef.current, options);
    
    monitor.start();
    monitor.manualUpdateScrolling(dragPosition);
    
    return () => {
      monitor.stop();
    };
  }, [componentRef.current, isDragging, dragPosition, scrollingOptions]);
}

export default function withScrolling(WrappedComponent) {
  function ScrollingComponent({
    onScrollChange = defaultOptions.onScrollChange,
    verticalStrength = defaultOptions.verticalStrength,
    horizontalStrength = defaultOptions.horizontalStrength,
    strengthMultiplier = defaultOptions.strengthMultiplier,
    ...restProps
  }) {
    const ref = useRef(null);
    useDndScrolling(ref, {
      strengthMultiplier,
      verticalStrength,
      horizontalStrength,
      onScrollChange
    });

    return <WrappedComponent {...restProps} ref={ref} />;
  }

  ScrollingComponent.displayName = `Scrolling(${getDisplayName(WrappedComponent)})`;
  ScrollingComponent.propTypes = {
    onScrollChange: PropTypes.func,
    verticalStrength: PropTypes.func,
    horizontalStrength: PropTypes.func,
    strengthMultiplier: PropTypes.number
  };

  return hoist(ScrollingComponent, WrappedComponent);
}
