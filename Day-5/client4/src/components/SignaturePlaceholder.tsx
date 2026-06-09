interface Props {
  x: number;
  y: number;
}

function SignaturePlaceholder({
  x,
  y,
}: Props) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "150px",
        height: "60px",
        border: "3px solid red",
        backgroundColor:
          "rgba(255,0,0,0.2)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: "bold",
        zIndex: 9999,
      }}
    >
      SIGN HERE
    </div>
  );
}

export default SignaturePlaceholder;