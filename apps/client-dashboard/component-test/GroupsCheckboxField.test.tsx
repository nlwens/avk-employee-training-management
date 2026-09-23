import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { Group } from "@api/src";
import { Button } from "@ui/components/ui/button";
import { Form } from "@ui/components/ui/form";
import GroupsCheckboxField from "../src/components/groups/GroupsCheckboxField";

const groups: Group[] = [
  { id: "group-a", name: "Group A" },
  { id: "group-b", name: "Group B" },
];

const openGroupsCombobox = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("combobox"));
};

const closeGroupsCombobox = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.keyboard("{Escape}");
};

const selectGroup = async (
  user: ReturnType<typeof userEvent.setup>,
  groupName: string,
) => {
  await openGroupsCombobox(user);
  await user.click(screen.getByRole("option", { name: groupName }));
  await closeGroupsCombobox(user);
};

const testFormSchema = z.object({
  groups: z.array(z.string()).min(1, "validation:group.required"),
});

type TestFormValues = z.infer<typeof testFormSchema>;

const TestForm = ({
  onSubmit,
  defaultValues = { groups: [] },
}: {
  onSubmit: (values: TestFormValues) => void;
  defaultValues?: TestFormValues;
}) => {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <GroupsCheckboxField
          control={form.control}
          name="groups"
          groups={groups}
        />

        <Button type="submit">submit</Button>
      </form>
    </Form>
  );
};

describe("GroupsCheckboxField", () => {
  it("renders the groups combobox", () => {
    render(<TestForm onSubmit={vi.fn()} />);

    expect(screen.getByText("employees.dashboard.groups")).toBeVisible();
    expect(
      screen.getByPlaceholderText("employees.form.search_groups_placeholder"),
    ).toBeVisible();
  });

  it("shows selected groups from default values", () => {
    render(
      <TestForm onSubmit={vi.fn()} defaultValues={{ groups: ["group-b"] }} />,
    );

    expect(screen.getByText("Group B")).toBeVisible();
    expect(screen.queryByText("Group A")).not.toBeInTheDocument();
  });

  it("submits selected group ids", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TestForm onSubmit={onSubmit} />);

    await selectGroup(user, "Group A");
    await selectGroup(user, "Group B");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        groups: ["group-a", "group-b"],
      },
      expect.anything(),
    );
  });

  it("removes a group id when a selected group is deselected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TestForm
        onSubmit={onSubmit}
        defaultValues={{ groups: ["group-a", "group-b"] }}
      />,
    );

    await selectGroup(user, "Group A");
    await user.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        groups: ["group-b"],
      },
      expect.anything(),
    );
  });

  it("shows the validation error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<TestForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(await screen.findByText("validation:group.required")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
