import { useTranslation } from "i18n";
import { FileDown, Presentation } from "lucide-react";
import { Button } from "@ui/components/ui/button";

const PPTXSegment = ({ url }: { url: string }) => {
  const { t } = useTranslation(["courses", "chapters"]);

  return (
    <Button
      asChild
      variant="secondary"
      className="w-full justify-start gap-2 py-6 mt-5"
    >
      <a href={url} target="_blank" download rel="noopener noreferrer">
        <Presentation className="h-4 w-4 shrink-0" />
        {t(($) => $.chapters.content_types.download_materials)}
        <FileDown className="h-4 w-4 shrink-0 opacity-60" />
      </a>
    </Button>
  );
};

export default PPTXSegment;
