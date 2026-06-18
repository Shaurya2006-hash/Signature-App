import PdfViewer from "./PdfViewer";

const API_URL =
  import.meta.env.VITE_API_URL;

function DocumentList({
  documents,
}: any) {
  return (
    <div>
      {documents.map(
        (doc: any) => (
          <div key={doc._id}>
            <h3>
              {doc.originalName}
            </h3>

            <PdfViewer
              fileUrl={`${API_URL}/${doc.filePath.replace(
                /\\/g,
                "/"
              )}`}
            />
          </div>
        )
      )}
    </div>
  );
}

export default DocumentList;