import { useMemo, useState } from "react";
import { ArrowLeftRight, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventory";
import { useMyStores } from "@/hooks/useMyStores";
import { useStores } from "@/hooks/useStores";
import { useStoreTransfers } from "@/hooks/useStoreTransfers";
import { useToast } from "@/hooks/use-toast";

interface LineItem {
  itemId: string;
  qty: number;
}

export default function StoreItemTransfer() {
  const today = useMemo(() => new Date(), []);
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  const [filterItemId, setFilterItemId] = useState("");
  const [filterSourceId, setFilterSourceId] = useState("");
  const [filterDestId, setFilterDestId] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [transactionDateFrom, setTransactionDateFrom] = useState(defaultFrom);
  const [transactionDateTo, setTransactionDateTo] = useState(defaultTo);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [sourceStoreId, setSourceStoreId] = useState("");
  const [destStoreId, setDestStoreId] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const { items: inventoryItems } = useInventory({ page: 1, limit: 200 });
  const { stores: myStores, isLoading: myStoresLoading } = useMyStores({
    page: 1,
    limit: 100,
  });
  const { stores: allActiveStores } = useStores({
    status: "Active",
    page: 1,
    limit: 200,
  });
  const { toast } = useToast();

  const { transfers, createTransfer, isCreating, isLoading } = useStoreTransfers({
    itemId: filterItemId || undefined,
    sourceStoreId: filterSourceId || undefined,
    destStoreId: filterDestId || undefined,
    status: filterStatus === "all" ? undefined : filterStatus,
    transactionDateFrom: transactionDateFrom || undefined,
    transactionDateTo: transactionDateTo || undefined,
    page,
    limit,
  });

  const destOptions = useMemo(() => {
    return allActiveStores.filter((s) => s.id !== sourceStoreId);
  }, [allActiveStores, sourceStoreId]);

  const addLine = () => {
    setLineItems((prev) => [...prev, { itemId: "", qty: 1 }]);
  };

  const updateLine = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const removeLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSourceChange = (id: string) => {
    setSourceStoreId(id);
    if (destStoreId === id) setDestStoreId("");
  };

  const saveTransfer = async () => {
    if (!sourceStoreId || !destStoreId) {
      toast({
        title: "Error",
        description: "Select both a source store and a destination store.",
        variant: "destructive",
      });
      return;
    }
    if (sourceStoreId === destStoreId) {
      toast({
        title: "Error",
        description: "Source and destination stores must be different.",
        variant: "destructive",
      });
      return;
    }
    const valid = lineItems.filter((r) => r.itemId && r.qty > 0);
    if (valid.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one item with quantity greater than zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransfer({
        sourceStoreId,
        destStoreId,
        items: valid.map((r) => ({ itemId: r.itemId, qty: Number(r.qty) })),
        notes: notes.trim() || undefined,
        transactionDate,
      });
      setLineItems([]);
      setNotes("");
    } catch {
      /* toast from hook */
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8" />
            Store item transfer
          </h1>
          <p className="text-muted-foreground mt-1">
            Move inventory out of a store you manage or have access to, into any
            active destination store.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <Label>Source store</Label>
              <Combobox
                value={filterSourceId}
                onValueChange={(v) => {
                  setFilterSourceId(v);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All (sources)" },
                  ...myStores.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                placeholder="All sources"
                searchPlaceholder="Search…"
              />
            </div>
            <div>
              <Label>Destination store</Label>
              <Combobox
                value={filterDestId}
                onValueChange={(v) => {
                  setFilterDestId(v);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All (destinations)" },
                  ...allActiveStores.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                placeholder="All destinations"
                searchPlaceholder="Search…"
              />
            </div>
            <div>
              <Label>Item</Label>
              <Combobox
                value={filterItemId}
                onValueChange={(v) => {
                  setFilterItemId(v);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All items" },
                  ...inventoryItems.map((it) => ({
                    value: it.id,
                    label: it.name,
                  })),
                ]}
                placeholder="All items"
                searchPlaceholder="Search items..."
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From date</Label>
              <Input
                type="date"
                value={transactionDateFrom}
                onChange={(e) => {
                  setTransactionDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Label>To date</Label>
              <Input
                type="date"
                value={transactionDateTo}
                onChange={(e) => {
                  setTransactionDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Page</Label>
                <Input
                  type="number"
                  min={1}
                  value={page}
                  onChange={(e) =>
                    setPage(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                />
              </div>
              <div>
                <Label>Limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) =>
                    setLimit(Math.max(1, parseInt(e.target.value, 10) || 20))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>New transfer</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
            {lineItems.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={saveTransfer}
                disabled={
                  isCreating ||
                  !sourceStoreId ||
                  !destStoreId ||
                  myStores.length === 0
                }
              >
                <Save className="mr-2 h-4 w-4" />
                Submit transfer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>From (your stores)</Label>
              {myStoresLoading ? (
                <p className="text-sm text-muted-foreground py-2">Loading…</p>
              ) : myStores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No stores assigned to your account. Ask an admin to grant store
                  access or assign you as manager.
                </p>
              ) : (
                <Combobox
                  value={sourceStoreId}
                  onValueChange={handleSourceChange}
                  options={myStores.map((s) => ({
                    value: s.id,
                    label: `${s.name}${s.isStoreManager ? " (manager)" : ""}`,
                  }))}
                  placeholder="Select source store…"
                  searchPlaceholder="Search…"
                />
              )}
            </div>
            <div>
              <Label>To (any active store)</Label>
              <Combobox
                value={destStoreId}
                onValueChange={setDestStoreId}
                options={destOptions.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                placeholder={
                  sourceStoreId
                    ? "Select destination store…"
                    : "Choose source first"
                }
                searchPlaceholder="Search stores…"
              />
              {sourceStoreId && destOptions.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No other active stores available as destination.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Transaction date</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Add one or more items and quantities to transfer out of the source
              store.
            </p>
          ) : (
            <div className="space-y-4">
              {lineItems.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg items-end"
                >
                  <div className="md:col-span-7">
                    <Label>Item</Label>
                    <Combobox
                      value={row.itemId}
                      onValueChange={(v) => updateLine(index, "itemId", v)}
                      options={inventoryItems.map((it) => ({
                        value: it.id,
                        label: `${it.name}${it.sku ? ` — ${it.sku}` : ""}`,
                      }))}
                      placeholder="Select item…"
                      searchPlaceholder="Search…"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={row.qty}
                      onChange={(e) =>
                        updateLine(
                          index,
                          "qty",
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeLine(index)}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer history ({transfers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transfers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transfers match your filters.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t, idx) => (
                    <TableRow
                      key={`${t.referenceNo}-${t.outTransactionId ?? ""}-${t.inTransactionId ?? ""}-${idx}`}
                    >
                      <TableCell>
                        <Badge variant="outline">{t.referenceNo}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {t.transactionDate
                          ? new Date(t.transactionDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>{t.item?.name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.quantity}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {t.sourceStore?.name ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {t.destStore?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.createdByName ?? "—"}
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
