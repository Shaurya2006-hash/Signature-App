import { useState } from "react";

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
    useState({
      x,
      y,
    });

  const handleMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (e.buttons !== 1) return;

    const newX = e.clientX - 100;
    const newY = e.clientY - 100;

    setPosition({
      x: newX,
      y: newY,
    });

    onPositionChange?.(
      newX,
      newY
    );
  };

  return (
    <div
      onMouseMove={handleMove}
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
      }}
    >
      SIGN HERE
    </div>
  );
}

export default SignaturePlaceholder;