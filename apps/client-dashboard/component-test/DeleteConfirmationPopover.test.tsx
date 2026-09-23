import type { ComponentProps } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteConfirmationPopover } from "../src/components/common/DeleteConfirmationPopover";

const renderDeleteConfirmationPopover = (
  props: Partial<ComponentProps<typeof DeleteConfirmationPopover>> = {},
) => {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();

  render(
    <DeleteConfirmationPopover
      open
      onOpenChange={onOpenChange}
      title="Delete user"
      description='Are you sure you want to delete user "John Doe"?'
      cancelLabel="Cancel"
      deleteLabel="Delete user"
      onConfirm={onConfirm}
      {...props}
    />,
  );

  return { onConfirm, onOpenChange };
};

describe("DeleteConfirmationPopover", () => {
  it("does not render when closed", () => {
    renderDeleteConfirmationPopover({ open: false });

    expect(
      screen.queryByText('Are you sure you want to delete user "John Doe"?'),
    ).not.toBeInTheDocument();
  });

  it("does not call onConfirm when cancel is clicked", () => {
    const { onConfirm, onOpenChange } = renderDeleteConfirmationPopover();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onConfirm and closes when delete is clicked without typing confirmation", () => {
    const { onConfirm, onOpenChange } = renderDeleteConfirmationPopover();

    const dialog = screen
      .getByText('Are you sure you want to delete user "John Doe"?')
      .closest(".fixed") as HTMLElement;

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete user" }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByPlaceholderText("delete")).not.toBeInTheDocument();
  });

  it("disables action buttons while pending", () => {
    renderDeleteConfirmationPopover({ isPending: true });

    const dialog = screen
      .getByText('Are you sure you want to delete user "John Doe"?')
      .closest(".fixed") as HTMLElement;

    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Delete user" }),
    ).toBeDisabled();
  });
});
