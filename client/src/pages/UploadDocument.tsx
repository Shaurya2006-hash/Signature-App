import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../config/api";

function UploadDocument() {
  const navigate = useNavigate();

  const [pdf, setPdf] = useState<File | null>(null);
  const [signType, setSignType] = useState("self");
  const [signatureMethod, setSignatureMethod] = useState("type");
  const [signerEmail, setSignerEmail] = useState("");

  const upload = async () => {
    if (!pdf) {
      alert("Please select a PDF");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", pdf);
      const token = localStorage.getItem("token");

      const uploadResponse = await API.post("/api/documents/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const uploadedDocument = uploadResponse.data;

      // Someone Else Will Sign
      if (signType === "request") {
        if (!signerEmail) {
          alert("Please enter signer email");
          return;
        }

        await API.post("/api/signature-request/create", {
          documentId: uploadedDocument._id,
          email: signerEmail,
        });

        alert("Document Uploaded & Signature Request Sent");
        navigate("/");
      }

      // I Will Sign
      else {
        localStorage.setItem("signatureMethod", signatureMethod);
        localStorage.setItem("documentId", uploadedDocument._id);

        alert("Document Uploaded Successfully");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert("Upload Failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-10">
      <h1 className="text-4xl font-bold mb-8">Upload Document</h1>

      <div className="border rounded-lg p-6 shadow bg-white">
        <label className="block mb-3 font-semibold">Choose PDF File</label>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPdf(e.target.files?.[0] || null)}
          className="mb-6"
        />

        {/* Who Will Sign */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Who Will Sign?</label>
          <select
            value={signType}
            onChange={(e) => setSignType(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="self">I Will Sign</option>
            <option value="request">Someone Else Will Sign</option>
          </select>
        </div>

        {/* Self Sign */}
        {signType === "self" && (
          <div className="mb-6">
            <label className="block mb-2 font-semibold">
              How Would You Like To Sign?
            </label>
            <select
              value={signatureMethod}
              onChange={(e) => setSignatureMethod(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="type">Type Signature</option>
              <option value="draw">Draw Signature</option>
              <option value="upload">Upload Signature Image</option>
            </select>
          </div>
        )}

        {/* Request Signature */}
        {signType === "request" && (
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Signer Email</label>
            <input
              type="email"
              placeholder="Enter signer email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        )}

        <button
          onClick={upload}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Upload Document
        </button>
      </div>
    </div>
  );
}

export default UploadDocument;
