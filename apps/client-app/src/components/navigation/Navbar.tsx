import MobileNavigation from "./MobileNavigation";
import logo from "../../assets/white_logo.png";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-avk-blue text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 p-4 px-6 sm:px-12">
        <span className="flex space-x-2">
          <img src={logo} alt="AVK logo" className="h-8" />
          <span className="text-sm leading-none font-normal">NEDERLAND BV</span>
        </span>
        <MobileNavigation />
      </div>
    </nav>
  );
};

export default Navbar;
