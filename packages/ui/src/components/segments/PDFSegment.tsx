interface PDFSegmentProps {
  url: string;
}

const PDFSegment = ({ url }: PDFSegmentProps) => {
  return (
    <div className="w-full h-[50vh] md:h-screen overflow-hidden">
      <embed
        src={url}
        type="application/pdf"
        className="border-none w-full h-full"
      />
    </div>
  );
};

export default PDFSegment;
