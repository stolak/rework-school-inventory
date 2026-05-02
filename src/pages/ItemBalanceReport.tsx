import { useMemo, useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories } from "@/hooks/useCategories";
import { useSubCategories } from "@/hooks/useSubCategories";
import { useStores } from "@/hooks/useStores";
import { useItemBalances } from "@/hooks/useItemBalances";

export default function ItemBalanceReport() {
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [storeId, setStoreId] = useState("");

  const { categories } = useCategories();
  const { subCategories } = useSubCategories({
    categoryId: categoryId || undefined,
  });
  const { stores: activeStores } = useStores({
    status: "Active",
    page: 1,
    limit: 200,
  });

  const queryParams = useMemo(
    () => ({
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      storeId: storeId || undefined,
    }),
    [categoryId, subCategoryId, storeId]
  );

  const { balances, isLoading, refetch } = useItemBalances(queryParams);

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubCategoryId("");
  };

  const totalBalance = useMemo(() => {
    return balances.reduce((sum, row) => sum + Number(row.balance ?? 0), 0);
  }, [balances]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8" />
            Item balance report
          </h1>
          <p className="text-muted-foreground mt-1">
            Query on-hand balances by category, sub-category, and/or store. Leave filters
            empty to include all items (per API behavior).
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>All filters are optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Category</Label>
              <Combobox
                value={categoryId}
                onValueChange={handleCategoryChange}
                options={[
                  { value: "", label: "All categories" },
                  ...categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
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
                  ...subCategories.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                placeholder={
                  categoryId ? "All in category" : "Select a category to narrow"
                }
                searchPlaceholder="Search..."
              />
            </div>
            <div className="space-y-2">
              <Label>Store</Label>
              <Combobox
                value={storeId}
                onValueChange={setStoreId}
                options={[
                  { value: "", label: "All stores (global balance)" },
                  ...activeStores.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                placeholder="All stores"
                searchPlaceholder="Search stores..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Balances ({balances.length})</CardTitle>
            <CardDescription className="mt-1">
              Total quantity across visible rows:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {totalBalance.toLocaleString()}
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : balances.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              No balances returned for the current filters.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sub-category</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((row) => (
                    <TableRow key={row.itemId}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.sku?.trim() ? row.sku : "—"}
                      </TableCell>
                      <TableCell>{row.category?.name ?? "—"}</TableCell>
                      <TableCell>{row.subCategory?.name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {Number(row.balance ?? 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
