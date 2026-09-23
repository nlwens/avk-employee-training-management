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

interface GroupEmployeesTableProps {
  users: User[];
  selectedUserIds: string[];
  onSelectionChange: (userId: string, selected: boolean) => void;
}

const columnClassNames: Record<string, string> = {
  select: "w-12 whitespace-nowrap pl-3 pr-2",
  name: "w-[14%] max-w-0",
  surname: "w-[14%] max-w-0",
  email: "max-w-0",
  groups: "w-[28%] max-w-0",
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

const GroupEmployeesTable = ({
  users,
  selectedUserIds,
  onSelectionChange,
}: GroupEmployeesTableProps) => {
  const { t } = useTranslation(["employees", "groups", "common"]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "select",
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;
          const selected = selectedUserIds.includes(user.id);

          return (
            <input
              type="checkbox"
              checked={selected}
              aria-label={t(($) => $.groups.form.select_employee, {
                name: user.name,
                surname: user.surname,
              })}
              onChange={(event) =>
                onSelectionChange(user.id, event.target.checked)
              }
              className="h-4 w-4 rounded border-gray-400"
            />
          );
        },
      },
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
    ],
    [t, selectedUserIds, onSelectionChange],
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
    <div className="mb-10 min-w-0 overflow-x-auto rounded border border-gray-300 bg-white lg:overflow-x-visible [&>div]:lg:overflow-visible">
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

export default GroupEmployeesTable;
