import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import axios from "axios";

function PublicSignPage() {
  const { token } =
    useParams();

  const [request, setRequest] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const verifyToken =
      async () => {
        try {
          const response =
            await axios.get(
              `http://localhost:5000/api/signature-request/${token}`
            );

          setRequest(
            response.data.request
          );
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

    verifyToken();
  }, [token]);

  const handleSign =
    async () => {
      try {
        await axios.put(
          `http://localhost:5000/api/signature-request/sign/${token}`
        );

        alert(
          "Document Signed Successfully"
        );

        window.location.reload();
      } catch (error) {
        console.error(error);

        alert(
          "Failed to sign document"
        );
      }
    };

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-red-500">
        Invalid Link
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">
        Sign Document
      </h1>

      <div className="border rounded-lg p-6 shadow">
        <p className="mb-3">
          <strong>
            Email:
          </strong>{" "}
          {request.email}
        </p>

        <p className="mb-3">
          <strong>
            Status:
          </strong>{" "}
          {request.status}
        </p>

        <p className="mb-6">
          <strong>
            Document ID:
          </strong>{" "}
          {request.documentId}
        </p>

        {request.status ===
        "signed" ? (
          <div className="text-green-600 font-bold text-lg">
            Document Already Signed
          </div>
        ) : (
          <button
            onClick={
              handleSign
            }
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Sign Document
          </button>
        )}
      </div>
    </div>
  );
}

export default PublicSignPage;