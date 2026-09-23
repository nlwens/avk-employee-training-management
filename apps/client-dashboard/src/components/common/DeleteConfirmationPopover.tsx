import { createPortal } from "react-dom";
import { Button } from "@ui/components/ui/button";
import FormErrors from "@ui/components/FormErrors";

interface DeleteConfirmationPopoverProps {
  title: string;
  description: string;
  cancelLabel: string;
  deleteLabel: string;
  onConfirm: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessages?: string[];
  isPending?: boolean;
}

export const DeleteConfirmationPopover = ({
  title,
  description,
  cancelLabel,
  deleteLabel,
  onConfirm,
  open,
  onOpenChange,
  errorMessages,
  isPending = false,
}: DeleteConfirmationPopoverProps) => {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div className="w-96 max-w-full rounded-md border bg-white p-4 shadow-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-lg font-medium">{title}</span>
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isPending}
              onClick={handleConfirm}
            >
              {deleteLabel}
            </Button>
          </div>

          {errorMessages && errorMessages.length > 0 && (
            <FormErrors messages={errorMessages} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
