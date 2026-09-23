import { Button } from "@ui/components/ui/button";
import { Trophy } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { infiniteCoursesQueryOptions } from "api/src";
import CourseNavbar from "../components/courses/CourseNavbar";
import CoursePageContent from "../components/courses/CoursePageContent";

const CourseCompletedPage = () => {
  const { t } = useTranslation("courses");
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.invalidateQueries(
      infiniteCoursesQueryOptions({ finished: true }),
    );
    void queryClient.invalidateQueries(
      infiniteCoursesQueryOptions({ finished: false }),
    );
  }, [queryClient]);

  return (
    <div className="flex items-center justify-center h-screen min-h-0 flex-col">
      <CourseNavbar />
      <CoursePageContent className="flex flex-1 flex-col items-center justify-center p-4 text-center sm:p-6">
        <div className="flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 mb-6 sm:mb-8 rounded-full bg-primary/10 text-primary">
          <Trophy className="w-10 h-10 sm:w-14 sm:h-14" />
        </div>

        <h1 className="mb-3 text-3xl sm:mb-4 sm:text-4xl md:text-5xl">
          {t(($) => $.courses.completion.congratulations)}
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-sm sm:max-w-md md:max-w-lg mb-8 sm:mb-10 px-2">
          {t(($) => $.courses.completion.message)}
        </p>

        <Link to="/" className="w-full sm:w-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 text-base sm:text-lg font-medium rounded-full"
          >
            {t(($) => $.courses.completion.back)}
          </Button>
        </Link>
      </CoursePageContent>
    </div>
  );
};

export default CourseCompletedPage;
