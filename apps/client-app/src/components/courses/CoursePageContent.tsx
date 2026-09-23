import { cn } from "@ui/lib/utils";
import type { ReactNode } from "react";

interface CoursePageContentProps {
  children: ReactNode;
  className?: string;
}

const CoursePageContent = ({ children, className }: CoursePageContentProps) => (
  <div className={cn("mx-auto w-full max-w-7xl px-6 pb-6 sm:px-12", className)}>
    {children}
  </div>
);

export default CoursePageContent;
