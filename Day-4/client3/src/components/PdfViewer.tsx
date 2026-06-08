import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  fileUrl: string;
}

function PdfViewer({ fileUrl }: Props) {
  const [numPages, setNumPages] =
    useState<number>();

  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages }) =>
        setNumPages(numPages)
      }
    >
      {Array.from(
        new Array(numPages || 0),
        (_, index) => (
          <Page
            key={index}
            pageNumber={index + 1}
          />
        )
      )}
    </Document>
  );
}

export default PdfViewer;