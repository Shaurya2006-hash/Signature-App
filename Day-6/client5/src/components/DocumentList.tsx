import PdfViewer
from "./PdfViewer";

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
  fileUrl={`http://localhost:5000/${doc.filePath.replace(
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