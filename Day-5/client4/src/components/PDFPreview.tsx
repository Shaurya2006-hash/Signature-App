import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface Props {
  fileUrl: string;
}

function PDFPreview({
  fileUrl,
}: Props) {
  return (
    <div>
      <Document file={fileUrl}>
        <Page pageNumber={1} />
      </Document>
    </div>
  );
}

export default PDFPreview;