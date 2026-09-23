import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Group } from "@api/src";
import { describe, expect, it, vi } from "vitest";

import GroupsSidebar from "../src/components/employees/GroupsSidebar";

const mockGroups: Group[] = [
  { id: "group-a", name: "Group A" },
  { id: "group-b", name: "Group B" },
  { id: "group-c", name: "Group C" },
];

const renderGroupsSidebar = (
  props: Partial<{
    groups: Group[];
    selectedGroupId: string | null;
    onSelect: (groupId: string | null) => void;
    onAddGroup: () => void;
    onEditGroup: (groupId: string) => void;
    onDeleteGroup: (groupId: string) => void;
  }> = {},
) => {
  const onSelect = vi.fn();
  const onAddGroup = vi.fn();
  const onEditGroup = vi.fn();
  const onDeleteGroup = vi.fn();

  render(
    <GroupsSidebar
      groups={mockGroups}
      selectedGroupId={null}
      onSelect={onSelect}
      onAddGroup={onAddGroup}
      onEditGroup={onEditGroup}
      onDeleteGroup={onDeleteGroup}
      {...props}
    />,
  );

  return { onSelect, onAddGroup, onEditGroup, onDeleteGroup };
};

describe("GroupsSidebar", () => {
  it("renders All option and all group options", () => {
    renderGroupsSidebar();

    expect(
      screen.getByRole("button", { name: "employees.filters.all" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Group A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Group B" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Group C" })).toBeInTheDocument();
  });

  it("calls onSelect with null when All is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderGroupsSidebar();

    await user.click(
      screen.getByRole("button", { name: "employees.filters.all" }),
    );

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect with the group id when a group is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderGroupsSidebar();

    await user.click(screen.getByRole("button", { name: "Group B" }));

    expect(onSelect).toHaveBeenCalledWith("group-b");
  });

  it("calls onAddGroup when the add group button is clicked", async () => {
    const user = userEvent.setup();
    const { onAddGroup } = renderGroupsSidebar();

    await user.click(
      screen.getByRole("button", { name: "groups.actions.add" }),
    );

    expect(onAddGroup).toHaveBeenCalledTimes(1);
  });

  it("only calls onSelect once per group click", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderGroupsSidebar();

    await user.click(screen.getByRole("button", { name: "Group A" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("opens group actions and calls onEditGroup with the group id", async () => {
    const user = userEvent.setup();
    const { onEditGroup, onSelect } = renderGroupsSidebar();

    await user.click(
      screen.getAllByRole("button", {
        name: "groups.actions.open_actions",
      })[0],
    );
    await user.click(
      screen.getByRole("menuitem", { name: "groups.actions.edit" }),
    );

    expect(onEditGroup).toHaveBeenCalledWith("group-a");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("opens group actions and calls onDeleteGroup with the group id", async () => {
    const user = userEvent.setup();
    const { onDeleteGroup, onSelect } = renderGroupsSidebar();

    await user.click(
      screen.getAllByRole("button", {
        name: "groups.actions.open_actions",
      })[1],
    );
    await user.click(
      screen.getByRole("menuitem", { name: "groups.actions.delete" }),
    );

    expect(onDeleteGroup).toHaveBeenCalledWith("group-b");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
