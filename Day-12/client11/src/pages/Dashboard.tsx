import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import SignaturePlaceholder from "../components/SignaturePlaceholder";
import PdfViewer from "../components/PdfViewer";
import { getDocuments } from "../api/documentApi";
import {
  getSignatures,
  saveSignature,
  generatePdf,
} from "../api/signatureApi";

interface DocumentType {
  _id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  createdAt?: string;
}

interface SignatureType {
  _id: string;
  fileId: string;
  signer: string;

  signerName?: string;
  fontStyle?: string;
  signatureImage?: string; // add this

  x: number;
  y: number;
  status: string;
}

type SignatureMode = "type" | "draw";

const FONT_OPTIONS = [
  { value: "italic", label: "Italic", style: { fontStyle: "italic" as const } },
  { value: "bold", label: "Bold", style: { fontWeight: "bold" as const } },
  {
    value: "cursive",
    label: "Cursive",
    style: { fontFamily: "cursive", fontStyle: "italic" as const },
  },
  {
    value: "elegant",
    label: "Elegant",
    style: { fontFamily: "'Georgia', serif", fontStyle: "italic" as const, letterSpacing: "2px" },
  },
];

function getPreviewStyle(font: string): React.CSSProperties {
  const found = FONT_OPTIONS.find((f) => f.value === font);
  return found ? found.style : {};
}

function Dashboard() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [signatures, setSignatures] = useState<SignatureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPdf, setSelectedPdf] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");

  const [dragX, setDragX] = useState(200);
  const [dragY, setDragY] = useState(300);
  const [signerType, setSignerType] =
  useState("");

