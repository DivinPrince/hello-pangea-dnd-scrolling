import * as React from 'react';
import { DragDropContextProps } from '@hello-pangea/dnd';

export type BoxType = {
  x: number;
  w: number;
  y: number;
  h: number;
};

interface Point {
  x: number;
  y: number;
}

export type StrengthFunction = (box: BoxType, point: Point) => number;
/** @deprecated use `StrengthFunction` instead */
export type StrengthFuncton = StrengthFunction;

// Custom DragDropContext with scrolling support
export interface DndScrollingContextProps extends DragDropContextProps {
  children: React.ReactNode;
}

export const DndScrollingContext: React.FC<DndScrollingContextProps>;

export function useDndScrolling(
  ref: React.RefObject<HTMLElement>,
  options?: {
    verticalStrength?: StrengthFunction;
    horizontalStrength?: StrengthFunction;
    strengthMultiplier?: number;
    onScrollChange?: (newLeft: number, newTop: number) => void;
  }
): void;

export function createHorizontalStrength(_buffer: number): StrengthFunction;
export function createVerticalStrength(_buffer: number): StrengthFunction;

export const defaultHorizontalStrength: StrengthFunction;
export const defaultVerticalStrength: StrengthFunction;

export default function withScrolling<
  T extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>
>(
  component: T
): React.ComponentType<
  React.ComponentProps<T> & {
    verticalStrength?: StrengthFunction;
    horizontalStrength?: StrengthFunction;
    strengthMultiplier?: number;
    onScrollChange?: (newLeft: number, newTop: number) => void;
  }
>;
