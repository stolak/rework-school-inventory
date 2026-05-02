import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
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
import { useInventory } from "@/hooks/useInventory";
import { useStores } from "@/hooks/useStores";
import {
  computeRunningBalances,
  useInventoryTransactionLog,
} from "@/hooks/useInventoryTransactionLog";

export default function ItemTransactionLogReport() {
  const today = useMemo(() => new Date(), []);
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  const [itemId, setItemId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [transactionDateFrom, setTransactionDateFrom] = useState(defaultFrom);
  const [transactionDateTo, setTransactionDateTo] = useState(defaultTo);

  const { items: inventoryItems, isLoading: itemsLoading } = useInventory({
    page: 1,
    limit: 500,
  });
  const { stores: activeStores } = useStores({
    status: "Active",
    page: 1,
    limit: 200,
  });

  const queryParams = useMemo(
    () =>
      itemId
        ? {
            itemId,
            storeId: storeId || undefined,
            transactionDateFrom: transactionDateFrom || undefined,
            transactionDateTo: transactionDateTo || undefined,
          }
        : null,
    [itemId, storeId, transactionDateFrom, transactionDateTo]
  );

  const { log, isLoading, isFetching, refetch } =
    useInventoryTransactionLog(queryParams);

  const rowsWithBalance = useMemo(() => {
    if (!log) return [];
    return computeRunningBalances(
      log.balanceBeforeFromDate ?? "0",
      log.transactions ?? []
    );
  }, [log]);

  const selectedItem = inventoryItems.find((i) => i.id === itemId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Item transaction log
          </h1>
          <p className="text-muted-foreground mt-1">
            Select an inventory item (required). Optionally filter by store and date
            range. Running balance uses the API opening balance, then each line’s net
            movement (qty in − qty out).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => refetch()}
          disabled={!itemId}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>
            <span className="text-destructive">Item is required</span> to load the
            log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Item</Label>
              {itemsLoading ? (
                <p className="text-sm text-muted-foreground">Loading items…</p>
              ) : (
                <Combobox
                  value={itemId}
                  onValueChange={setItemId}
                  options={inventoryItems.map((it) => ({
                    value: it.id,
                    label: `${it.name}${it.sku ? ` — ${it.sku}` : ""}`,
                  }))}
                  placeholder="Select inventory item…"
                  searchPlaceholder="Search items…"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Store (optional)</Label>
              <Combobox
                value={storeId}
                onValueChange={setStoreId}
                options={[
                  { value: "", label: "All stores / default scope" },
                  ...activeStores.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                placeholder="Optional store filter"
                searchPlaceholder="Search stores…"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From date</Label>
                <Input
                  type="date"
                  value={transactionDateFrom}
                  onChange={(e) => setTransactionDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To date</Label>
                <Input
                  type="date"
                  value={transactionDateTo}
                  onChange={(e) => setTransactionDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!itemId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Choose an item above to load its transaction log.
          </CardContent>
        </Card>
      ) : isLoading || isFetching ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : log ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{log.item?.name ?? selectedItem?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  SKU: {log.item?.sku ?? selectedItem?.sku ?? "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Opening balance (before from date)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {Number(log.balanceBeforeFromDate ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Basis for running total in the table
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Report window
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  <span className="text-muted-foreground">From: </span>
                  {log.transactionDateFrom
                    ? new Date(log.transactionDateFrom).toLocaleString()
                    : transactionDateFrom}
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">To: </span>
                  {log.transactionDateTo
                    ? new Date(log.transactionDateTo).toLocaleString()
                    : transactionDateTo}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Transactions ({rowsWithBalance.length})
              </CardTitle>
              <CardDescription>
                Rows are sorted by date.{" "}
                <strong>Balance after</strong> is opening + cumulative (qty in − qty
                out) through each line.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rowsWithBalance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions in this period for the selected filters.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Qty in</TableHead>
                        <TableHead className="text-right">Qty out</TableHead>
                        <TableHead className="text-right">Balance after</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rowsWithBalance.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {row.transactionDate
                              ? new Date(row.transactionDate).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.transactionType}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[140px] truncate">
                            {row.referenceNo ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {Number(row.qtyIn ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {Number(row.qtyOut ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {row.balanceAfter.toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate text-sm">
                            {row.store?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                            {row.createdBy
                              ? `${row.createdBy.firstName ?? ""} ${row.createdBy.lastName ?? ""}`.trim()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{row.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate text-sm">
                            {row.notes ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No data returned.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
