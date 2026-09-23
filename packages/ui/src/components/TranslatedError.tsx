import { useTranslation } from "react-i18next";
import type { SelectorKey } from "i18next";

export const TranslatedError = ({
  message,
  values,
}: {
  message?: string;
  values?: Record<string, unknown>;
}) => {
  const { t } = useTranslation();

  if (!message) return null;

  return (
    <p className="text-center text-sm text-red-500">
      {t(message as SelectorKey, values)}
    </p>
  );
};
