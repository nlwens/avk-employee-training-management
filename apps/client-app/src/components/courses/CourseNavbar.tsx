import { ChevronLeft } from "lucide-react";
import { Link, useMatch, useParams } from "react-router-dom";
import MobileNavigation from "../navigation/MobileNavigation";

type CourseNavbarProps = {
  backTo?: string;
};

const CourseNavbar = ({ backTo }: CourseNavbarProps) => {
  const { courseId } = useParams() as { courseId: string };
  const isCourseDetails = useMatch({ path: "/courses/:courseId", end: true });
  const backTarget = backTo ?? (isCourseDetails ? "/" : `/courses/${courseId}`);

  return (
    <nav className="sticky top-0 z-50 mb-6 w-full bg-avk-blue text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between pl-4.5 pr-6 sm:px-12">
        <Link
          to={backTarget}
          className="shrink-0 text-white hover:text-white/90"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>

        <MobileNavigation menuIconClassName="cursor-pointer shrink-0 text-white" />
      </div>
    </nav>
  );
};

export default CourseNavbar;
