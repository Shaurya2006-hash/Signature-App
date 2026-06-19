import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../config/api";
import SignatureCanvas from "react-signature-canvas";

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

function PublicSignPage() {
  const { token } = useParams();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");
  const [signerName, setSignerName] = useState("");
  const [fontStyle, setFontStyle] = useState("italic");
  const [signatureImage, setSignatureImage] = useState("");
  const sigCanvasRef = useRef<SignatureCanvas>(null);

 useEffect(() => {
  const verifyToken = async () => {
    try {
      console.log("Token:", token);

     const response = await API.get(
  `/api/signature-request/token/${token}`
);

      console.log("Request Data:", response.data);

      setRequest(response.data);
    } catch (error) {
      console.error("Verify Token Error:", error);
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    verifyToken();
  }
}, [token]);
  const handleCaptureSignature = () => {
    if (sigCanvasRef.current?.isEmpty()) {
      alert("Please draw signature first");
      return;
    }
    const image = sigCanvasRef.current!.toDataURL();
    setSignatureImage(image);
    alert("Signature Captured");
  };

  const handleClearCanvas = () => {
    sigCanvasRef.current?.clear();
    setSignatureImage("");
  };

  const handleSign = async () => {
    // ── Client-side validation (this is what was causing silent "Failed to sign" errors) ──
    if (signatureMode === "type" && !signerName.trim()) {
      alert("Please enter your name before signing");
      return;
    }

    let finalSignatureImage = signatureImage;

    if (signatureMode === "draw") {
      // Auto-capture if the user drew but forgot to click "Capture Signature"
      if (!finalSignatureImage && sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        finalSignatureImage = sigCanvasRef.current.toDataURL();
        setSignatureImage(finalSignatureImage);
      }
      if (!finalSignatureImage) {
        alert("Please draw your signature before signing");
        return;
      }
    }

    setSubmitting(true);
    try {
      await API.put(`/api/signature-request/sign/${token}`, {
        signerName,
        fontStyle,
        signatureType: signatureMode,
        signatureImage: signatureMode === "draw" ? finalSignatureImage : "",
      });

      alert("Document Signed Successfully");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message || "Failed to sign document";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert("Please enter a reason for rejecting");
      return;
    }

    setSubmitting(true);
    try {
      await API.put(`/api/signature-request/reject/${token}`, { reason });

      alert("Document Rejected");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message || "Failed to reject document";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!request) return <div className="p-8 text-red-500">Invalid Link</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Sign Document</h1>

        <div className="bg-white shadow-2xl rounded-3xl p-8">
          <p className="mb-3">
            <strong>Email:</strong> {request.email}
          </p>
          <p className="mb-3">
            <strong>Status:</strong> {request.status}
          </p>
          <p className="mb-3">
            <strong>Document ID:</strong> {request.documentId}
          </p>

          {request.reason && (
            <p className="mb-4 text-red-600">
              <strong>Rejection Reason:</strong> {request.reason}
            </p>
          )}

          {request.status === "signed" ? (
            <div className="text-green-600 font-bold text-lg">
              ✅ Document Already Signed
            </div>
          ) : request.status === "rejected" ? (
            <div className="text-red-600 font-bold text-lg">
              ❌ Document Rejected
            </div>
          ) : (
            <>
              {/* ── Signature Type Toggle ── */}
              <div className="mb-6">
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

              {/* ── Type Mode ── */}
              {signatureMode === "type" && (
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="border p-2 w-full mb-4 rounded"
                  />
                  <p className="font-semibold mb-2">Choose Font Style</p>
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
                    className="border p-4 text-2xl rounded bg-gray-50 min-h-[60px]"
                    style={
                      FONT_OPTIONS.find((f) => f.value === fontStyle)?.style || {}
                    }
                  >
                    {signerName || (
                      <span className="text-gray-400 text-base">
                        Your name will appear here...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Draw Mode ── */}
              {signatureMode === "draw" && (
                <div className="mb-6">
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
                      onClick={handleCaptureSignature}
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

              {/* ── Rejection Reason ── */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">
                  Rejection Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="border w-full p-3 rounded"
                  rows={4}
                  placeholder="Enter reason if rejecting..."
                />
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex gap-4">
                <button
                  onClick={handleSign}
                  disabled={submitting}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Accept & Sign"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Reject"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicSignPage;