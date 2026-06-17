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

  const [reason, setReason] =
    useState("");

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

  const handleReject =
    async () => {
      try {
        await axios.put(
          `http://localhost:5000/api/signature-request/reject/${token}`,
          {
            reason,
          }
        );

        alert(
          "Document Rejected"
        );

        window.location.reload();
      } catch (error) {
        console.error(error);

        alert(
          "Failed to reject document"
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
          <strong>Email:</strong>{" "}
          {request.email}
        </p>

        <p className="mb-3">
          <strong>Status:</strong>{" "}
          {request.status}
        </p>

        <p className="mb-3">
          <strong>Document ID:</strong>{" "}
          {request.documentId}
        </p>

        {request.reason && (
          <p className="mb-4 text-red-600">
            <strong>
              Rejection Reason:
            </strong>{" "}
            {request.reason}
          </p>
        )}

        {request.status ===
        "signed" ? (
          <div className="text-green-600 font-bold text-lg">
            ✅ Document Already Signed
          </div>
        ) : request.status ===
          "rejected" ? (
          <div className="text-red-600 font-bold text-lg">
            ❌ Document Rejected
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">
                Rejection Reason
              </label>

              <textarea
                value={reason}
                onChange={(e) =>
                  setReason(
                    e.target.value
                  )
                }
                className="border w-full p-3 rounded"
                rows={4}
                placeholder="Enter reason if rejecting..."
              />
            </div>

            <div className="flex gap-4">

              <button
                onClick={
                  handleSign
                }
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Accept & Sign
              </button>

              <button
                onClick={
                  handleReject
                }
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Reject
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PublicSignPage;