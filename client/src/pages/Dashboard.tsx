import { useEffect, useRef, useState } from "react";
import API, { API_URL } from "../config/api";
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
  signatureImage?: string;
  x: number;
  y: number;
  status: string;
}

interface AuditLog {
  _id: string;
  documentId: string;
  action: "signed" | "rejected";
  email: string;
  ipAddress?: string;
  reason?: string;
  createdAt: string;
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
    style: {
      fontFamily: "'Georgia', serif",
      fontStyle: "italic" as const,
      letterSpacing: "2px",
    },
  },
];

function getPreviewStyle(font: string): React.CSSProperties {
  const found = FONT_OPTIONS.find((f) => f.value === font);
  return found ? found.style : {};
}
function Dashboard() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);

  // ─── Step 2: Status Filter ───────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("all");
  const [signatureRequests, setSignatureRequests] = useState<any[]>([]);

  // ─── Audit History ───────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditDocId, setAuditDocId] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const [signatures, setSignatures] = useState<SignatureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPdf, setSelectedPdf] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");

  const [dragX, setDragX] = useState(200);
  const [dragY, setDragY] = useState(300);
  const [signerType, setSignerType] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [signerName, setSignerName] = useState("");
  const [fontStyle, setFontStyle] = useState("italic");
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("type");
  const [signatureImage, setSignatureImage] = useState("");
  const [signatureSaved, setSignatureSaved] = useState(false);

  const sigCanvasRef = useRef<SignatureCanvas>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login first");
          setLoading(false);
          return;
        }

        // Step 2 — fetch all signature requests
        const requestResponse = await API.get("/api/signature-request");
        setSignatureRequests(requestResponse.data);

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

  // ─── Audit History Fetch ─────────────────────────────────────────────────
  const handleShowAudit = async (docId: string) => {
    // Toggle off if already open for same doc
    if (auditDocId === docId) {
      setAuditDocId(null);
      setAuditLogs([]);
      return;
    }

    try {
      setAuditDocId(docId);
      setAuditLoading(true);
      const response = await API.get(`/api/audit/${docId}`);
      setAuditLogs(response.data);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // ─── Step 2: Filtered Documents ──────────────────────────────────────────
  const filteredDocuments = documents.filter((doc) => {
    const request = signatureRequests.find(
      (r) => String(r.documentId) === doc._id
    );

    if (statusFilter === "all") return true;
    if (!request) return statusFilter === "pending";
    return request.status === statusFilter;
  });

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleSavePosition = () => {
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

      if (signatureMode === "draw" && signatureImage) {
        payload.signatureImage = signatureImage;
      }

      await saveSignature(payload);

      await API.put(`/api/signature-request/self-sign/${selectedDocId}`);

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
    const response = await generatePdf(selectedDocId);

    const blob = new Blob([response.data], {
      type: "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    window.open(url, "_blank");
  } catch (error) {
    console.error(error);
    alert("Failed to generate PDF");
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

  const handleSendRequest = async () => {
    if (!recipientEmail) {
      alert("Enter signer email");
      return;
    }

    try {
      await API.post("/api/signature-request/create", {
        email: recipientEmail,
        documentId: selectedDocId,
      });

      alert("Signature Request Sent");
    } catch (error) {
      console.error(error);
      alert("Failed To Send Request");
    }
  };

  // ─── Loading / Error States ──────────────────────────────────────────────
  if (loading) return <div className="p-6 text-lg">Loading documents...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-5xl font-extrabold text-center mb-10 text-slate-800">
          📄 My Documents
        </h1>

        {/* ── Upload Section ── */}
        <div className="mb-8 bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
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

        {/* ── Step 2: Status Filter Buttons ── */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded text-white ${
              statusFilter === "all" ? "bg-gray-800" : "bg-gray-500"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded text-white ${
              statusFilter === "pending" ? "bg-yellow-600" : "bg-yellow-500"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("signed")}
            className={`px-4 py-2 rounded text-white ${
              statusFilter === "signed" ? "bg-green-800" : "bg-green-600"
            }`}
          >
            Signed
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-4 py-2 rounded text-white ${
              statusFilter === "rejected" ? "bg-red-800" : "bg-red-600"
            }`}
          >
            Rejected
          </button>
        </div>

        {/* ── Documents List ── */}
        {filteredDocuments.length === 0 ? (
          <p className="text-center text-gray-500">No documents found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const request = signatureRequests.find(
                (r) => String(r.documentId) === doc._id
              );
              const docStatus = request?.status || "pending";

              return (
                <div
                  key={doc._id}
                  className="
                    bg-white/90
                    backdrop-blur-md
                    border border-slate-200
                    rounded-2xl
                    p-6
                    shadow-md
                    hover:shadow-xl
                    hover:-translate-y-1
                    transition-all
                    duration-300
                  "
                >
                  <h2 className="font-bold text-lg mb-2">{doc.originalName}</h2>
                  <p className="text-gray-600">
                    Size: {(doc.fileSize / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-gray-600 mb-2">
                    File Name: {doc.fileName}
                  </p>

                  {/* Step 2: Status Badge */}
                  <p className="font-semibold mt-2 mb-4">
                    Status:{" "}
                    <span
                      className={`px-2 py-1 rounded text-white text-sm ${
                        docStatus === "signed"
                          ? "bg-green-600"
                          : docStatus === "rejected"
                          ? "bg-red-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {docStatus.charAt(0).toUpperCase() + docStatus.slice(1)}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => {
                        console.log("PDF URL:", doc.filePath);

                        setSelectedPdf(doc.filePath);
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

                    {/* Audit History Button */}
                    <button
                      onClick={() => handleShowAudit(doc._id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      {auditDocId === doc._id ? "Hide Audit" : "Audit History"}
                    </button>
                  </div>

                  {/* ── Audit History Panel ── */}
                  {auditDocId === doc._id && (
                    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-bold text-lg mb-3">Audit History</h3>

                      {auditLoading ? (
                        <p className="text-gray-500">Loading logs...</p>
                      ) : auditLogs.length === 0 ? (
                        <p className="text-gray-500">
                          No audit logs found for this document.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {auditLogs.map((log) => (
                            <div
                              key={log._id}
                              className={`p-3 rounded-lg border-l-4 ${
                                log.action === "signed"
                                  ? "border-green-500 bg-green-50"
                                  : "border-red-500 bg-red-50"
                              }`}
                            >
                              {/* Action Badge */}
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-white text-xs font-bold mb-2 ${
                                  log.action === "signed"
                                    ? "bg-green-600"
                                    : "bg-red-600"
                                }`}
                              >
                                {log.action.toUpperCase()}
                              </span>

                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Email:</span>{" "}
                                {log.email}
                              </p>

                              {log.ipAddress && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold">
                                    IP Address:
                                  </span>{" "}
                                  {log.ipAddress}
                                </p>
                              )}

                              {log.action === "rejected" && log.reason && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold">Reason:</span>{" "}
                                  {log.reason}
                                </p>
                              )}

                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── PDF Preview + Signature Workflow ── */}
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

            {/* Position Info + Buttons */}
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

            {/* Who Will Sign */}
            {signatureSaved && !signerType && (
              <div className="mt-6 border p-5 rounded-lg bg-white shadow-md max-w-2xl mx-auto">
                <h3 className="font-bold text-xl mb-4">Who Will Sign?</h3>
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

            {/* Self Sign Panel */}
            {signatureSaved && signerType === "self" && (
              <div className="mt-6 border p-5 rounded-lg shadow-md bg-white max-w-2xl mx-auto">
                <h3 className="font-bold text-xl mb-4">Signature Settings</h3>

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

                {signatureMode === "type" && (
                  <>
                    <input
                      type="text"
                      placeholder="Signer Name"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="border p-2 w-full mb-4 rounded"
                    />
                    <p className="font-semibold mb-2">Choose Font</p>
                    <div className="flex flex-col gap-2 mb-4">
                      {FONT_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
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

                {signatureMode === "draw" && (
                  <div className="mb-4">
                    <p className="font-semibold mb-2">
                      Draw your signature below:
                    </p>
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

                <button
                  onClick={handleSaveSignature}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold text-lg"
                >
                  Save Signature
                </button>
              </div>
            )}

            {/* Send to Someone Else Panel */}
            {signatureSaved && signerType === "other" && (
              <div className="mt-6 border p-5 rounded-lg shadow-md bg-white max-w-2xl mx-auto">
                <h3 className="font-bold text-xl mb-4">
                  Send Signature Request
                </h3>
                <input
                  type="email"
                  placeholder="Signer Email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
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
        )}
      </div>
    </div>
  );
}
export default Dashboard;
