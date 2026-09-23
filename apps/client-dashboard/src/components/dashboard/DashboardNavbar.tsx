import LanguageSwitcher from "@ui/components/LanguageSwitcher";
import UserSettings from "@ui/components/UserSettings";
import logo from "../../assets/avk-blue-logo.png";

const DashboardNavbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white">
      <div className="mx-auto flex flex-col sm:flex-row max-w-7xl sm:items-center justify-between gap-5 p-4 px-6 sm:px-12">
        <span className="flex gap-2 sm:gap-4">
          <img
            src={logo}
            alt="AVK logo"
            className="h-10 w-auto shrink-0 sm:h-12 md:h-15"
          />
          <span className="md:text-[32px] text-[22px] leading-none font-light text-[#003394]">
            Nederland BV
          </span>
        </span>
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <LanguageSwitcher />
          <UserSettings />
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
