import { Switch, SwitchThumb } from "@ui/components/ui/switch";
import { cn } from "@ui/lib/utils";

export type ContentLanguage = "en" | "nl";
export type ContentLanguageSwitchSize = "sm" | "md" | "lg";

interface ContentLanguageSwitchProps {
  value: ContentLanguage;
  onValueChange: (value: ContentLanguage) => void;
  size?: ContentLanguageSwitchSize;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

const sizeClasses: Record<
  ContentLanguageSwitchSize,
  {
    root: string;
    option: string;
    thumb: string;
    checkedTranslate: string;
  }
> = {
  sm: {
    root: "h-8 w-[88px] p-1",
    option: "top-1 h-6 w-[38px] text-sm",
    thumb: "h-6 w-[38px] text-sm",
    checkedTranslate: "data-[state=checked]:translate-x-[42px]",
  },
  md: {
    root: "h-10 w-[112px] p-1",
    option: "top-1 h-8 w-[48px] text-lg",
    thumb: "h-8 w-[48px] text-lg",
    checkedTranslate: "data-[state=checked]:translate-x-[54px]",
  },
  lg: {
    root: "h-12 w-[136px] p-1",
    option: "top-1 h-10 w-[60px] text-2xl",
    thumb: "h-10 w-[60px] text-2xl",
    checkedTranslate: "data-[state=checked]:translate-x-[68px]",
  },
};

export const ContentLanguageSwitch = ({
  value,
  onValueChange,
  size = "md",
  className,
  disabled,
  "aria-label": ariaLabel = "Switch content language",
}: ContentLanguageSwitchProps) => {
  const isDutch = value === "nl";
  const classes = sizeClasses[size];

  return (
    <Switch
      type="button"
      checked={isDutch}
      disabled={disabled}
      onCheckedChange={(checked) => onValueChange(checked ? "nl" : "en")}
      aria-label={ariaLabel}
      className={cn(
        "relative rounded-md border border-gray-400 bg-white",
        "data-[state=checked]:bg-white data-[state=unchecked]:bg-white",
        classes.root,
        className,
      )}
    >
      <SwitchThumb
        className={cn(
          "z-0 rounded-md bg-gray-300 shadow-sm transition-transform",
          classes.thumb,
          classes.checkedTranslate,
          "data-[state=unchecked]:translate-x-0",
        )}
      />

      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 z-10 flex items-center justify-center font-normal text-black",
          classes.option,
        )}
      >
        EN
      </span>

      <span
        aria-hidden="true"
        className={cn(
          "absolute right-1 z-10 flex items-center justify-center font-normal text-black",
          classes.option,
        )}
      >
        NL
      </span>
    </Switch>
  );
};
