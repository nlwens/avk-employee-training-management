import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Info, SquarePen } from "lucide-react";
import type { User } from "@api/src";

import { DataTableColumnHeader } from "@ui/components/ui/data-table-column-header";
import { cn } from "@ui/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/ui/table";

interface EmployeesTableProps {
  users: User[];
  onEdit?: (userId: string) => void;
  onViewDetails?: (userId: string) => void;
}

const columnClassNames: Record<string, string> = {
  name: "w-[12%] max-w-0",
  surname: "w-[12%] max-w-0",
  email: "max-w-0",
  groups: "w-[24%] max-w-0",
  createdAt: "w-28 whitespace-nowrap",
  actions: "w-20 whitespace-nowrap px-2",
};

const columnCellClassNames: Record<string, string> = {
  groups: "align-top",
};

const compactTableHeadClassName = "h-9 px-3 py-2";
const compactTableCellClassName = "px-3 py-2";

const TruncatedCell = ({ value }: { value: string }) => (
  <span className="block truncate" title={value}>
    {value}
  </span>
);

const MultiLineTruncatedCell = ({ value }: { value: string }) => (
  <span className="block line-clamp-2 wrap-break-word" title={value}>
    {value}
  </span>
);

const EmployeesTable = ({
  users,
  onEdit,
  onViewDetails,
}: EmployeesTableProps) => {
  const { t } = useTranslation(["employees", "common"]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t(($) => $.employees.table.name)}
          />
        ),
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, undefined, {
            sensitivity: "base",
          }),
        cell: ({ row }) => <TruncatedCell value={row.original.name} />,
      },
      {
        accessorKey: "surname",
        header: t(($) => $.employees.table.surname),
        enableSorting: false,
        cell: ({ row }) => <TruncatedCell value={row.original.surname} />,
      },
      {
        accessorKey: "email",
        header: t(($) => $.common.fields.email),
        cell: ({ row }) => {
          const email = row.original.email ?? "-";

          return <TruncatedCell value={email} />;
        },
        enableSorting: false,
      },
      {
        id: "groups",
        header: t(($) => $.employees.table.groups),
        cell: ({ row }) => {
          const groups = row.original.groups
            .map((group) => group.name)
            .join(", ");

          return <MultiLineTruncatedCell value={groups} />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t(($) => $.employees.table.created_at)}
          />
        ),
        cell: ({ row }) =>
          t(($) => $.common.format.date, {
            date: new Date(row.original.createdAt),
            formatParams: {
              date: {
                year: "numeric",
                month: "short",
                day: "numeric",
              },
            },
          }),
        sortingFn: (rowA, rowB) =>
          new Date(rowA.original.createdAt).getTime() -
          new Date(rowB.original.createdAt).getTime(),
      },
      {
        id: "actions",
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="flex justify-end gap-1">
              <button
                type="button"
                aria-label={t(($) => $.employees.actions.edit, {
                  name: user.name,
                  surname: user.surname,
                })}
                onClick={() => onEdit?.(user.id)}
                className="cursor-pointer rounded p-0.5 hover:bg-gray-100"
              >
                <SquarePen size={16} />
              </button>
              <button
                type="button"
                aria-label={t(($) => $.employees.actions.view_details, {
                  name: user.name,
                  surname: user.surname,
                })}
                onClick={() => onViewDetails?.(user.id)}
                className="cursor-pointer rounded p-0.5 hover:bg-gray-100"
              >
                <Info size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [t, onEdit, onViewDetails],
  );

  // TanStack Table returns unstable function refs by design; safe to use here.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="min-w-0 overflow-x-auto rounded border border-gray-300 bg-white lg:overflow-x-visible [&>div]:lg:overflow-visible mb-10">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "text-brand-gray-900",
                    compactTableHeadClassName,
                    columnClassNames[header.column.id],
                  )}
                >
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
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "text-brand-gray-900",
                      compactTableCellClassName,
                      columnClassNames[cell.column.id],
                      columnCellClassNames[cell.column.id],
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-brand-gray-600"
              >
                {t(($) => $.employees.table.none_found)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeesTable;
