import VideoSegment from "./VideoSegment";
import PDFSegment from "./PDFSegment";
import PPTXSegment from "./PPTXSegment";
import { useLocalize } from "i18n";

interface SegmentEntry {
  id: string;
  url: string;
  type: "text" | "video" | "pdf" | "image" | "pptx";
  translations: {
    localeCode: string;
    content: string;
  }[];
  files: {
    localeCode: string;
    mimetype: string;
  }[];
}

const Segments = ({ segments }: { segments: SegmentEntry[] }) => {
  const { localize } = useLocalize();

  return (
    <div className="flex flex-col space-y-5">
      {segments.map((segment) => (
        <div key={segment.id}>
          {segment.type === "text" && (
            <p>{localize(segment.translations, "content")}</p>
          )}

          {segment.type === "video" && (
            <VideoSegment
              url={segment.url}
              mimetype={localize(segment.files, "mimetype")}
            />
          )}

          {segment.type === "pdf" && <PDFSegment url={segment.url} />}
          {segment.type === "pptx" && <PPTXSegment url={segment.url} />}

          {segment.type === "image" && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <img src={segment.url} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Segments;
