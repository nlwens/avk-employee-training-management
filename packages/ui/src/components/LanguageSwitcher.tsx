import { ToggleGroup, ToggleGroupItem } from "@ui/components/ui/toggle-group";
import { useTranslation } from "react-i18next";
import ukFlag from "../../assets/uk_flag.png";
import nlFlag from "../../assets/nl_flag.png";

interface LanguageSwitcherProps {
  onLanguageChange?: () => void;
}

const LanguageSwitcher = ({ onLanguageChange }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = async (value: string) => {
    if (value !== i18n.language) {
      await i18n.changeLanguage(value);
      onLanguageChange?.();
    }
  };

  return (
    <ToggleGroup
      variant="outline"
      type="single"
      value={i18n.language}
      onValueChange={handleLanguageChange}
    >
      <ToggleGroupItem
        value="en"
        aria-label="Toggle English"
        className="gap-2 px-3"
      >
        <span className="text-sm font-medium leading-none">EN</span>
        <img
          src={ukFlag}
          alt="UK flag"
          className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
        />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="nl"
        aria-label="Toggle Dutch"
        className="gap-2 px-3"
      >
        <span className="text-sm font-medium leading-none">NL</span>
        <img
          src={nlFlag}
          alt="NL flag"
          className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
        />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default LanguageSwitcher;
