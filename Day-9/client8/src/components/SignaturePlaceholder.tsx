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

  // Update position when parent updates x/y
  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  useEffect(() => {
    const handleMouseMove = (
      e: MouseEvent
    ) => {
      if (!dragging) return;

      const newX =
        position.x + e.movementX;

      const newY =
        position.y + e.movementY;

      setPosition({
        x: newX,
        y: newY,
      });

      if (onPositionChange) {
        onPositionChange(
          newX,
          newY
        );
      }
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
  }, [
    dragging,
    position,
    onPositionChange,
  ]);

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
        backgroundColor:
          "rgba(255,255,0,0.9)",
        border:
          "3px solid red",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "move",
        zIndex: 9999,
        fontWeight: "bold",
        fontSize: "16px",
        userSelect: "none",
      }}
    >
      SIGN HERE
    </div>
  );
}

export default SignaturePlaceholder;