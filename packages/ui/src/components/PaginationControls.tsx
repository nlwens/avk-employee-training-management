import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@ui/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@ui/components/ui/pagination";

// This function is used to get the page numbers for the pagination controls.
// We also show an ellipsis (three dots) if the page numbers are too many to fit on one line.
function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
  className?: string;
  "aria-label"?: string;
  pageAriaLabel?: (page: number) => string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isFetching = false,
  className,
  "aria-label": ariaLabel,
  pageAriaLabel,
}) => {
  const { t } = useTranslation("common");

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <Pagination
      className={cn(isFetching && "pointer-events-none opacity-50", className)}
      aria-label={
        ariaLabel ??
        t(($) => $.common.pagination.page_of, {
          page: currentPage,
          pages: totalPages,
        })
      }
    >
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            className={cn(
              "cursor-pointer select-none",
              currentPage <= 1 && "pointer-events-none opacity-50",
            )}
          />
        </PaginationItem>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => onPageChange(page)}
                className="cursor-pointer select-none"
                aria-label={
                  pageAriaLabel?.(page) ??
                  t(($) => $.common.pagination.page, { page })
                }
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            aria-disabled={currentPage >= totalPages}
            className={cn(
              "cursor-pointer select-none",
              currentPage >= totalPages && "pointer-events-none opacity-50",
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationControls;
