import { useState } from "react";
import { useContentLanguage } from "i18n";
import { useTranslation } from "react-i18next";
import { useForm, type FieldErrors } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/ui/select";
import { ContentLanguageSwitch } from "@ui/components/ContentLanguageSwitch";
import { Textarea } from "@ui/components/ui/textarea";
import { TranslatedError } from "@ui/components/TranslatedError";
import type { LocaleCode } from "@api/src";
import {
  COURSE_PRIORITY,
  courseFormSchema,
  getCourseFormDefaultValues,
  type CourseFormValues,
} from "./courseFormValues";

interface CourseFormProps {
  defaultValues?: CourseFormValues;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: CourseFormValues) => void;
  isSubmitting?: boolean;
}

const CourseForm = ({
  defaultValues = getCourseFormDefaultValues(),
  submitLabel,
  onCancel,
  onSubmit,
  isSubmitting = false,
}: CourseFormProps) => {
  const { t } = useTranslation(["courses", "common"]);
  const defaultContentLocale = useContentLanguage();
  const [contentLocale, setContentLocale] =
    useState<LocaleCode>(defaultContentLocale);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  const titleFieldName = `translations.${contentLocale}.title` as const;
  const descriptionFieldName =
    `translations.${contentLocale}.description` as const;

  const handleSubmit = (values: CourseFormValues) => {
    onSubmit(values);
  };

  const handleInvalid = (errors: FieldErrors<CourseFormValues>) => {
    const erroredLocales = Object.keys(
      errors.translations ?? {},
    ) as LocaleCode[];

    if (erroredLocales.length > 0) {
      setContentLocale(erroredLocales[0]);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
        className="mx-auto mt-10 w-full max-w-2xl space-y-4"
      >
        <FormField
          control={form.control}
          name={titleFieldName}
          render={({ field, fieldState }) => (
            <FormItem className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <FormLabel className="text-base font-normal">
                  {t(($) => $.courses.form.title)}
                </FormLabel>

                <ContentLanguageSwitch
                  value={contentLocale}
                  onValueChange={setContentLocale}
                  size="sm"
                  className="shrink-0"
                  aria-label={t(($) => $.courses.form.toggle_language)}
                />
              </div>

              <FormControl>
                <Input {...field} className="border-brand-border" />
              </FormControl>

              {fieldState.error?.message && (
                <TranslatedError message={fieldState.error.message} />
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={descriptionFieldName}
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-base font-normal">
                {t(($) => $.courses.form.description)}
              </FormLabel>

              <FormControl>
                <Textarea {...field} className="min-h-28 border-brand-border" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-base font-normal">
                {t(($) => $.courses.form.priority)}
              </FormLabel>

              <Select
                value={String(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <FormControl>
                  <SelectTrigger className="border-brand-border py-3 text-base leading-tight">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  <SelectItem value={String(COURSE_PRIORITY.low)}>
                    {t(($) => $.courses.form.priority_options.low)}
                  </SelectItem>

                  <SelectItem value={String(COURSE_PRIORITY.medium)}>
                    {t(($) => $.courses.form.priority_options.medium)}
                  </SelectItem>

                  <SelectItem value={String(COURSE_PRIORITY.high)}>
                    {t(($) => $.courses.form.priority_options.high)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="flex justify-center gap-6 pt-3 pb-12">
          <Button
            type="button"
            variant="outline"
            className="min-w-32 rounded-lg bg-avk-blue-light text-black hover:bg-avk-blue-light/80"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {t(($) => $.courses.actions.cancel)}
          </Button>

          <Button
            type="submit"
            variant="secondary"
            className="min-w-32 rounded-lg bg-avk-blue text-white hover:bg-avk-blue/80"
            disabled={isSubmitting}
          >
            {isSubmitting ? t(($) => $.common.actions.saving) : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CourseForm;
