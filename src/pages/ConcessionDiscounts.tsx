import { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

import { ConcessionDiscountDialog } from "@/components/dialogs/ConcessionDiscountDialog";
import { useConcessionDiscounts, type ConcessionDiscountRow } from "@/hooks/useConcessionDiscounts";
import { useBillingItems } from "@/hooks/useBillingItems";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import type { ConcessionDiscountFormData } from "@/components/forms/ConcessionDiscountForm";

const STATUS_ALL = "All";

function toInt(s: string, fallback: number) {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function ConcessionDiscountsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const [pageStr, setPageStr] = useState<string>("1");
  const [limitStr, setLimitStr] = useState<string>("100");
  const [searchTerm, setSearchTerm] = useState("");

  const page = Math.max(1, toInt(pageStr, 1));
  const limit = Math.max(1, toInt(limitStr, 100));

  const {
    concessionDiscounts,
    pagination,
    isLoading: discountsLoading,
    createConcessionDiscount,
    updateConcessionDiscount,
    deleteConcessionDiscount,
  } = useConcessionDiscounts({
    status: statusFilter,
    page,
    limit,
  });

  const { billingItems, isLoading: billingItemsLoading } = useBillingItems({
    status: "Active",
    page: 1,
    limit: 500,
  });

  const { charts: accountCharts, isLoading: accountChartsLoading } = useAccountCharts({
    status: "All",
  });

  const billingItemOptions = useMemo(
    () =>
      billingItems.map((b) => ({
        value: String(b.id),
        label: `${b.code} — ${b.name}`,
      })),
    [billingItems]
  );

  const accountOptions = useMemo(
    () =>
      accountCharts.map((c) => ({
        value: String(c.id),
        label: `${c.accountNo ?? ""}${c.accountNo ? " — " : ""}${c.accountDescription}`,
      })),
    [accountCharts]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return concessionDiscounts;
    return concessionDiscounts.filter((d) => {
      const appliesCount = d.appliesToIds.length;
      return (
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.calculationType.toLowerCase().includes(q) ||
        String(appliesCount).includes(q) ||
        (d.account?.accountDescription ?? "").toLowerCase().includes(q)
      );
    });
  }, [concessionDiscounts, searchTerm]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedDiscount, setSelectedDiscount] = useState<ConcessionDiscountRow | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ConcessionDiscountRow | null>(null);

  const openAdd = () => {
    setDialogMode("add");
    setSelectedDiscount(undefined);
    setDialogOpen(true);
  };

  const openEdit = (row: ConcessionDiscountRow) => {
    setDialogMode("edit");
    setSelectedDiscount(row);
    setDialogOpen(true);
  };

  const openDelete = (row: ConcessionDiscountRow) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteConcessionDiscount(toDelete.id);
      setToDelete(null);
      setDeleteOpen(false);
    } catch {
      setToDelete(null);
      setDeleteOpen(false);
    }
  };

  const handleSubmit = async (data: ConcessionDiscountFormData) => {
    const payload = {
      code: data.code.trim(),
      name: data.name.trim(),
      type: data.type,
      calculationType: data.calculationType,
      value: data.value,
      accountId: parseInt(data.accountId, 10),
      appliesToIds: data.appliesToIds.map((id) => parseInt(id, 10)),
      maxLimit: data.maxLimit,
      status: data.status,
    };

    if (dialogMode === "add") {
      await createConcessionDiscount(payload);
    } else if (dialogMode === "edit" && selectedDiscount) {
      await updateConcessionDiscount({
        id: selectedDiscount.id,
        data: payload,
      });
    }
  };

  const canPrev = pagination ? pagination.page > 1 : false;
  const canNext = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Percent className="h-8 w-8" />
            Concession discounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Create discounts and concessions for billing items.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add discount
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPageStr("1");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_ALL}>All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Page</Label>
            <Input
              type="number"
              min={1}
              value={pageStr}
              onChange={(e) => setPageStr(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input
              type="number"
              min={1}
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search code, name, applies to…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          {discountsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Calculation</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Max limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead className="text-right w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.calculationType}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.value}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.maxLimit}</TableCell>
                    <TableCell>
                      <span className="text-sm">{row.status}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.account?.accountDescription ?? `Account #${row.accountId}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.appliesToIds.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openDelete(row)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!discountsLoading && filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No concession discounts found.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center">
        {pagination && pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!canPrev) return;
                    setPageStr(String(pagination.page - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!canNext) return;
                    setPageStr(String(pagination.page + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <ConcessionDiscountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        discount={selectedDiscount}
        billingItemOptions={billingItemOptions}
        accountOptions={accountOptions}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. <strong>{toDelete?.code}</strong> will be
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

