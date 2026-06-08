import { useEffect, useState } from "react";
import PdfViewer from "../components/PdfViewer";
import { getDocuments } from "../api/documentApi";

interface DocumentType {
  _id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  createdAt?: string;
}

function Dashboard() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPdf, setSelectedPdf] = useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login first");
          setLoading(false);
          return;
        }

        const data = await getDocuments(token);

        setDocuments(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Failed to load documents"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return <div className="p-6">Loading documents...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        My Documents
      </h1>

      {documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="border rounded-lg p-4 shadow"
            >
              <h2 className="font-semibold">
                {doc.originalName}
              </h2>

              <p>
                Size: {(doc.fileSize / 1024).toFixed(2)} KB
              </p>

              <p>
                File Name: {doc.fileName}
              </p>

              <button
                onClick={() =>
                  setSelectedPdf(
                    `http://localhost:5000/${doc.filePath.replace(
                      /\\/g,
                      "/"
                    )}`
                  )
                }
              >
                Preview PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedPdf && (
        <div style={{ marginTop: "20px" }}>
          <h2>PDF Preview</h2>

        <PdfViewer fileUrl={selectedPdf} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;