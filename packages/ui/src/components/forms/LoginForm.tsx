import { type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "i18n";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { cn } from "@ui/lib/utils";
import { LoginSchema, type LoginFormValues } from "./validators";
import { TranslatedError } from "../TranslatedError";
import PasswordInput from "../PasswordInput";

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  error?: string;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  loadingLabel?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  footer?: ReactNode;
  className?: string;
}

export const LoginForm = ({
  onSubmit,
  error,
  isLoading = false,
  title,
  subtitle,
  submitLabel,
  loadingLabel,
  emailLabel,
  emailPlaceholder,
  passwordLabel,
  passwordPlaceholder,
  footer,
  className,
}: LoginFormProps) => {
  const { t } = useTranslation("auth");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className={cn("w-full max-w-lg space-y-5", className)}>
      <div className="space-y-2 text-center">
        <h3 className="text-[24px] font-bold">
          {title ?? t(($) => $.auth.form.title)}
        </h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {emailLabel ?? t(($) => $.auth.form.email_label)}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      emailPlaceholder ??
                      t(($) => $.auth.form.email_placeholder)
                    }
                    {...field}
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </FormControl>
                {fieldState?.error?.message && (
                  <TranslatedError message={fieldState.error?.message} />
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {passwordLabel ?? t(($) => $.auth.form.password_label)}
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    isLoading={isLoading}
                    field={field}
                    placeholder={
                      passwordPlaceholder ??
                      t(($) => $.auth.form.password_placeholder)
                    }
                    autoComplete="current-password"
                  />
                </FormControl>
                {fieldState?.error?.message && (
                  <TranslatedError message={fieldState.error?.message} />
                )}
              </FormItem>
            )}
          />

          <Button
            className="w-full cursor-pointer bg-avk-blue text-white disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? (loadingLabel ?? t(($) => $.auth.actions.submitting))
              : (submitLabel ?? t(($) => $.auth.actions.submit))}
          </Button>

          <TranslatedError message={error} />

          {footer && (
            <div className="text-center text-sm text-gray-500">{footer}</div>
          )}
        </form>
      </Form>
    </div>
  );
};
