import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTableColumnHeader } from "@ui/components/ui/data-table-column-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/ui/table";

export interface QuizResultRow {
  userId: string;
  name: string;
  surname: string;
  // Number of questions the user answered correctly.
  score: number;
  // Total number of questions in the course.
  total: number;
  // ISO timestamp of the user's last submitted answer.
  submittedAt: string;
}

function scoreBadgeClass(score: number, total: number): string {
  const ratio = total === 0 ? 0 : score / total;
  if (ratio > 0.6) {
    return "bg-green-100 text-green-700";
  }

  return "bg-red-100 text-red-700";
}

interface QuizResultsTableProps {
  results: QuizResultRow[];
}

const QuizResultsTable = ({ results }: QuizResultsTableProps) => {
  const { t } = useTranslation(["quiz", "common"]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<QuizResultRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: t(($) => $.quiz.summary.name_column),
        enableSorting: false,
        cell: ({ row }) => {
          const { userId, name, surname } = row.original;

          return (
            <Link
              to={`/employees/${userId}`}
              className="font-medium text-sm hover:underline"
            >
              {name} {surname}
            </Link>
          );
        },
      },
      {
        accessorKey: "score",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t(($) => $.quiz.summary.score)}
          />
        ),
        sortingFn: (rowA, rowB) => rowA.original.score - rowB.original.score,
        cell: ({ row }) => {
          const { score, total } = row.original;

          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${scoreBadgeClass(
                score,
                total,
              )}`}
            >
              {score}/{total}
            </span>
          );
        },
      },
      {
        accessorKey: "submittedAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t(($) => $.quiz.summary.submission_date)}
          />
        ),
        sortingFn: (rowA, rowB) =>
          new Date(rowA.original.submittedAt).getTime() -
          new Date(rowB.original.submittedAt).getTime(),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {t(($) => $.common.format.date, {
              date: new Date(row.original.submittedAt),
              formatParams: {
                date: {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              },
            })}
          </span>
        ),
      },
    ],
    [t],
  );

  // eslint-disable-next-line
  const table = useReactTable({
    data: results,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (results.length === 0) {
    return (
      <p className="py-20 text-center text-gray-500">
        {t(($) => $.quiz.summary.no_submissions)}
      </p>
    );
  }

  return (
    <div className="rounded-md border mb-10">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-blue-50/50">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuizResultsTable;
