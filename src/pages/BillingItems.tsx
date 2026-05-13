import { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Receipt, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ConcessionDiscountDialog } from "@/components/dialogs/ConcessionDiscountDialog";
import {
  useBillingItemCategories,
  useBillingItems,
} from "@/hooks/useBillingItems";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import {
  useConcessionDiscounts,
  type ConcessionDiscountRow,
} from "@/hooks/useConcessionDiscounts";
import type { BillingItem } from "@/lib/api";
import type {
  BillingItemAddFormData,
  BillingItemEditFormData,
} from "@/components/forms/BillingItemForm";
import type { ConcessionDiscountFormData } from "@/components/forms/ConcessionDiscountForm";
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
const STATUS_ALL = "All";

function toInt(s: string, fallback: number) {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toIntCd(s: string, fallback: number) {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function BillingItems() {
  const { data: categories = [], isLoading: categoriesLoading } =
    useBillingItemCategories();

  const [biCategoryStr, setBiCategoryStr] = useState<string>(ALL);
  const [biStatusFilter, setBiStatusFilter] = useState<string>("Active");
  const [biPageStr, setBiPageStr] = useState<string>("1");
  const [biLimitStr, setBiLimitStr] = useState<string>("100");
  const [biSearchTerm, setBiSearchTerm] = useState("");

  const biPage = toInt(biPageStr, 1);
  const biLimit = toInt(biLimitStr, 100);

  const biListParams = useMemo(
    () => ({
      category: biCategoryStr === ALL ? undefined : biCategoryStr,
      status: biStatusFilter,
      page: biPage,
      limit: biLimit,
    }),
    [biCategoryStr, biStatusFilter, biPage, biLimit]
  );

  const {
    billingItems: biRows,
    pagination: biPagination,
    isLoading: biLoading,
    createBillingItem,
    updateBillingItem,
    deleteBillingItem,
  } = useBillingItems(biListParams);

  const [cdStatusFilter, setCdStatusFilter] = useState<string>("Active");
  const [cdPageStr, setCdPageStr] = useState<string>("1");
  const [cdLimitStr, setCdLimitStr] = useState<string>("100");
  const [cdSearchTerm, setCdSearchTerm] = useState("");

  const cdPage = Math.max(1, toIntCd(cdPageStr, 1));
  const cdLimit = Math.max(1, toIntCd(cdLimitStr, 100));

  const {
    concessionDiscounts,
    pagination: cdPagination,
    isLoading: cdLoading,
    createConcessionDiscount,
    updateConcessionDiscount,
    deleteConcessionDiscount,
  } = useConcessionDiscounts({
    status: cdStatusFilter,
    page: cdPage,
    limit: cdLimit,
  });

  const { billingItems: discountFormBiList } = useBillingItems({
      status: "Active",
      page: 1,
      limit: 500,
    });

  const { charts: accountCharts = [] } = useAccountCharts({
    status: "All",
  });

  const biCategoryOptions = useMemo(
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

  const discountBillingItemOptions = useMemo(
    () =>
      discountFormBiList.map((b) => ({
        value: String(b.id),
        label: `${b.code} — ${b.name}`,
      })),
    [discountFormBiList]
  );

  const biFiltered = useMemo(() => {
    const q = biSearchTerm.trim().toLowerCase();
    if (!q) return biRows;
    return biRows.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.account?.accountDescription ?? "").toLowerCase().includes(q)
    );
  }, [biRows, biSearchTerm]);

  const cdFiltered = useMemo(() => {
    const q = cdSearchTerm.trim().toLowerCase();
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
  }, [concessionDiscounts, cdSearchTerm]);

  const [biDialogOpen, setBiDialogOpen] = useState(false);
  const [biDialogMode, setBiDialogMode] = useState<"add" | "edit">("add");
  const [biSelectedItem, setBiSelectedItem] = useState<BillingItem | undefined>();
  const [biDeleteOpen, setBiDeleteOpen] = useState(false);
  const [biToDelete, setBiToDelete] = useState<BillingItem | null>(null);

  const [cdDialogOpen, setCdDialogOpen] = useState(false);
  const [cdDialogMode, setCdDialogMode] = useState<"add" | "edit">("add");
  const [cdSelectedDiscount, setCdSelectedDiscount] = useState<
    ConcessionDiscountRow | undefined
  >();
  const [cdDeleteOpen, setCdDeleteOpen] = useState(false);
  const [cdToDelete, setCdToDelete] = useState<ConcessionDiscountRow | null>(null);

  const handleBiAdd = () => {
    setBiDialogMode("add");
    setBiSelectedItem(undefined);
    setBiDialogOpen(true);
  };

  const handleBiEdit = (row: BillingItem) => {
    setBiDialogMode("edit");
    setBiSelectedItem(row);
    setBiDialogOpen(true);
  };

  const handleBiDelete = (row: BillingItem) => {
    setBiToDelete(row);
    setBiDeleteOpen(true);
  };

  const confirmBiDelete = async () => {
    if (!biToDelete) return;
    try {
      await deleteBillingItem(biToDelete.id);
      setBiToDelete(null);
      setBiDeleteOpen(false);
    } catch {
      setBiToDelete(null);
      setBiDeleteOpen(false);
    }
  };

  const handleBiSubmit = async (
    data: BillingItemAddFormData | BillingItemEditFormData
  ) => {
    const accountId = parseInt(data.accountId, 10);
    if (!Number.isFinite(accountId) || accountId <= 0) return;

    if (biDialogMode === "add") {
      const d = data as BillingItemAddFormData;
      await createBillingItem({
        code: d.code.trim(),
        name: d.name.trim(),
        category: d.category,
        accountId,
        optional: d.optional,
      });
    } else if (biDialogMode === "edit" && biSelectedItem) {
      const d = data as BillingItemEditFormData;
      await updateBillingItem({
        id: biSelectedItem.id,
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

  const cdOpenAdd = () => {
    setCdDialogMode("add");
    setCdSelectedDiscount(undefined);
    setCdDialogOpen(true);
  };

  const cdOpenEdit = (row: ConcessionDiscountRow) => {
    setCdDialogMode("edit");
    setCdSelectedDiscount(row);
    setCdDialogOpen(true);
  };

  const cdOpenDelete = (row: ConcessionDiscountRow) => {
    setCdToDelete(row);
    setCdDeleteOpen(true);
  };

  const confirmCdDelete = async () => {
    if (!cdToDelete) return;
    try {
      await deleteConcessionDiscount(cdToDelete.id);
      setCdToDelete(null);
      setCdDeleteOpen(false);
    } catch {
      setCdToDelete(null);
      setCdDeleteOpen(false);
    }
  };

  const handleCdSubmit = async (data: ConcessionDiscountFormData) => {
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

    if (cdDialogMode === "add") {
      await createConcessionDiscount(payload);
    } else if (cdDialogMode === "edit" && cdSelectedDiscount) {
      await updateConcessionDiscount({
        id: cdSelectedDiscount.id,
        data: payload,
      });
    }
  };

  const biCanPrev = biPagination ? biPagination.page > 1 : biPage > 1;
  const biCanNext = biPagination ? biPagination.page < biPagination.totalPages : false;

  const cdCanPrev = cdPagination ? cdPagination.page > 1 : false;
  const cdCanNext = cdPagination ? cdPagination.page < cdPagination.totalPages : false;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 flex-wrap">
          <Receipt className="h-8 w-8 shrink-0" />
          Billing &amp; discounts
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Manage billable products (codes and accounts), then configure concessions and discounts
          that reference those billing items.
        </p>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-auto sm:inline-flex">
          <TabsTrigger value="items" className="gap-2">
            <Receipt className="h-4 w-4" />
            Billing items
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-2">
            <Percent className="h-4 w-4" />
            Concession discounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardDescription className="text-sm sm:flex-1">
              Codes, categories, optional flag, and linked GL accounts for student billing.
            </CardDescription>
            <Button onClick={handleBiAdd} size="sm" className="shrink-0">
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
                  options={biCategoryOptions}
                  value={biCategoryStr}
                  onValueChange={(v) => {
                    setBiCategoryStr(v);
                    setBiPageStr("1");
                  }}
                  placeholder={categoriesLoading ? "Loading…" : "All categories"}
                  searchPlaceholder="Search categories…"
                  disabled={categoriesLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={biStatusFilter}
                  onValueChange={(v) => {
                    setBiStatusFilter(v);
                    setBiPageStr("1");
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
                  value={biPageStr}
                  onChange={(e) => setBiPageStr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={biLimitStr}
                  onChange={(e) => setBiLimitStr(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search code, name, category, account…"
                value={biSearchTerm}
                onChange={(e) => setBiSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {biPagination
                ? `Page ${biPagination.page} of ${biPagination.totalPages} • Total ${biPagination.total}`
                : undefined}
            </div>
          </div>

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              {biLoading ? (
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
                    {biFiltered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.category}</Badge>
                        </TableCell>
                        <TableCell>{row.optional ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={row.status === "Active" ? "default" : "secondary"}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.account?.accountDescription ?? `Account ${row.accountId}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleBiEdit(row)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleBiDelete(row)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!biLoading && biFiltered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No billing items match the current filters.
                </div>
              )}
            </CardContent>
          </Card>

          {biPagination && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!biCanPrev) return;
                      setBiPageStr(String(Math.max(1, biPage - 1)));
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!biCanNext) return;
                      setBiPageStr(String(biPage + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardDescription className="text-sm sm:flex-1">
              Percentage or fixed concessions/discounts tied to accounts and billing items.
            </CardDescription>
            <Button onClick={cdOpenAdd} size="sm" className="shrink-0">
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
                <Label>Status</Label>
                <Select
                  value={cdStatusFilter}
                  onValueChange={(v) => {
                    setCdStatusFilter(v);
                    setCdPageStr("1");
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
                  value={cdPageStr}
                  onChange={(e) => setCdPageStr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={cdLimitStr}
                  onChange={(e) => setCdLimitStr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Code, name, applies to…"
                    value={cdSearchTerm}
                    onChange={(e) => setCdSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              {cdLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : (
                <div className="overflow-x-auto">
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
                      {cdFiltered.map((row) => (
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
                              <Button size="sm" variant="outline" onClick={() => cdOpenEdit(row)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => cdOpenDelete(row)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!cdLoading && cdFiltered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No concession discounts found.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-center">
            {cdPagination && cdPagination.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!cdCanPrev) return;
                        setCdPageStr(String(cdPagination.page - 1));
                      }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!cdCanNext) return;
                        setCdPageStr(String(cdPagination.page + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <BillingItemDialog
        open={biDialogOpen}
        onOpenChange={setBiDialogOpen}
        mode={biDialogMode}
        billingItem={biSelectedItem}
        categoryOptions={biCategoryOptions.filter((o) => o.value !== ALL)}
        accountOptions={accountOptions}
        onSubmit={handleBiSubmit}
      />

      <ConcessionDiscountDialog
        open={cdDialogOpen}
        onOpenChange={setCdDialogOpen}
        mode={cdDialogMode}
        discount={cdSelectedDiscount}
        billingItemOptions={discountBillingItemOptions}
        accountOptions={accountOptions}
        onSubmit={handleCdSubmit}
      />

      <AlertDialog open={biDeleteOpen} onOpenChange={setBiDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete billing item?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Item <strong>{biToDelete?.code}</strong> will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBiDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cdDeleteOpen} onOpenChange={setCdDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. <strong>{cdToDelete?.code}</strong> will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCdDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
