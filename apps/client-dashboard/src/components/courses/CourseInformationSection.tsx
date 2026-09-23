import { useTranslation } from "react-i18next";

import { Button } from "@ui/components/ui/button";

interface CourseInformationSectionProps {
  description: string;
  onEdit: () => void;
}

const CourseInformationSection = ({
  description,
  onEdit,
}: CourseInformationSectionProps) => {
  const { t } = useTranslation(["courses", "common"]);

  return (
    <section>
      <div className="mb-4 flex items-center gap-3 border-b border-gray-400 pb-1">
        <span className="font-medium text-lg">
          {t(($) => $.courses.detail.information)}
        </span>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 rounded-md bg-avk-blue-light px-5 text-xs text-black hover:bg-avk-blue-light/80"
          onClick={onEdit}
        >
          {t(($) => $.courses.actions.edit)}
        </Button>
      </div>

      <p className="text-base leading-relaxed text-brand-gray-900">
        {description}
      </p>
    </section>
  );
};

export default CourseInformationSection;
