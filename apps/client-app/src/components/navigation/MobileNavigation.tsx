import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@ui/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@ui/components/ui/button";
import LanguageSwitcher from "@ui/components/LanguageSwitcher";
import UserIdentity from "@ui/components/UserIdentity";
import { useTranslation } from "react-i18next";
import { useAuth } from "@auth-context/src";
import { cn } from "@ui/lib/utils";
import { persister } from "../../lib/idb-persister";
import { Link } from "react-router-dom";

interface MobileNavigationProps {
  menuIconClassName?: string;
}

const MobileNavigation = ({
  menuIconClassName = "cursor-pointer text-white",
}: MobileNavigationProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation("navigation");
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const closeSheet = () => setOpen(false);

  const onLogoutClick = async () => {
    // Clear all data in cache (in memory).
    queryClient.clear();
    // Dump the persisted data stored in IndexedDB (device's storage).
    await persister.removeClient();
    logout();
    closeSheet();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Menu
          size={32}
          role="button"
          aria-label={t(($) => $.navigation.menu.open)}
          className={cn(menuIconClassName)}
        />
      </SheetTrigger>
      <SheetContent
        side="top"
        className="h-auto border-b bg-brand-gray-50 px-6 py-8"
      >
        <SheetTitle className="sr-only">
          {t(($) => $.navigation.menu.title)}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {t(($) => $.navigation.menu.description)}
        </SheetDescription>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
          <LanguageSwitcher onLanguageChange={closeSheet} />

          <div className="-mb-2 sm:mb-0">
            <UserIdentity />
          </div>

          <Link to="/settings" className="h-auto px-0" onClick={closeSheet}>
            {t(($) => $.navigation.links.settings)}
          </Link>

          <Button size="default" onClick={onLogoutClick}>
            {t(($) => $.navigation.links.logout)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
