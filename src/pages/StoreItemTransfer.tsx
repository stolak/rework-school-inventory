import { useMemo, useState } from "react"
import { ArrowLeftRight, Plus, Save, Trash2, FileBarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useInventory } from "@/hooks/useInventory"
import { useMyStores } from "@/hooks/useMyStores"
import { useStores } from "@/hooks/useStores"
import { useStoreTransfers, type StoreTransferRowView } from "@/hooks/useStoreTransfers"
import { useToast } from "@/hooks/use-toast"

interface LineItem {
  itemId: string
  qty: number
}

export default function StoreItemTransfer() {
  const today = useMemo(() => new Date(), [])
  const defaultTo = today.toISOString().slice(0, 10)
  const defaultFrom = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10)

  const [filterItemId, setFilterItemId] = useState("")
  const [filterSourceId, setFilterSourceId] = useState("")
  const [filterDestId, setFilterDestId] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [transactionDateFrom, setTransactionDateFrom] = useState(defaultFrom)
  const [transactionDateTo, setTransactionDateTo] = useState(defaultTo)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [sourceStoreId, setSourceStoreId] = useState("")
  const [destStoreId, setDestStoreId] = useState("")
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  const { items: inventoryItems } = useInventory({ page: 1, limit: 500 })
  const { stores: myStores, isLoading: myStoresLoading } = useMyStores({
    page: 1,
    limit: 100,
  })
  const { stores: allActiveStores } = useStores({
    status: "Active",
    page: 1,
    limit: 200,
  })
  const { toast } = useToast()

  const { transfers, createTransfer, isCreating, isLoading } = useStoreTransfers({
    itemId: filterItemId || undefined,
    sourceStoreId: filterSourceId || undefined,
    destStoreId: filterDestId || undefined,
    status: filterStatus === "all" ? undefined : filterStatus,
    transactionDateFrom: transactionDateFrom || undefined,
    transactionDateTo: transactionDateTo || undefined,
    page,
    limit,
  })

  const destOptions = useMemo(() => {
    return allActiveStores.filter((s) => s.id !== sourceStoreId)
  }, [allActiveStores, sourceStoreId])

  const selectedSourceStore = myStores.find((s) => s.id === sourceStoreId)
  const selectedDestStore = allActiveStores.find((s) => s.id === destStoreId)

  const entryTitleSuffix = [selectedSourceStore?.name, selectedDestStore?.name]
    .filter(Boolean)
    .join(" → ")

  const getItemOptionsForRow = (rowIndex: number) => {
    const selectedElsewhere = new Set(
      lineItems
        .filter((_, i) => i !== rowIndex)
        .map((row) => row.itemId)
        .filter(Boolean)
    )
    return inventoryItems
      .filter(
        (inventoryItem) =>
          !selectedElsewhere.has(inventoryItem.id) ||
          lineItems[rowIndex]?.itemId === inventoryItem.id
      )
      .map((inventoryItem) => ({
        value: inventoryItem.id,
        label: `${inventoryItem.name}${inventoryItem.sku ? ` — ${inventoryItem.sku}` : ""} - ${inventoryItem.currentStock ?? 0}`,
      }))
  }

  const addLine = () => {
    setLineItems((prev) => [...prev, { itemId: "", qty: 1 }])
  }

  const updateLine = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const removeLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSourceChange = (id: string) => {
    setSourceStoreId(id)
    if (destStoreId === id) setDestStoreId("")
  }

  const saveTransfer = async () => {
    if (!sourceStoreId || !destStoreId) {
      toast({
        title: "Error",
        description: "Select both a source store and a destination store.",
        variant: "destructive",
      })
      return
    }
    if (sourceStoreId === destStoreId) {
      toast({
        title: "Error",
        description: "Source and destination stores must be different.",
        variant: "destructive",
      })
      return
    }

    const valid = lineItems.filter((r) => r.itemId && r.qty > 0)
    if (valid.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one item with quantity greater than zero.",
        variant: "destructive",
      })
      return
    }

    const itemIds = valid.map((r) => r.itemId)
    if (new Set(itemIds).size !== itemIds.length) {
      toast({
        title: "Error",
        description: "Each item can only appear once in a transfer.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Submitting...",
      description: "Please wait while we process the store transfer",
    })

    try {
      await createTransfer({
        sourceStoreId,
        destStoreId,
        items: valid.map((r) => ({ itemId: r.itemId, qty: Number(r.qty) })),
        notes: notes.trim() || undefined,
        transactionDate,
      })
      setLineItems([])
      setNotes("")
    } catch {
      /* toast from hook */
    }
  }

  const groupedTransfers = transfers.reduce((acc, row) => {
    const key = row.referenceNo || row.outTransactionId || row.inTransactionId || row.item?.id

    if (!acc.has(key)) {
      acc.set(key, {
        referenceNo: row.referenceNo,
        notes: row.notes,
        transactionDate: row.transactionDate,
        status: row.status,
        sourceName: row.sourceStore?.name,
        destName: row.destStore?.name,
        createdByName: row.createdByName,
        rows: [] as StoreTransferRowView[],
      })
    }
    acc.get(key)!.rows.push(row)
    return acc
  }, new Map<string, {
    referenceNo: string
    notes: string | null
    transactionDate: string
    status: string
    sourceName?: string
    destName?: string
    createdByName?: string
    rows: StoreTransferRowView[]
  }>())

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

      <Tabs defaultValue="entry" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-auto sm:inline-flex">
          <TabsTrigger value="entry" className="gap-2">
            <Plus className="h-4 w-4" />
            New entry
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-2">
            <FileBarChart className="h-4 w-4" />
            Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>
                Record transfer batch
                {entryTitleSuffix ? ` — ${entryTitleSuffix}` : ""}
              </CardTitle>
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
                    disabled={!sourceStoreId}
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
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              {lineItems.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    Add line items to transfer out of the selected source store.
                  </p>
                  <Button type="button" onClick={addLine} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                    >
                      <div className="md:col-span-2">
                        <Label>Item</Label>
                        <Combobox
                          value={row.itemId}
                          onValueChange={(v) => updateLine(index, "itemId", v)}
                          options={getItemOptionsForRow(index)}
                          placeholder="Select item…"
                          searchPlaceholder="Search…"
                          emptyText="No items available (already used in this transfer)"
                        />
                      </div>
                      <div>
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
                      <div className="flex flex-col items-end justify-end gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLine(index)}
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {index === lineItems.length - 1 && (
                          <Button
                            type="button"
                            onClick={addLine}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Source store</Label>
                  <Combobox
                    value={filterSourceId}
                    onValueChange={(v) => {
                      setFilterSourceId(v)
                      setPage(1)
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
                      setFilterDestId(v)
                      setPage(1)
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
                      setFilterItemId(v)
                      setPage(1)
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
                      setFilterStatus(v)
                      setPage(1)
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
                      setTransactionDateFrom(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <div>
                  <Label>To date</Label>
                  <Input
                    type="date"
                    value={transactionDateTo}
                    onChange={(e) => {
                      setTransactionDateTo(e.target.value)
                      setPage(1)
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
            <CardHeader>
              <CardTitle>Transfer history ({transfers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowLeftRight className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No transfers found</h3>
                  <p className="text-muted-foreground">
                    Record transfers on the New entry tab or adjust filters.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(groupedTransfers.entries()).map(([key, batch]) => (
                        <TableRow key={key}>
                          <TableCell>
                            <Badge variant="outline">{batch.referenceNo}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {batch.transactionDate
                              ? new Date(batch.transactionDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-[140px] truncate">
                            {batch.sourceName ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[140px] truncate">
                            {batch.destName ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {batch.rows.map((r, idx) => (
                                <div
                                  key={`${r.item?.id}-${idx}`}
                                  className="flex items-center gap-2 min-w-0"
                                >
                                  <span className="text-sm flex-1 min-w-0 truncate">
                                    {r.item?.name ?? "—"}
                                  </span>
                                  <Badge variant="outline" className="shrink-0 tabular-nums">
                                    {r.quantity}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{batch.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {batch.notes || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {batch.createdByName ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
