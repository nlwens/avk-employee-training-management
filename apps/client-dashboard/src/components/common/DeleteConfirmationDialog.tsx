import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { cn } from "@ui/lib/utils";

export const DELETE_TRIGGER_CLASS_NAME =
  "min-w-32 rounded-lg border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700";

interface DeleteConfirmationDialogProps {
  title: string;
  description: string;
  confirmationLabel: string;
  cancelLabel: string;
  deleteLabel: string;
  triggerLabel: string;
  onConfirm: () => void;
  confirmationValue?: string;
  triggerClassName?: string;
  isPending?: boolean;
}

export const DeleteConfirmationDialog = ({
  title,
  description,
  confirmationLabel,
  cancelLabel,
  deleteLabel,
  triggerLabel,
  onConfirm,
  confirmationValue = "delete",
  triggerClassName = DELETE_TRIGGER_CLASS_NAME,
  isPending = false,
}: DeleteConfirmationDialogProps) => {
  const confirmationInputId = useId();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const isConfirmed = inputValue === confirmationValue;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setInputValue("");
    }

    setOpen(nextOpen);
  };

  const handleConfirm = () => {
    if (!isConfirmed) {
      return;
    }

    handleOpenChange(false);
    onConfirm();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn(triggerClassName)}
        disabled={isPending}
        onClick={() => handleOpenChange(true)}
      >
        {triggerLabel}
      </Button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
              <div className="w-96 max-w-full rounded-md border bg-white p-4 shadow-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-lg font-medium">{title}</span>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>

                  <label
                    htmlFor={confirmationInputId}
                    className="block text-sm font-medium"
                  >
                    {confirmationLabel}
                  </label>

                  <Input
                    id={confirmationInputId}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && isConfirmed) {
                        event.preventDefault();
                        handleConfirm();
                      }
                    }}
                    placeholder={confirmationValue}
                    autoComplete="off"
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleOpenChange(false)}
                    >
                      {cancelLabel}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      className="bg-red-600 text-white hover:bg-red-700"
                      disabled={!isConfirmed || isPending}
                      onClick={handleConfirm}
                    >
                      {deleteLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
