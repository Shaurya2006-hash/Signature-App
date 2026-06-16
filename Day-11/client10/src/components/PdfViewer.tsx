import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
}

function PdfViewer({ fileUrl }: Props) {
  const [numPages, setNumPages] = useState<number>();

  return (
    <div className="flex justify-center w-full overflow-auto">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) =>
          setNumPages(numPages)
        }
        loading={<p>Loading PDF...</p>}
      >
        {Array.from(
          new Array(numPages || 0),
          (_, index) => (
            <div
              key={index}
              className="mb-6 flex justify-center"
            >
                  <Page
        pageNumber={index + 1}
        width={1000}
      />
            </div>
          )
        )}
      </Document>
    </div>
  );
}

export default PdfViewer;