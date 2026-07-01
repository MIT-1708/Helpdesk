import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, Search, RefreshCw, AlertCircle, Calendar, Tag, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { TicketStatus, TicketCategory } from '@helpdesk/core';
import type { Ticket } from '@helpdesk/core';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';

interface PaginationMetadata {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FetchTicketsResponse {
  tickets: Ticket[];
  pagination: PaginationMetadata;
}

const fetchTickets = async (filters: {
  status: string;
  category: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}): Promise<FetchTicketsResponse> => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const params: any = {};
  if (filters.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters.category && filters.category !== 'all') {
    params.category = filters.category;
  }
  if (filters.search) {
    params.search = filters.search;
  }
  params.sortBy = filters.sortBy;
  params.sortOrder = filters.sortOrder;
  params.page = filters.page;
  params.pageSize = filters.pageSize;

  const response = await axios.get(`${baseUrl}/api/tickets`, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset pagination to first page when search filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [statusFilter, categoryFilter, debouncedSearch]);

  const activeSort = sorting[0] || { id: 'createdAt', desc: true };
  const sortBy = activeSort.id;
  const sortOrder = activeSort.desc ? 'desc' : 'asc';

  const { data, isLoading, isFetching, error, refetch } = useQuery<FetchTicketsResponse>({
    queryKey: ['tickets', statusFilter, categoryFilter, debouncedSearch, sortBy, sortOrder, pageIndex, pageSize],
    queryFn: () =>
      fetchTickets({
        status: statusFilter,
        category: categoryFilter,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        page: pageIndex + 1,
        pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const tickets = data?.tickets || [];
  const totalCount = data?.pagination?.totalCount || 0;
  const pageCount = data?.pagination?.totalPages || 0;

  const columns = [
    {
      accessorKey: 'id',
      header: ({ column }: any) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground font-semibold cursor-pointer"
        >
          <span>ID</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }: any) => (
        <span className="font-mono bg-muted px-2 py-0.5 rounded border border-border text-foreground">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'subject',
      header: ({ column }: any) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground font-semibold cursor-pointer"
        >
          <span>Subject</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }: any) => (
        <div className="flex flex-col max-w-[280px]">
          <Link
            to={`/tickets/${row.original.id}`}
            className="font-semibold text-foreground hover:text-primary transition-colors truncate cursor-pointer"
            title={row.original.subject}
          >
            {row.original.subject}
          </Link>
          <span className="text-[10px] text-muted-foreground truncate mt-0.5">
            {row.original.body}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'senderEmail',
      header: ({ column }: any) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground font-semibold cursor-pointer"
        >
          <span>Sender</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }: any) => (
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-foreground truncate text-xs">
            {row.original.senderName || 'Anonymous'}
          </span>
          <span className="text-[10px] text-muted-foreground truncate">
            {row.original.senderEmail}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }: any) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground font-semibold cursor-pointer"
        >
          <span>Status</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }: any) => {
        const val = row.original.status;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              val === TicketStatus.OPEN
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : val === TicketStatus.RESOLVED
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
            }`}
          >
            {val}
          </span>
        );
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }: any) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground font-semibold cursor-pointer"
        >
          <span>Category</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }: any) => {
        const val = row.original.category;
        return val ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border truncate max-w-[130px]">
            <Tag className="h-2.5 w-2.5 shrink-0 text-primary/70" />
            <span className="truncate">{val}</span>
          </span>
        ) : (
          <span className="text-muted-foreground/30 text-[10px]">—</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }: any) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground font-semibold cursor-pointer"
        >
          <span>Created At</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }: any) => (
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(row.original.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualSorting: true,
    manualPagination: true,
    pageCount: pageCount,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex-1 p-6 md:p-10 bg-background relative min-h-[calc(100vh-140px)] overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[12s]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <TicketIcon className="h-5 w-5" />
              </div>
              Tickets Directory
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor, filter, and manage incoming support student tickets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="gap-2 h-9 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-card/40 backdrop-blur-sm border border-border/80 p-5 rounded-2xl shadow-sm">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by subject, body, or sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-background/50 border-border/80 rounded-xl w-full text-sm focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/60 transition-all duration-300"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 bg-background/50 border border-border/80 rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value={TicketStatus.OPEN}>Open</option>
              <option value={TicketStatus.RESOLVED}>Resolved</option>
              <option value={TicketStatus.CLOSED}>Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-11 bg-background/50 border border-border/80 rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value={TicketCategory.GENERAL}>General Question</option>
              <option value={TicketCategory.TECHNICAL}>Technical Question</option>
              <option value={TicketCategory.REFUND}>Refund Request</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading ? (
          <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/25 backdrop-blur-sm animate-pulse space-y-4 p-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-muted rounded-xl w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-5 rounded-2xl flex items-start gap-4 max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="h-5.5 w-5.5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Failed to load tickets</h3>
              <p className="text-xs opacity-90">{(error as Error).message}</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-card/25 border border-border/60 rounded-2xl max-w-lg mx-auto shadow-sm backdrop-blur-sm space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border">
              <TicketIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 px-6">
              <h3 className="font-bold text-base text-foreground">No tickets found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No tickets matched your selected search criteria. Try modifying your filter rules.
              </p>
            </div>
          </div>
        ) : (
          /* Tickets Table with Pagination controls */
          <div className="space-y-4">
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-sm shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        data-testid="ticket-card"
                        className="border-b border-border/50 hover:bg-muted/30 transition-all duration-200"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4.5 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/20 backdrop-blur-sm border border-border/80 p-4 rounded-2xl shadow-sm">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{tickets.length}</span> of{' '}
                <span className="font-semibold text-foreground">{totalCount}</span> tickets
              </div>
              
              <div className="flex items-center gap-6">
                {/* Page size selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="bg-background/50 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 px-3 rounded-lg border-border hover:bg-muted text-foreground transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-1">
                    Page <span className="font-semibold text-foreground">{pageIndex + 1}</span> of{' '}
                    <span className="font-semibold text-foreground">{pageCount || 1}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 px-3 rounded-lg border-border hover:bg-muted text-foreground transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
