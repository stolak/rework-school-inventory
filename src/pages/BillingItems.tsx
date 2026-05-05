import { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BillingItemDialog } from "@/components/dialogs/BillingItemDialog";
import {
  useBillingItemCategories,
  useBillingItems,
} from "@/hooks/useBillingItems";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import type { BillingItem } from "@/lib/api";
import type {
  BillingItemAddFormData,
  BillingItemEditFormData,
} from "@/components/forms/BillingItemForm";
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

const ALL = "__all__";

function toInt(s: string, fallback: number) {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function BillingItems() {
  const { data: categories = [], isLoading: categoriesLoading } =
    useBillingItemCategories();

  const [categoryStr, setCategoryStr] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const [pageStr, setPageStr] = useState<string>("1");
  const [limitStr, setLimitStr] = useState<string>("100");
  const [searchTerm, setSearchTerm] = useState("");

  const page = toInt(pageStr, 1);
  const limit = toInt(limitStr, 100);

  const listParams = useMemo(
    () => ({
      category: categoryStr === ALL ? undefined : categoryStr,
      status: statusFilter,
      page,
      limit,
    }),
    [categoryStr, statusFilter, page, limit]
  );

  const {
    billingItems,
    pagination,
    isLoading: itemsLoading,
    createBillingItem,
    updateBillingItem,
    deleteBillingItem,
  } = useBillingItems(listParams);

  const { charts: accountCharts = [] } = useAccountCharts({
    status: "All",
  });

  const categoryOptions = useMemo(
    () => [
      { value: ALL, label: "All categories" },
      ...categories.map((c) => ({ value: c, label: c })),
    ],
    [categories]
  );

  const accountOptions = useMemo(() => {
    const mapped = accountCharts.map((a) => ({
      value: String(a.id),
      label: `${a.accountNo?.trim() ? `${a.accountNo} — ` : ""}${a.accountDescription}`,
    }));
    mapped.sort((x, y) => x.label.localeCompare(y.label));
    return mapped;
  }, [accountCharts]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return billingItems;
    return billingItems.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.account?.accountDescription ?? "").toLowerCase().includes(q)
    );
  }, [billingItems, searchTerm]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedItem, setSelectedItem] = useState<BillingItem | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<BillingItem | null>(null);

  const handleAdd = () => {
    setDialogMode("add");
    setSelectedItem(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (row: BillingItem) => {
    setDialogMode("edit");
    setSelectedItem(row);
    setDialogOpen(true);
  };

  const handleDelete = (row: BillingItem) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteBillingItem(toDelete.id);
      setToDelete(null);
      setDeleteOpen(false);
    } catch {
      setToDelete(null);
      setDeleteOpen(false);
    }
  };

  const handleSubmit = async (
    data: BillingItemAddFormData | BillingItemEditFormData
  ) => {
    const accountId = parseInt(data.accountId, 10);
    if (!Number.isFinite(accountId) || accountId <= 0) return;

    if (dialogMode === "add") {
      const d = data as BillingItemAddFormData;
      await createBillingItem({
        code: d.code.trim(),
        name: d.name.trim(),
        category: d.category,
        accountId,
        optional: d.optional,
      });
    } else if (dialogMode === "edit" && selectedItem) {
      const d = data as BillingItemEditFormData;
      await updateBillingItem({
        id: selectedItem.id,
        data: {
          code: d.code.trim(),
          name: d.name.trim(),
          category: d.category,
          accountId,
          optional: d.optional,
          status: d.status,
        },
      });
    }
  };

  const canPrev = pagination ? pagination.page > 1 : page > 1;
  const canNext = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            Billing items
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage billing items (code, category, linked account, optional)
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add billing item
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Combobox
              options={categoryOptions}
              value={categoryStr}
              onValueChange={(v) => {
                setCategoryStr(v);
                setPageStr("1");
              }}
              placeholder={categoriesLoading ? "Loading…" : "All categories"}
              searchPlaceholder="Search categories…"
              disabled={categoriesLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
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
                <SelectItem value="All">All</SelectItem>
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code, name, category, account…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {pagination
            ? `Page ${pagination.page} of ${pagination.totalPages} • Total ${pagination.total}`
            : undefined}
        </div>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          {itemsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading billing items…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Optional</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.category}</Badge>
                    </TableCell>
                    <TableCell>{row.optional ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.account?.accountDescription ?? `Account ${row.accountId}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!itemsLoading && filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No billing items match the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!canPrev) return;
                  setPageStr(String(Math.max(1, page - 1)));
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!canNext) return;
                  setPageStr(String(page + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <BillingItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        billingItem={selectedItem}
        categoryOptions={categoryOptions.filter((o) => o.value !== ALL)}
        accountOptions={accountOptions}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete billing item?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Item <strong>{toDelete?.code}</strong> will
              be removed.
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

