import { z } from "zod";

export const groupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation:group.name_required")
    .max(30, "validation:group.name_too_long"),
  userIds: z.array(z.string()),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;

export const getGroupFormDefaultValues = (
  values?: Partial<GroupFormValues>,
): GroupFormValues => ({
  name: values?.name ?? "",
  userIds: values?.userIds ?? [],
});
