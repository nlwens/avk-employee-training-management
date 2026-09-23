import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "i18n";
import { Input } from "../components/ui/input";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

interface PasswordInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  placeholder: string;
  isLoading?: boolean;
  autoComplete: string;
}

const PasswordInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  isLoading,
  field,
  placeholder,
  autoComplete,
}: PasswordInputProps<TFieldValues, TName>) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation(["auth"]);

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        {...field}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        disabled={isLoading}
      />
      <button
        type="button"
        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setShowPassword((current) => !current)}
        disabled={isLoading}
        aria-label={
          showPassword
            ? t(($) => $.auth.form.hide_password)
            : t(($) => $.auth.form.show_password)
        }
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