const [recipientEmail,
  setRecipientEmail] =
  useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 1 — Signature UI state
  const [signerName, setSignerName] = useState("");
  const [fontStyle, setFontStyle] = useState("italic");
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("type");
  const [signatureImage, setSignatureImage] = useState("");
  const [signatureSaved, setSignatureSaved] = useState(false);

  // Step 4 — Draw signature ref
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login first");
          setLoading(false);
          return;
        }

        const docsData = await getDocuments(token);
        setDocuments(docsData);

        const sigData = await getSignatures();
        setSignatures(sigData);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSavePosition = () => {
    // Just reveal the Signature Settings panel
    setSignatureSaved(true);
  };

  const handleSaveSignature = async () => {
    try {
      const payload: any = {
        fileId: selectedDocId,
        signer: "Shaurya",
        signerName,
        fontStyle,
        x: dragX,
        y: dragY,
        status: "pending",
      };

      // Include drawn signature image if in draw mode
      if (signatureMode === "draw" && signatureImage) {
        payload.signatureImage = signatureImage;
      }

      const response = await saveSignature(payload);
      console.log("Saved:", response);

      const updatedSignatures = await getSignatures();
      setSignatures(updatedSignatures);

      alert("Signature saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save signature");
    }
  };

  const handleGeneratePdf = async () => {
    try {
      const result = await generatePdf(selectedDocId);
      alert("Signed PDF Generated");
      window.open(result.downloadUrl, "_blank");
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Select a PDF first");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("pdf", selectedFile);

      const token = localStorage.getItem("token");

      await fetch("http://localhost:5000/api/docs/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      alert("Document Uploaded Successfully");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClearCanvas = () => {
    sigCanvasRef.current?.clear();
    setSignatureImage("");
  };

  const handleSaveDrawnSignature = () => {
    if (sigCanvasRef.current?.isEmpty()) {
      alert("Please draw a signature first");
      return;
    }
    const image = sigCanvasRef.current!.toDataURL();
    setSignatureImage(image);
    alert("Drawn signature captured!");
  };

  if (loading) {
    return <div className="p-6 text-lg">Loading documents...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }
const handleSendRequest =
  async () => {

    if (!recipientEmail) {
      alert(
        "Enter signer email"
      );
      return;
    }

    try {

      await fetch(
        "http://localhost:5000/api/signature-request/create",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email:
              recipientEmail,

            documentId:
              selectedDocId,
          }),
        }
      );

      alert(
        "Signature Request Sent"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Failed To Send Request"
      );
    }
  };
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">My Documents</h1>

      {/* Upload Section */}
      <div className="mb-8 border p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">Upload PDF</h2>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="ml-4 bg-green-600 text-white px-5 py-2 rounded"
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <p className="text-center text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc._id} className="border rounded-xl p-5 shadow-md bg-white">
              <h2 className="font-bold text-lg mb-2">{doc.originalName}</h2>
              <p className="text-gray-600">Size: {(doc.fileSize / 1024).toFixed(2)} KB</p>
              <p className="text-gray-600 mb-4">File Name: {doc.fileName}</p>

              <button
                onClick={() => {
                  setSelectedPdf(
                    `http://localhost:5000/${doc.filePath.replace(/\\/g, "/")}`
                  );
                  setSelectedDocId(doc._id);
                  setSignatureSaved(false);
                  setSignatureImage("");

                  const existingSignature = signatures.find(
                    (sig) => sig.fileId === doc._id
                  );

                  if (existingSignature) {
                    setDragX(existingSignature.x);
                    setDragY(existingSignature.y);
                    if (existingSignature.signerName)
                      setSignerName(existingSignature.signerName);
                    if (existingSignature.fontStyle)
                      setFontStyle(existingSignature.fontStyle);
                  } else {
                    setDragX(200);
                    setDragY(300);
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                View PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PDF Preview + Signature Workflow */}
      {selectedPdf && (
        <div className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">PDF Preview</h2>

            <button
              onClick={() => {
                setSelectedPdf("");
                setSelectedDocId("");
                setSignatureSaved(false);
                setSignatureImage("");
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Close Preview
            </button>
          </div>

          {/* PDF + Draggable Placeholder */}
          <div style={{ position: "relative", width: "1000px", margin: "0 auto" }}>
            <PdfViewer fileUrl={selectedPdf} />

            <SignaturePlaceholder
              x={dragX}
              y={dragY}
              onPositionChange={(x, y) => {
                setDragX(x);
                setDragY(y);
              }}
            />
          </div>

          {/* Position Info + Save Position Button */}
          <div className="mt-6 text-center">
            <p className="mb-4 text-lg font-semibold">
              X: {dragX} | Y: {dragY}
            </p>

            <button
              onClick={handleSavePosition}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Save Signature Position
            </button>

            <button
              onClick={handleGeneratePdf}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 ml-4"
            >
              Generate Signed PDF
            </button>
          </div>
          {signatureSaved && !signerType && (
  <div className="mt-6 border p-5 rounded-lg bg-white shadow-md max-w-2xl mx-auto">
    <h3 className="font-bold text-xl mb-4">
      Who Will Sign?
    </h3>

    <div className="flex gap-4 justify-center">
      <button
        onClick={() => setSignerType("self")}
        className="bg-blue-600 text-white px-5 py-3 rounded"
      >
        I Will Sign
      </button>

      <button
        onClick={() => setSignerType("other")}
        className="bg-green-600 text-white px-5 py-3 rounded"
      >
        Someone Else
      </button>
    </div>
  </div>
)}

          {/* Step 1 + 4 — Signature Settings Panel (shown after Save Position) */}
          {signatureSaved &&
          signerType === "self" && (
            <div className="mt-6 border p-5 rounded-lg shadow-md bg-white max-w-2xl mx-auto">
              <h3 className="font-bold text-xl mb-4">Signature Settings</h3>

              {/* Signature Mode Toggle */}
              <div className="mb-4">
                <p className="font-semibold mb-2">Choose Signature Type</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sigMode"
                      value="type"
                      checked={signatureMode === "type"}
                      onChange={() => setSignatureMode("type")}
                    />
                    Type Signature
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sigMode"
                      value="draw"
                      checked={signatureMode === "draw"}
                      onChange={() => setSignatureMode("draw")}
                    />
                    Draw Signature
                  </label>
                </div>
              </div>

              {/* Type Signature Mode */}
              {signatureMode === "type" && (
                <>
                  {/* Signer Name Input */}
                  <input
                    type="text"
                    placeholder="Signer Name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="border p-2 w-full mb-4 rounded"
                  />

                  {/* Font Style Selection */}
                  <p className="font-semibold mb-2">Choose Font</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {FONT_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="fontStyle"
                          value={opt.value}
                          checked={fontStyle === opt.value}
                          onChange={() => setFontStyle(opt.value)}
                        />
                        <span style={opt.style} className="text-lg">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Live Preview */}
                  <p className="font-semibold mb-2">Preview</p>
                  <div
                    className="border p-4 text-2xl rounded bg-gray-50 min-h-[60px] mb-4"
                    style={getPreviewStyle(fontStyle)}
                  >
                    {signerName || (
                      <span className="text-gray-400 text-base">
                        Your name will appear here...
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Draw Signature Mode */}
              {signatureMode === "draw" && (
                <div className="mb-4">
                  <p className="font-semibold mb-2">Draw your signature below:</p>

                  <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="black"
                    canvasProps={{
                      width: 500,
                      height: 180,
                      className: "border rounded bg-gray-50",
                    }}
                  />

                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={handleSaveDrawnSignature}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Capture Signature
                    </button>
                    <button
                      onClick={handleClearCanvas}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Preview captured drawing */}
                  {signatureImage && (
                    <div className="mt-4">
                      <p className="font-semibold mb-1 text-green-700">
                        ✅ Signature captured:
                      </p>
                      <img
                        src={signatureImage}
                        alt="Drawn Signature"
                        className="border rounded max-h-24"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Save Signature Button */}
              <button
                onClick={handleSaveSignature}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold text-lg"
              >
                Save Signature
              </button>
            </div>
          )}
        </div>
      )}
      {signatureSaved &&
 signerType === "other" && (

<div className="mt-6 border p-5 rounded-lg shadow-md bg-white max-w-2xl mx-auto">

  <h3 className="font-bold text-xl mb-4">
    Send Signature Request
  </h3>

  <input
    type="email"
    placeholder="Signer Email"
    value={recipientEmail}
    onChange={(e) =>
      setRecipientEmail(e.target.value)
    }
    className="border p-2 w-full mb-4 rounded"
  />

  <button
    onClick={handleSendRequest}
    className="bg-purple-600 text-white px-5 py-3 rounded"
  >
    Send Request
  </button>

</div>

)}
    </div>
  );
}

export default Dashboard;
