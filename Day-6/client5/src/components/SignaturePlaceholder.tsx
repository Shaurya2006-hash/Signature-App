import {
  useEffect,
  useState,
} from "react";

interface Props {
  x: number;
  y: number;
  onPositionChange?: (
    x: number,
    y: number
  ) => void;
}

function SignaturePlaceholder({
  x,
  y,
  onPositionChange,
}: Props) {
  const [position, setPosition] =
    useState({ x, y });

  const [dragging, setDragging] =
    useState(false);

  useEffect(() => {
    const handleMouseMove = (
      e: MouseEvent
    ) => {
      if (!dragging) return;

      setPosition((prev) => {
        const newX =
          prev.x + e.movementX;

        const newY =
          prev.y + e.movementY;

        onPositionChange?.(
          newX,
          newY
        );

        return {
          x: newX,
          y: newY,
        };
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    document.addEventListener(
      "mousemove",
      handleMouseMove
    );

    document.addEventListener(
      "mouseup",
      handleMouseUp
    );

    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      document.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, [dragging, onPositionChange]);

  return (
    <div
      onMouseDown={() =>
        setDragging(true)
      }
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "150px",
        height: "60px",
        backgroundColor: "yellow",
        border: "3px solid red",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "move",
        zIndex: 9999,
        fontWeight: "bold",
        userSelect: "none",
      }}
    >
      SIGN HERE
    </div>
  );
}

export default SignaturePlaceholder;