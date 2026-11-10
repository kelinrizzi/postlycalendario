import { useRef, type HTMLAttributes } from "react";

export type TextOffset = { x: number; y: number };
export type TextElement = "title" | "text" | "handle" | "label";
export type TextOffsets = Partial<Record<TextElement, TextOffset>>;

export function MovableText({ offset, onMove, canvasSize = 1080, style, children, ...props }: HTMLAttributes<HTMLDivElement> & {
  offset?: TextOffset;
  onMove?: (offset: TextOffset) => void;
  canvasSize?: number;
}) {
  const drag = useRef<{ x: number; y: number; offset: TextOffset; scale: number; minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  return <div {...props} style={{ ...style, transform: `translate(${offset?.x ?? 0}px, ${offset?.y ?? 0}px)`, ...(onMove ? { cursor: "move", touchAction: "none", userSelect: "none" } : {}) }}
    onPointerDown={onMove ? (event) => {
      if (event.button !== 0) return;
      const element = event.currentTarget;
      const canvas = element.closest("[data-slide-canvas]");
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const scale = bounds.width / canvasSize;
      drag.current = { x: event.clientX, y: event.clientY, offset: offset ?? { x: 0, y: 0 }, scale,
        minX: (bounds.left - rect.left) / scale, maxX: (bounds.right - rect.right) / scale,
        minY: (bounds.top - rect.top) / scale, maxY: (bounds.bottom - rect.bottom) / scale };
      element.setPointerCapture(event.pointerId);
      event.preventDefault();
    } : undefined}
    onPointerMove={onMove ? (event) => {
      const current = drag.current;
      if (!current) return;
      const dx = Math.max(current.minX, Math.min(current.maxX, (event.clientX - current.x) / current.scale));
      const dy = Math.max(current.minY, Math.min(current.maxY, (event.clientY - current.y) / current.scale));
      onMove({ x: current.offset.x + dx, y: current.offset.y + dy });
    } : undefined}
    onPointerUp={() => { drag.current = null; }}
    onPointerCancel={() => { drag.current = null; }}
  >{children}</div>;
}