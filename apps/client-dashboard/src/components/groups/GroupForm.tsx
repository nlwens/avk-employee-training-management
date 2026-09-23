import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@ui/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { TranslatedError } from "@ui/components/TranslatedError";
import type { User } from "@api/src";
import GroupEmployeesTable from "./GroupEmployeesTable";
import {
  getGroupFormDefaultValues,
  groupFormSchema,
  type GroupFormValues,
} from "./groupFormValues";

interface GroupFormProps {
  users: User[];
  defaultValues?: GroupFormValues;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: GroupFormValues) => void;
  isSubmitting?: boolean;
}

const GroupForm = ({
  users,
  defaultValues = getGroupFormDefaultValues(),
  submitLabel,
  onCancel,
  onSubmit,
  isSubmitting = false,
}: GroupFormProps) => {
  const { t } = useTranslation(["groups", "common"]);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues,
  });

  const [selectedUserIds, setSelectedUserIds] = useState(defaultValues.userIds);

  const handleUserSelectionChange = useCallback(
    (userId: string, selected: boolean) => {
      setSelectedUserIds((previousUserIds) => {
        const newUserIds = selected
          ? [...previousUserIds, userId]
          : previousUserIds.filter((id) => id !== userId);

        form.setValue("userIds", newUserIds, { shouldDirty: true });
        return newUserIds;
      });
    },
    [form],
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="mt-8 w-full space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem className="flex flex-col gap-px">
              <FormLabel className="text-base font-medium">
                {t(($) => $.groups.form.name_label)}
              </FormLabel>

              <FormControl>
                <Input {...field} className="max-w-sm border-brand-border" />
              </FormControl>

              {fieldState.error?.message && (
                <TranslatedError message={fieldState.error.message} />
              )}
            </FormItem>
          )}
        />

        <div className="w-full min-w-0 space-y-3">
          <div className="flex justify-end">
            <div className="relative">
              <Search
                size={15}
                className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />

              <Input
                type="search"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                placeholder={t(($) => $.groups.form.search_placeholder)}
                aria-label={t(($) => $.groups.form.search_placeholder)}
                className="w-44 pl-8 text-sm rounded-full border-brand-border"
              />
            </div>
          </div>

          <GroupEmployeesTable
            users={users}
            selectedUserIds={selectedUserIds}
            onSelectionChange={handleUserSelectionChange}
          />
        </div>

        <div className="flex justify-center gap-6 pt-6 pb-12">
          <Button
            type="button"
            variant="outline"
            className="min-w-32 rounded-lg bg-avk-blue-light text-black hover:bg-avk-blue-light/80"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {t(($) => $.common.actions.cancel)}
          </Button>

          <Button
            type="submit"
            variant="secondary"
            className="min-w-32 bg-avk-blue text-white hover:bg-avk-blue/80 rounded-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? t(($) => $.common.actions.saving) : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default GroupForm;
