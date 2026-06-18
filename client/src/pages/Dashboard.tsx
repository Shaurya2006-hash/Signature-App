import { useEffect, useRef, useState } from "react";
import axios from "axios";
import API, { API_URL } from "../config/api";
import SignatureCanvas from "react-signature-canvas";
import SignaturePlaceholder from "../components/SignaturePlaceholder";
import PdfViewer from "../components/PdfViewer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Document {
  _id: string;
  name: string;
  fileUrl: string;
  createdAt: string;
}

interface SignatureRequest {
  _id: string;
  documentId: string;
  email: string;
  status: "pending" | "signed" | "rejected";
  createdAt: string;
}

interface Signature {
  _id: string;
  documentId: string;
  signatureUrl: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDocuments = async (token: string): Promise<Document[]> => {
  const res = await axios.get(`${API_URL}/api/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const getSignatures = async (): Promise<Signature[]> => {
  const res = await API.get("/api/signatures");
  return res.data;
};

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "signed" | "rejected">("all");

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  const [showSignModal, setShowSignModal] = useState(false);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  // ── Fetch signature requests (extracted so it can be called on demand) ──────
  const fetchRequests = async () => {
    const requestResponse = await API.get("/api/signature-request");
    setSignatureRequests(requestResponse.data);
  };

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please login first");
          setLoading(false);
          return;
        }

        await fetchRequests();                      // ← uses extracted function
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

  // ── Send signature request ───────────────────────────────────────────────────
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
      await fetchRequests(); // ← refresh status immediately after sending
      setRecipientEmail("");
      setSelectedDocId(null);
    } catch (error) {
      console.error(error);
      alert("Failed To Send Request");
    }
  };

  // ── Sign a document ──────────────────────────────────────────────────────────
  const handleSign = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      alert("Please draw your signature");
      return;
    }

    const signatureDataUrl = sigCanvasRef.current.toDataURL("image/png");

    try {
      await API.post("/api/signatures/sign", {
        documentId: signingDocId,
        signatureImage: signatureDataUrl,
      });

      alert("Document signed successfully");
      await fetchRequests(); // ← refresh so badge updates immediately
      setShowSignModal(false);
      setSigningDocId(null);
      sigCanvasRef.current.clear();
    } catch (err) {
      console.error(err);
      alert("Failed to sign document");
    }
  };

  // ── Reject a document ────────────────────────────────────────────────────────
  const handleReject = async (documentId: string) => {
    if (!window.confirm("Are you sure you want to reject this document?")) return;

    try {
      await API.post("/api/signature-request/reject", { documentId });
      alert("Document rejected");
      await fetchRequests(); // ← refresh so badge updates immediately
    } catch (err) {
      console.error(err);
      alert("Failed to reject document");
    }
  };

  // ── Filtered document list ───────────────────────────────────────────────────
  // FIX: cast both sides to String() to handle ObjectId vs plain-string mismatch
  const filteredDocuments = documents.filter((doc) => {
    const request = signatureRequests.find(
      (r) => String(r.documentId) === String(doc._id)
    );

    if (statusFilter === "all") return true;
    if (!request) return statusFilter === "pending";
    return request.status === statusFilter;
  });

  // ── Status badge helper ──────────────────────────────────────────────────────
  const getStatusBadge = (docId: string) => {
    const request = signatureRequests.find(
      (r) => String(r.documentId) === String(docId) // FIX: both sides cast
    );

    const status = request?.status ?? "pending";

    const colours: Record<string, string> = {
      pending:  "bg-yellow-100 text-yellow-800",
      signed:   "bg-green-100  text-green-800",
      rejected: "bg-red-100    text-red-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colours[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "signed", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Document list ────────────────────────────────────────────────────── */}
      {filteredDocuments.length === 0 ? (
        <p className="text-gray-500">No documents found.</p>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => {
            const request = signatureRequests.find(
              (r) => String(r.documentId) === String(doc._id) // FIX
            );

            return (
              <div
                key={doc._id}
                className="border rounded-lg p-4 flex items-center justify-between bg-white shadow-sm"
              >
                {/* Left: name + status */}
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-gray-800">{doc.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(doc._id)}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                  {/* Send request */}
                  {!request && (
                    <button
                      onClick={() => setSelectedDocId(doc._id)}
                      className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Send Request
                    </button>
                  )}

                  {/* Sign / Reject — only show when pending */}
                  {request?.status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          setSigningDocId(doc._id);
                          setShowSignModal(true);
                        }}
                        className="text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        Sign
                      </button>
                      <button
                        onClick={() => handleReject(doc._id)}
                        className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* View PDF */}
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    View
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Send-request modal ───────────────────────────────────────────────── */}
      {selectedDocId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Send Signature Request</h2>
            <input
              type="email"
              placeholder="Recipient email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setSelectedDocId(null); setRecipientEmail(""); }}
                className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign modal ───────────────────────────────────────────────────────── */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Draw Your Signature</h2>
            <div className="border rounded mb-4">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="black"
                canvasProps={{ width: 500, height: 200, className: "rounded" }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => sigCanvasRef.current?.clear()}
                className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={() => { setShowSignModal(false); setSigningDocId(null); }}
                className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Confirm Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;