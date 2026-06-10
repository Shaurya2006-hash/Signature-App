import { useEffect, useState } from "react";
import SignaturePlaceholder from "../components/SignaturePlaceholder";
import PdfViewer from "../components/PdfViewer";
import { getDocuments } from "../api/documentApi";
import {
  getSignatures,
  saveSignature,
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
  x: number;
  y: number;
  status: string;
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
        setError(
          err.response?.data?.message ||
            "Failed to load data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveSignature = async () => {
    try {
      await saveSignature({
        fileId: selectedDocId,
        signer: "Shaurya",
        x: dragX,
        y: dragY,
        status: "pending",
      });

      alert("Signature position saved!");

      const sigData = await getSignatures();
      setSignatures(sigData);
    } catch (error) {
      console.error(error);
      alert("Failed to save signature");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-lg">
        Loading documents...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">
        My Documents
      </h1>

      {documents.length === 0 ? (
        <p className="text-center text-gray-500">
          No documents uploaded yet.
        </p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="border rounded-xl p-5 shadow-md bg-white"
            >
              <h2 className="font-bold text-lg mb-2">
                {doc.originalName}
              </h2>

              <p className="text-gray-600">
                Size: {(doc.fileSize / 1024).toFixed(2)} KB
              </p>

              <p className="text-gray-600 mb-4">
                File Name: {doc.fileName}
              </p>

              <button
                onClick={() => {
                  setSelectedPdf(
                    `http://localhost:5000/${doc.filePath.replace(
                      /\\/g,
                      "/"
                    )}`
                  );

                  setSelectedDocId(doc._id);

                  const existingSignature =
                    signatures.find(
                      (sig) =>
                        sig.fileId === doc._id
                    );

                  if (existingSignature) {
                    setDragX(
                      existingSignature.x
                    );
                    setDragY(
                      existingSignature.y
                    );
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

      {selectedPdf && (
        <div className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">
              PDF Preview
            </h2>

            <button
              onClick={() => {
                setSelectedPdf("");
                setSelectedDocId("");
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Close Preview
            </button>
          </div>

          <div
            style={{
              position: "relative",
              width: "1000px",
              margin: "0 auto",
            }}
          >
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

          <div className="mt-6 text-center">
            <p className="mb-4 text-lg font-semibold">
              X: {dragX} | Y: {dragY}
            </p>

            <button
              onClick={handleSaveSignature}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Save Signature Position
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;