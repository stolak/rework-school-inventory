import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pagination as PaginationMeta } from "@/lib/api";

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

/** Page numbers and ellipsis markers for compact pagination controls. */
export function getPaginationPages(
  current: number,
  totalPages: number
): (number | "ellipsis")[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

type TablePaginationBarProps = {
  pagination: PaginationMeta;
  totalLabel?: string;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  className?: string;
};

export function TablePaginationBar({
  pagination,
  totalLabel = "Total",
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationBarProps) {
  const { page, totalPages, total } = pagination;
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pages = getPaginationPages(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm font-semibold text-foreground shrink-0">
        {totalLabel}:{" "}
        <span className="font-bold tabular-nums">{total}</span>
      </p>

      {totalPages > 1 ? (
        <Pagination className="mx-0 w-auto justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                href="#"
                size="icon"
                aria-label="Previous page"
                className={cn(
                  "h-9 w-9",
                  !canPrev && "pointer-events-none opacity-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (canPrev) onPageChange(page - 1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>

            {pages.map((p, idx) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    size="icon"
                    isActive={p === page}
                    className={cn(
                      "h-9 w-9 tabular-nums",
                      p === page &&
                        "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      if (p !== page) onPageChange(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationLink
                href="#"
                size="icon"
                aria-label="Next page"
                className={cn(
                  "h-9 w-9",
                  !canNext && "pointer-events-none opacity-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (canNext) onPageChange(page + 1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : (
        <div className="hidden sm:block sm:flex-1" aria-hidden />
      )}

      <div className="flex items-center justify-end gap-2 text-sm shrink-0">
        <span className="text-muted-foreground whitespace-nowrap">
          Show per Page:
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-9 w-[72px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
