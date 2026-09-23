import { buildFileUrl } from "@api/src/file-builder";
import { type Segment } from "@api/src/types/segments";
import Segments from "@ui/components/segments/Segments";
import { useLocalize } from "i18n";

interface Step {
  label: string;
}

interface StepContentProps {
  steps: Step[];
  step: number;
  segments: Segment[];
}

const StepContent = ({ steps, step, segments }: StepContentProps) => {
  const currentStep = steps[step];
  const { localize } = useLocalize();

  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col justify-center overflow-y-auto md:items-center items-start space-y-6">
      <h2 className="text-lg font-bold">{currentStep.label}</h2>

      <div className="reading-text whitespace-pre-line text-brand-gray-900 pb-13">
        <Segments
          segments={segments.map((segment) => ({
            ...segment,
            url: buildFileUrl({
              filename: localize(segment.files, "name"),
              provider: localize(segment.files, "provider"),
            }),
          }))}
        />
      </div>
    </div>
  );
};

export default StepContent;
