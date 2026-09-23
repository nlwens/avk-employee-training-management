import type { ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/ui/popover";
import { Button } from "@ui/components/ui/button";

interface ConfirmationPopoverProps {
  trigger: ReactNode;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** Extra classes for the confirm button (e.g., brand colors). */
  confirmClassName?: string;
}

/**
 * A small popover that asks the user to confirm an action. Anchors to the
 * provided trigger and shows a message with cancel and confirm buttons.
 */
export const ConfirmationPopover = ({
  trigger,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
  open,
  onOpenChange,
  confirmClassName,
}: ConfirmationPopoverProps) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>

    <PopoverContent className="w-80 space-y-4">
      <p className="text-sm">{message}</p>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className={confirmClassName}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </PopoverContent>
  </Popover>
);
