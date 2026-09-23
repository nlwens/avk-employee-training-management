import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@ui/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/ui/select";
import { LOCALE_CODES, type LocaleCode } from "@api/src";

import { Label } from "@ui/components/ui/label";
import { TranslatedError } from "@ui/components/TranslatedError";
import type { Group } from "@api/src";
import GroupsCheckboxField from "../groups/GroupsCheckboxField";
import {
  editEmployeeAccountFormSchema,
  createEmployeeAccountFormSchema,
  getEditEmployeeAccountFormDefaultValues,
  getCreateEmployeeAccountFormDefaultValues,
  type EmployeeAccountFormValues,
} from "./employeeAccountFormValues";

const LOCALE_LABELS: Record<LocaleCode, string> = {
  nl: "Nederlands",
  en: "English",
};

interface EmployeeAccountFormProps {
  groups: Group[];
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: EmployeeAccountFormValues) => void;
  defaultValues?: Partial<EmployeeAccountFormValues>;
  submitLabel?: string;
  showPasswordField?: boolean;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

const EmployeeAccountForm = ({
  groups,
  isSubmitting = false,
  onCancel,
  onSubmit,
  defaultValues,
  showDeleteButton = false,
  onDelete,
}: EmployeeAccountFormProps) => {
  const { t } = useTranslation(["employees", "common"]);

  const isEditMode = !!defaultValues;

  const form = useForm<EmployeeAccountFormValues>({
    resolver: zodResolver(
      defaultValues
        ? editEmployeeAccountFormSchema
        : createEmployeeAccountFormSchema,
    ),
    defaultValues: isEditMode
      ? getEditEmployeeAccountFormDefaultValues(defaultValues)
      : getCreateEmployeeAccountFormDefaultValues(defaultValues),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-8 grid w-full gap-x-12 gap-y-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div className="min-w-0 w-full space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col gap-px">
                <FormLabel className="text-base font-medium">
                  {t(($) => $.employees.table.name)}
                </FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    placeholder={t(($) => $.employees.form.name_placeholder)}
                  />
                </FormControl>

                {fieldState.error?.message && (
                  <TranslatedError message={fieldState.error.message} />
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="surname"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col gap-px">
                <FormLabel className="text-base font-medium">
                  {t(($) => $.employees.table.surname)}
                </FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    placeholder={t(($) => $.employees.form.surname_placeholder)}
                  />
                </FormControl>

                {fieldState.error?.message && (
                  <TranslatedError message={fieldState.error.message} />
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col gap-px">
                <FormLabel className="text-base font-medium">
                  {t(($) => $.common.fields.email)}
                </FormLabel>

                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder={t(($) => $.employees.form.email_placeholder)}
                  />
                </FormControl>

                {fieldState.error?.message && (
                  <TranslatedError message={fieldState.error.message} />
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="min-w-0 w-full space-y-8 pt-0.5">
          {!defaultValues && (
            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-px">
                  <FormLabel className="text-base font-medium">
                    {t(($) => $.employees.form.locale_label)}
                  </FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {LOCALE_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {LOCALE_LABELS[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          )}

          {isEditMode && (
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem className="flex flex-col gap-px">
                  <FormLabel className="text-base font-medium">
                    {t(($) => $.employees.form.password_label)}
                  </FormLabel>

                  <FormDescription>
                    {t(($) => $.employees.form.password_description)}
                  </FormDescription>

                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder={t(
                        ($) => $.employees.form.password_placeholder,
                      )}
                      autoComplete="new-password"
                    />
                  </FormControl>

                  {fieldState.error?.message && (
                    <TranslatedError message={fieldState.error.message} />
                  )}
                </FormItem>
              )}
            />
          )}

          <GroupsCheckboxField
            control={form.control}
            name="groups"
            groups={groups}
          />

          <FormField
            control={form.control}
            name="admin"
            render={({ field }) => (
              <FormItem>
                <Label className="flex cursor-pointer items-center gap-3 text-base font-normal">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="h-4 w-4 rounded border-gray-500 text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  />
                  <span>{t(($) => $.employees.form.is_administrator)}</span>
                </Label>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center gap-10 pt-12 md:col-span-2 pb-10">
          <Button
            type="button"
            variant="outline"
            className="min-w-32 rounded-lg bg-avk-blue-light text-black hover:bg-avk-blue-light/80"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t(($) => $.common.actions.cancel)}
          </Button>

          <Button
            type="submit"
            variant="secondary"
            className="min-w-32 bg-avk-blue text-white hover:bg-avk-blue/80 rounded-lg"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t(($) => $.common.actions.saving)
              : t(($) => $.common.actions.save)}
          </Button>
        </div>

        {showDeleteButton && (
          <div className="flex justify-center md:col-span-2">
            <Button
              type="button"
              variant="outline"
              className="min-w-36 border-gray-400 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
              onClick={onDelete}
            >
              {t(($) => $.employees.form.actions.delete_user)}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default EmployeeAccountForm;
