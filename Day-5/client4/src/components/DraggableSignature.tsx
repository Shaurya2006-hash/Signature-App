import {
  DndContext,
  useDraggable,
} from "@dnd-kit/core";

interface Props {
  x: number;
  y: number;
  onMove: (
    x: number,
    y: number
  ) => void;
}

function DraggableItem({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: "signature",
  });

  const style = {
    position: "absolute" as const,
    left: x,
    top: y,
    width: "150px",
    height: "60px",
    backgroundColor: "yellow",
    border: "3px solid red",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
    zIndex: 9999,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      SIGN HERE
    </div>
  );
}

function DraggableSignature({
  x,
  y,
  onMove,
}: Props) {
  return (
    <DndContext
      onDragEnd={(event) => {
        const dx =
          event.delta.x;

        const dy =
          event.delta.y;

        onMove(
          x + dx,
          y + dy
        );
      }}
    >
      <DraggableItem
        x={x}
        y={y}
      />
    </DndContext>
  );
}

export default DraggableSignature;