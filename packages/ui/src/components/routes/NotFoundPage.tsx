import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@ui/components/ui/button";

interface NotFoundPageProps {
  homePath: string;
  homeLabel: string;
}

export function NotFoundPage({ homePath, homeLabel }: NotFoundPageProps) {
  const { t } = useTranslation("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-9xl font-bold text-primary">404</span>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(($) => $.errors.not_found.title)}
        </h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          {t(($) => $.errors.not_found.description)}
        </p>
      </div>
      <Button asChild>
        <Link to={homePath}>{homeLabel}</Link>
      </Button>
    </div>
  );
}
