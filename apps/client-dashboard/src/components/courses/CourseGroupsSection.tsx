import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LucideMessageCircleWarning } from "lucide-react";

import type { Group } from "@api/src";
import { Button } from "@ui/components/ui/button";
import { CheckboxOption } from "@ui/components/ui/checkbox-option";

interface CourseGroupsSectionProps {
  groups: Group[];
  selectedGroupIds: string[];
  isSaving?: boolean;
  onSave: (selectedGroupIds: string[]) => void;
  onCancel: () => void;
}

const CourseGroupsSection = ({
  groups,
  selectedGroupIds,
  isSaving = false,
  onSave,
  onCancel,
}: CourseGroupsSectionProps) => {
  const { t } = useTranslation(["navigation", "courses", "common"]);

  const [draftSelection, setDraftSelection] = useState(selectedGroupIds);

  const handleSave = () => {
    onSave(draftSelection);
  };

  return (
    <section>
      <div className="border-b border-gray-400 pb-2">
        <h1 className="text-3xl">{t(($) => $.navigation.links.groups)}</h1>
      </div>

      <p className="mt-2">
        <LucideMessageCircleWarning className="h-5 w-5 shrink-0 inline-block align-text-bottom mr-1" />
        {t(($) => $.courses.groups.public_description)}
      </p>

      <p className="mt-4">{t(($) => $.courses.groups.assign_heading)}</p>

      <div className="mt-4 space-y-3">
        {groups.map((group) => {
          const isChecked = draftSelection.includes(group.id);

          return (
            <CheckboxOption
              key={group.id}
              id={`course-group-${group.id}`}
              label={group.name}
              checked={isChecked}
              onCheckedChange={(checked) => {
                setDraftSelection((current) =>
                  checked
                    ? [...current, group.id]
                    : current.filter((groupId) => groupId !== group.id),
                );
              }}
            />
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="bg-avk-blue text-white hover:bg-avk-blue/80"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? t(($) => $.common.actions.saving)
            : t(($) => $.common.actions.save)}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="bg-avk-blue-light text-black hover:bg-avk-blue-light/80"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t(($) => $.common.actions.cancel)}
        </Button>
      </div>
    </section>
  );
};

export default CourseGroupsSection;
