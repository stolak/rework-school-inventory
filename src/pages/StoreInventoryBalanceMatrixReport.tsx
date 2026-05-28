import { useEffect, useMemo, useState } from "react";
import { Grid3X3, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { ReportActions } from "@/components/reports/ReportActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStores } from "@/hooks/useStores";
import { useInventory } from "@/hooks/useInventory";
import { useCategories } from "@/hooks/useCategories";
import { useSubCategories } from "@/hooks/useSubCategories";
import { useInventoryBalanceMatrix } from "@/hooks/useInventoryBalanceMatrix";

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function StoreInventoryBalanceMatrixReport() {
  const TABLE_ID = "store-inventory-balance-matrix-table";
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const { stores: activeStores } = useStores({
    status: "Active",
    page: 1,
    limit: 500,
  });
  const { items: inventoryItems } = useInventory({ status: "Active", page: 1, limit: 500 });
  const { categories } = useCategories();
  const { subCategories } = useSubCategories({ categoryId: categoryId || undefined });

  const { rows, isLoading, run } = useInventoryBalanceMatrix();

  const storeOptions = useMemo(
    () => activeStores.map((s) => ({ value: s.id, label: s.name })),
    [activeStores],
  );
  const itemOptions = useMemo(
    () =>
      inventoryItems.map((i) => ({
        value: i.id,
        label: `${i.name}${i.sku ? ` — ${i.sku}` : ""}`,
      })),
    [inventoryItems],
  );

  const handleRun = async () => {
    await run({
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      stores: selectedStoreIds.length ? selectedStoreIds : undefined,
      items: selectedItemIds.length ? selectedItemIds : undefined,
    });
  };

  useEffect(() => {
    // initial load with empty body allowed by API
    void handleRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stores = useMemo(
    () =>
      rows.map((r) => ({
        id: r.store.id,
        name: r.store.name,
      })),
    [rows],
  );

  const items = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        sku?: string | null;
        categoryName?: string;
        subCategoryName?: string;
      }
    >();

    for (const storeRow of rows) {
      for (const it of storeRow.items) {
        const item = it.item;
        if (!map.has(item.id)) {
          map.set(item.id, {
            id: item.id,
            name: item.name,
            sku: item.sku ?? null,
            categoryName: item.category?.name,
            subCategoryName: item.subCategory?.name,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const balanceByStoreAndItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const storeRow of rows) {
      const storeId = storeRow.store.id;
      for (const it of storeRow.items) {
        map.set(`${storeId}::${it.item.id}`, toNumber(it.balance));
      }
    }
    return map;
  }, [rows]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Grid3X3 className="h-8 w-8" />
            Store inventory balance matrix
          </h1>
          <p className="text-muted-foreground mt-1">
            Stores are shown across the top, items down the left. All filters are optional.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center print:hidden">
          <ReportActions
            tableId={TABLE_ID}
            filenameBase="store-inventory-balance-matrix"
            disabled={isLoading || stores.length === 0 || items.length === 0}
          />
          <Button type="button" variant="outline" onClick={handleRun} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Leave fields empty to include all.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Category</Label>
              <Combobox
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  setSubCategoryId("");
                }}
                options={[
                  { value: "", label: "All categories" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                placeholder="All categories"
                searchPlaceholder="Search categories..."
              />
            </div>
            <div className="space-y-2">
              <Label>Sub-category</Label>
              <Combobox
                value={subCategoryId}
                onValueChange={setSubCategoryId}
                options={[
                  { value: "", label: "All sub-categories" },
                  ...subCategories.map((s) => ({ value: s.id, label: s.name })),
                ]}
                placeholder={categoryId ? "All in category" : "Select a category to narrow"}
                searchPlaceholder="Search sub-categories..."
              />
            </div>
            <div className="space-y-2">
              <Label>Stores (optional)</Label>
              <MultiCombobox
                options={storeOptions}
                value={selectedStoreIds}
                onValueChange={setSelectedStoreIds}
                placeholder="Select one or more stores…"
                searchPlaceholder="Search stores…"
              />
            </div>
            <div className="space-y-2">
              <Label>Items (optional)</Label>
              <MultiCombobox
                options={itemOptions}
                value={selectedItemIds}
                onValueChange={setSelectedItemIds}
                placeholder="Select one or more items…"
                searchPlaceholder="Search items…"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="button" onClick={handleRun} disabled={isLoading} className="bg-gradient-primary">
              <Search className="mr-2 h-4 w-4" />
              Run report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Matrix{" "}
            <span className="text-muted-foreground font-normal">
              ({stores.length} stores × {items.length} items)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : stores.length === 0 || items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No data returned for the selected filters.
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table id={TABLE_ID}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[320px]">
                      Item
                    </TableHead>
                    {stores.map((s) => (
                      <TableHead key={s.id} className="text-right whitespace-nowrap">
                        {s.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-right whitespace-nowrap">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    let rowTotal = 0;
                    const cells = stores.map((s) => {
                      const val = balanceByStoreAndItem.get(`${s.id}::${it.id}`) ?? 0;
                      rowTotal += val;
                      return { storeId: s.id, val };
                    });

                    return (
                      <TableRow key={it.id}>
                        <TableCell className="sticky left-0 bg-background z-10">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{it.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {it.sku ? (
                                <span className="font-mono">{it.sku}</span>
                              ) : (
                                <span className="italic">No SKU</span>
                              )}
                              {it.categoryName ? ` • ${it.categoryName}` : ""}
                              {it.subCategoryName ? ` / ${it.subCategoryName}` : ""}
                            </div>
                          </div>
                        </TableCell>
                        {cells.map((c) => (
                          <TableCell key={`${it.id}-${c.storeId}`} className="text-right tabular-nums">
                            {c.val === 0 ? (
                              <span className="text-muted-foreground">0</span>
                            ) : (
                              c.val
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-right tabular-nums font-semibold">
                          {rowTotal === 0 ? (
                            <span className="text-muted-foreground">0</span>
                          ) : (
                            <Badge variant="secondary" className="tabular-nums">
                              {rowTotal}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

