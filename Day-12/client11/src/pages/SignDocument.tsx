import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

function SignDocument() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<any>(null);
  const [error, setError] = useState("");

  const [signatureType, setSignatureType] =
    useState("type");

  const [signerName, setSignerName] =
    useState("");

  const [signatureImage, setSignatureImage] =
    useState("");

  const [signed, setSigned] =
    useState(false);

  const sigCanvasRef =
    useRef<SignatureCanvas>(null);

  /*
  ----------------------------------
  VERIFY TOKEN
  ----------------------------------
  */

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response =
          await fetch(
            `http://localhost:5000/api/signature-request/${token}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message
          );
        }

        setRequestData(data);
      } catch (error) {
        console.error(error);

        setError(
          "Invalid Or Expired Signature Link"
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  /*
  ----------------------------------
  CAPTURE DRAWN SIGNATURE
  ----------------------------------
  */

  const handleCaptureSignature =
    () => {
      const canvas =
        sigCanvasRef.current;

      if (
        !canvas ||
        canvas.isEmpty()
      ) {
        alert(
          "Please draw your signature first"
        );
        return;
      }

      const image =
        canvas.toDataURL();

      setSignatureImage(image);

      alert(
        "Signature Captured Successfully"
      );
    };

  /*
  ----------------------------------
  CLEAR CANVAS
  ----------------------------------
  */

  const handleClearSignature =
    () => {
      sigCanvasRef.current?.clear();

      setSignatureImage("");
    };

  /*
  ----------------------------------
  SUBMIT SIGNATURE
  ----------------------------------
  */

  const handleSubmitSignature =
    async () => {
      try {

        if (
          signatureType ===
            "type" &&
          !signerName.trim()
        ) {
          alert(
            "Please enter your name"
          );
          return;
        }

        if (
          signatureType ===
            "draw" &&
          !signatureImage
        ) {
          alert(
            "Please capture your signature"
          );
          return;
        }

        const response =
          await fetch(
            `http://localhost:5000/api/signature-request/sign/${token}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                signerName,
                signatureImage,
                signatureType,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message
          );
        }

        setSigned(true);

      } catch (error) {
        console.error(error);

        alert(
          "Failed To Sign Document"
        );
      }
    };

  /*
  ----------------------------------
  LOADING
  ----------------------------------
  */

  if (loading) {
    return (
      <div className="p-10 text-xl">
        Loading...
      </div>
    );
  }

  /*
  ----------------------------------
  ERROR
  ----------------------------------
  */

  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-bold text-red-600">
          {error}
        </h1>
      </div>
    );
  }

  /*
  ----------------------------------
  SUCCESS
  ----------------------------------
  */

  if (signed) {
  return (
    <div className="p-10 text-center">
      <h1 className="text-4xl font-bold text-green-600">
        Document Signed Successfully
      </h1>

      <a
        href={
          requestData?.request
            ?.signedPdfUrl
        }
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded"
      >
        Download Signed PDF
      </a>
    </div>
  );
}

  /*
  ----------------------------------
  PAGE UI
  ----------------------------------
  */

  return (
    <div className="max-w-4xl mx-auto p-10">

      <h1 className="text-4xl font-bold mb-8">
        Sign Document
      </h1>

      <div className="border rounded-lg p-6 shadow bg-white">

        <p className="mb-6">
          Signer Email:
          <span className="font-semibold ml-2">
            {
              requestData?.request
                ?.email
            }
          </span>
        </p>

        {/* Signature Type */}

        <div className="mb-6">

          <label className="block font-semibold mb-2">
            Choose Signature Type
          </label>

          <select
            value={signatureType}
            onChange={(e) =>
              setSignatureType(
                e.target.value
              )
            }
            className="border p-2 rounded w-full"
          >
            <option value="type">
              Type Signature
            </option>

            <option value="draw">
              Draw Signature
            </option>
          </select>

        </div>

        {/* Type Signature */}

        {signatureType ===
          "type" && (

          <div className="mb-6">

            <label className="block font-semibold mb-2">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter Your Name"
              value={signerName}
              onChange={(e) =>
                setSignerName(
                  e.target.value
                )
              }
              className="border p-2 rounded w-full"
            />

            {signerName && (
              <div className="border mt-4 p-4 text-2xl rounded bg-gray-50">
                {signerName}
              </div>
            )}

          </div>

        )}

        {/* Draw Signature */}

        {signatureType ===
          "draw" && (

          <div className="mb-6">

            <p className="font-semibold mb-2">
              Draw Your Signature
            </p>

            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              canvasProps={{
                width: 600,
                height: 200,
                className:
                  "border rounded bg-white",
              }}
            />

            <div className="flex gap-3 mt-4">

              <button
                onClick={
                  handleCaptureSignature
                }
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Capture Signature
              </button>

              <button
                onClick={
                  handleClearSignature
                }
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Clear
              </button>

            </div>

            {signatureImage && (

              <div className="mt-4">

                <p className="font-semibold mb-2">
                  Signature Preview
                </p>

                <img
                  src={signatureImage}
                  alt="Signature"
                  className="border rounded max-h-28"
                />
    
              </div>

            )}

          </div>

        )}

        {/* Submit */}

        <button
          onClick={
            handleSubmitSignature
          }
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Sign Document
        </button>
          
      </div>

    </div>
  );
}

export default SignDocument;