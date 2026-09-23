import { z } from "zod";
import { LOCALE_CODES } from "@api/src";

const employeeAccountBaseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation:name.required")
    .min(2, "validation:name.min_length")
    .max(50, "validation:name.max_length"),
  surname: z
    .string()
    .trim()
    .min(1, "validation:surname.required")
    .min(2, "validation:surname.min_length")
    .max(50, "validation:surname.max_length"),
  email: z
    .string()
    .trim()
    .min(1, "validation:email.required")
    .pipe(z.email("validation:email.invalid")),
  admin: z.boolean().optional(),
  groups: z.array(z.string()).optional(),
});

const optionalPasswordSchema = z
  .union([z.literal(""), z.string().min(8, "validation:password.min_length")])
  .optional();

export const createEmployeeAccountFormSchema =
  employeeAccountBaseFormSchema.extend({
    locale: z.enum(LOCALE_CODES).default("nl").optional(),
  });

export const editEmployeeAccountFormSchema =
  employeeAccountBaseFormSchema.extend({
    password: optionalPasswordSchema,
  });

export const employeeAccountFormSchema = employeeAccountBaseFormSchema.extend({
  password: z
    .string()
    .min(1, "validation:password.required")
    .min(8, "validation:password.min_length"),
  locale: z.enum(LOCALE_CODES).default("nl").optional(),
});

export type CreateEmployeeAccountFormValues = z.infer<
  typeof createEmployeeAccountFormSchema
>;
export type EditEmployeeAccountFormValues = z.infer<
  typeof editEmployeeAccountFormSchema
>;

export type EmployeeAccountFormValues = z.infer<
  typeof employeeAccountFormSchema | typeof editEmployeeAccountFormSchema
>;

const getBaseEmployeeAccountFormDefaultValues = (
  values?: Partial<
    CreateEmployeeAccountFormValues | EditEmployeeAccountFormValues
  >,
) => ({
  name: values?.name ?? "",
  surname: values?.surname ?? "",
  email: values?.email ?? "",
  admin: values?.admin ?? false,
  groups: values?.groups ?? [],
});

export const getCreateEmployeeAccountFormDefaultValues = (
  values?: Partial<CreateEmployeeAccountFormValues>,
): CreateEmployeeAccountFormValues => ({
  ...getBaseEmployeeAccountFormDefaultValues(values),
  locale: values?.locale ?? "nl",
});

export const getEditEmployeeAccountFormDefaultValues = (
  values?: Partial<EditEmployeeAccountFormValues>,
): EditEmployeeAccountFormValues => ({
  ...getBaseEmployeeAccountFormDefaultValues(values),
  password: values?.password ?? "",
});
