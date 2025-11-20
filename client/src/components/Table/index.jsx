import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import * as React from "react";
import "../pages/on-board.css";
import { Pagination } from "@mantine/core";
import TableSkeleton from "./tableSkeleton";

export function DataTable({
  data,
  columns,
  searchKey,
  searchElement,
  paginationProps,
  actionElement,
  minW,
  tableClass,
  renderCustomElement,
  noDataMessage,
  loading,
  limit,
  loader,
}) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [{ pageIndex, pageSize }, setPagination] = React.useState({
    pageIndex: paginationProps?.paginateOpts.page ?? 0,
    pageSize: paginationProps?.paginateOpts.limit ?? limit ?? 10,
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const newColumns = [
    {
      id: "select",
      cell: ({ row }) => (
        <input
          type="checkbox"
          className=" mx-auto flex-1/2"
          checked={row.getIsSelected()}
          onChange={(value) => {
            row.toggleSelected(!!value.target.checked);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // // numbering column
    // {
    //     id: 'numbering',
    //     header: '#',
    //     cell: ({ row }) => <div className="capitalize">{row.index + 1}</div>,
    //     enableSorting: false,
    //     enableHiding: false,
    // },
    ...columns,
  ];

  const table = useReactTable({
    data,
    columns: newColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    debugTable: true,
    onPaginationChange: setPagination,
    manualPagination: paginationProps?.isPaginated,
    // paginateExpandedRows: true,
    enableGlobalFilter: true,
  });
  const isPaginated = paginationProps?.isPaginated ?? false;

  const onPaginate = (page) => {
    if (isPaginated) {
      paginationProps?.setPaginateOpts({
        ...paginationProps?.paginateOpts,
        page,
      });
      return;
    }
    table?.setPageIndex(page);
  };

  return (
    <div className="w-full text-sm">
      {renderCustomElement && renderCustomElement(table)}
      <div className="flex w-full justify-between gap-x-2">
        {searchElement ? (
          searchElement
        ) : searchKey ? (
          <div className="flex w-full items-center py-4">
            <input
              type="text"
              placeholder={`Search ...`}
              value={table.getState().globalFilter ?? ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="lg:max-w-xs max-w-[16em] w-full rounded-md duration-300"
            />
          </div>
        ) : (
          <div></div>
        )}
        {actionElement && actionElement}
      </div>
      {loading ? (
        (loader ?? (
          <div className={` w-full overflow-auto ${tableClass}`}>
            <TableSkeleton columns={columns} />
          </div>
        ))
      ) : (
        <>
          <div className={` w-full overflow-auto ${tableClass}`}>
            <table
              style={{ minWidth: minW ?? 700 }}
              className="  mx-auto flex flex-col gap-y-2 "
            >
              <thead className=" text-major-text-style ">
                {table.getHeaderGroups().map((headerGroup) => (
                  <div
                    className=" glass_morphism rounded-[10px] w-full py-2  "
                    key={headerGroup.id}
                  >
                    <tr className="w-full flex justify-evenly items-center gap-x-1">
                      {headerGroup.headers.map((header, i) => {
                        return (
                          <td
                            className={clsx(
                              "font-semibold py-3 whitespace-nowrap flex justify-start text-white",
                              i === 0 ? "flex-[0.25]" : "flex-1",
                            )}
                            key={header.id}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </td>
                        );
                      })}
                    </tr>
                  </div>
                ))}
              </thead>
              <tbody className="w-full flex flex-col gap-y-1">
                {table?.getRowModel().rows?.length ? (
                  table?.getRowModel().rows.map((row, i) => (
                    <div
                      className={`w-full rounded-md overflow-hidden bg-transparent flex flex-col  gap-y-2  p-1 text-white `}
                      key={row.id}
                    >
                      <tr
                        className="w-full flex justify-evenly items-center"
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell, i) => (
                          <td
                            className={clsx(
                              `flex justify-start text-white `,
                              // row.getIsSelected() ? 'bg-mainPurple text-white font-semibold' : '',
                              i === 0 ? "flex-[0.25]" : "flex-1",
                            )}
                            key={cell.id}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                      {i !== table?.getRowModel().rows.length - 1 && <hr />}
                    </div>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length + 2}
                      className="h-24 text-center text-gray-700 text-lg"
                    >
                      {noDataMessage ?? "No Data So far ..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="w-full p-12 flex justify-end">
            <div className="">
              <Pagination
                className={"text-white"}
                color="purple"
                radius={"xl"}
                total={
                  isPaginated
                    ? (paginationProps?.paginateOpts?.totalPages ?? 1)
                    : table?.getPageCount()
                }
                onNextPage={() => {
                  if (isPaginated) {
                    paginationProps?.setPaginateOpts({
                      ...paginationProps?.paginateOpts,
                      page: (paginationProps?.paginateOpts?.page ?? 0) + 1,
                    });
                    return;
                  }
                  table?.nextPage();
                }}
                value={
                  isPaginated
                    ? (paginationProps?.paginateOpts?.page ?? 0) + 1
                    : table?.getState().pagination.pageIndex + 1
                }
                onPreviousPage={() => {
                  if (isPaginated) {
                    paginationProps?.setPaginateOpts({
                      ...paginationProps?.paginateOpts,
                      page: (paginationProps?.paginateOpts?.page ?? 0) - 1,
                    });
                    return;
                  }
                  table?.previousPage();
                }}
                onChange={(page) => {
                  onPaginate(page - 1);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
