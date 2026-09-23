import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteConfirmationDialog } from "../src/components/common/DeleteConfirmationDialog";

const renderDeleteConfirmationDialog = (
  props: Partial<ComponentProps<typeof DeleteConfirmationDialog>> = {},
) => {
  const onConfirm = vi.fn();

  render(
    <DeleteConfirmationDialog
      triggerLabel="Delete"
      title="Delete course?"
      description="This action cannot be undone."
      confirmationLabel="Type 'delete' to confirm"
      cancelLabel="Cancel"
      deleteLabel="Delete"
      onConfirm={onConfirm}
      {...props}
    />,
  );

  return { onConfirm };
};

describe("DeleteConfirmationDialog", () => {
  it("does not call onConfirm when cancel is clicked", () => {
    const { onConfirm } = renderDeleteConfirmationDialog();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = screen
      .getByText("Delete course?")
      .closest(".fixed") as HTMLElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when delete is typed and confirmed", () => {
    const { onConfirm } = renderDeleteConfirmationDialog();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.change(screen.getByPlaceholderText("delete"), {
      target: { value: "delete" },
    });

    const dialog = screen
      .getByText("Delete course?")
      .closest(".fixed") as HTMLElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
