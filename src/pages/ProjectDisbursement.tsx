import { useMemo, useState } from "react"
import { Plus, Save, Trash2, PackageMinus, FileBarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useProjectCollections,
  type ProjectCollection,
} from "@/hooks/useProjectCollections"
import { useInventory } from "@/hooks/useInventory"
import { useSchoolSessions } from "@/hooks/useSchoolSessions"
import { useTerms } from "@/hooks/useTerms"
import { useProjects } from "@/hooks/useProjects"
import { useStaff } from "@/hooks/useStaff"
import { useMyStores } from "@/hooks/useMyStores"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NewLineItem {
  itemId: string
  qtyOut: number
  itemName?: string
}

export default function ProjectDisbursement() {
  const today = useMemo(() => new Date(), [])
  const defaultTo = today.toISOString().slice(0, 10)
  const defaultFrom = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10)

  const [filterItemId, setFilterItemId] = useState<string>("")
  const [filterProjectId, setFilterProjectId] = useState<string>("")
  const [filterStaffId, setFilterStaffId] = useState<string>("")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [transactionDateFrom, setTransactionDateFrom] = useState<string>(defaultFrom)
  const [transactionDateTo, setTransactionDateTo] = useState<string>(defaultTo)
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(20)

  const [storeId, setStoreId] = useState<string>("")
  const [projectId, setProjectId] = useState<string>("")
  const [staffId, setStaffId] = useState<string>("")
  const [referenceNo, setReferenceNo] = useState<string>("")
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState<string>("")
  const [newItems, setNewItems] = useState<NewLineItem[]>([])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null)

  const { items: filterItems } = useInventory({ page: 1, limit: 500 })
  const { items: storeItems, isLoading: storeItemsLoading } = useInventory({
    storeId: storeId || undefined,
    page: 1,
    limit: 500,
    enabled: !!storeId,
  })
  const { sessions } = useSchoolSessions({ status: "Active", page: 1, limit: 500 })
  const { terms } = useTerms({ page: 1, limit: 200, status: "Active" })
  const { projects } = useProjects({ page: 1, limit: 500 })
  const { staff } = useStaff({ page: 1, limit: 500 })
  const { stores: myStores, isLoading: myStoresLoading } = useMyStores({
    page: 1,
    limit: 100,
  })
  const { toast } = useToast()

  const {
    projectCollections,
    createBulkProjectCollections,
    deleteProjectCollection,
    isLoading,
  } = useProjectCollections({
    itemId: filterItemId || undefined,
    projectId: filterProjectId || undefined,
    staffId: filterStaffId || undefined,
    sessionId: selectedSessionId || undefined,
    termId: selectedTermId || undefined,
    transactionDateFrom: transactionDateFrom || undefined,
    transactionDateTo: transactionDateTo || undefined,
    page,
    limit,
  })

  const staffLabel = (s: {
    id: string
    name?: string | null
    StaffNumber?: string | null
    email?: string | null
  }) =>
    [s.name].filter(Boolean).join(" ") || s.id

  const getItemOptionsForRow = (rowIndex: number) => {
    const selectedElsewhere = new Set(
      newItems
        .filter((_, i) => i !== rowIndex)
        .map((row) => row.itemId)
        .filter(Boolean)
    )
    return storeItems
      .filter(
        (inventoryItem) =>
          !selectedElsewhere.has(inventoryItem.id) ||
          newItems[rowIndex]?.itemId === inventoryItem.id
      )
      .map((inventoryItem) => ({
        value: inventoryItem.id,
        label: `${inventoryItem.name} - ${inventoryItem.category?.name} - ${inventoryItem.currentStock}`,
      }))
  }

  const getItemCurrentStock = (itemId: string) => {
    const item = storeItems.find((it) => it.id === itemId)
    return Number(item?.currentStock ?? 0)
  }

  const rowExceedsStoreStock = (row: NewLineItem) => {
    if (!row.itemId || row.qtyOut <= 0) return false
    return row.qtyOut > getItemCurrentStock(row.itemId)
  }

  const handleStoreChange = (id: string) => {
    setStoreId(id)
    setNewItems([])
  }

  const addNewItemRow = () => {
    setNewItems((prev) => [
      ...prev,
      {
        itemId: "",
        qtyOut: 1,
      },
    ])
  }

  const updateNewItem = (
    index: number,
    field: keyof NewLineItem,
    value: string | number
  ) => {
    setNewItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        const updated = { ...row, [field]: value } as NewLineItem
        if (field === "itemId") {
          const inventoryItem = storeItems.find((it) => it.id === value)
          updated.itemName = inventoryItem?.name
        }
        return updated
      })
    )
  }

  const removeNewItem = (index: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index))
  }

  const saveBatch = async () => {
    if (!storeId) {
      toast({
        title: "Error",
        description: "Please select a store first",
        variant: "destructive",
      })
      return
    }
    if (!projectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      })
      return
    }
    if (!staffId) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive",
      })
      return
    }

    const validItems = newItems.filter((it) => it.itemId && it.qtyOut > 0)
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid item",
        variant: "destructive",
      })
      return
    }

    const itemIds = validItems.map((it) => it.itemId)
    if (new Set(itemIds).size !== itemIds.length) {
      toast({
        title: "Error",
        description: "Each item can only appear once in a batch.",
        variant: "destructive",
      })
      return
    }

    if (validItems.some(rowExceedsStoreStock)) {
      toast({
        title: "Error",
        description:
          "One or more lines exceed available stock at the selected store.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Saving...",
      description: "Please wait while we save the disbursement batch",
    })

    try {
      await createBulkProjectCollections({
        notes: notes?.trim() ? notes.trim() : undefined,
        projectId,
        staffId,
        storeId,
        referenceNo: referenceNo?.trim() ? referenceNo.trim() : undefined,
        transactionDate,
        items: validItems.map((it) => ({ itemId: it.itemId, qtyOut: it.qtyOut })),
      })
      toast({
        title: "Success",
        description: "Project disbursement recorded successfully",
      })
      setNewItems([])
      setNotes("")
      setReferenceNo("")
    } catch (err) {
      toast({
        title: "Error",
        description:
          "Failed to record disbursement batch: " + (err as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = (id: string) => {
    setCollectionToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!collectionToDelete) return
    try {
      await deleteProjectCollection(collectionToDelete)
      setCollectionToDelete(null)
      setDeleteDialogOpen(false)
    } catch {
      setCollectionToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const groupedBatches = projectCollections.reduce((acc, row) => {
    const ref = row.referenceNo ?? row.id
    const key = ref

    if (!acc.has(key)) {
      acc.set(key, {
        referenceNo: row.referenceNo,
        notes: row.notes,
        transactionDate: row.transactionDate,
        createdByName: row.createdByName,
        projectName: row.projectName,
        staffLabel: row.staffLabel,
        storeName: row.storeName,
        rows: [] as ProjectCollection[],
      })
    }
    acc.get(key)!.rows.push(row)
    return acc
  }, new Map<string, {
    referenceNo: string | null
    notes: string | null
    transactionDate: string
    createdByName?: string
    projectName?: string
    staffLabel?: string
    storeName?: string
    rows: ProjectCollection[]
  }>())

  const selectedStoreForEntry = myStores.find((s) => s.id === storeId)
  const selectedProjectForEntry = projects.find((p) => p.id === projectId)
  const selectedStaffForEntry = staff.find((s) => s.id === staffId)

  const entryTitleSuffix = [
    selectedStoreForEntry?.name,
    selectedProjectForEntry?.name,
    selectedStaffForEntry ? staffLabel(selectedStaffForEntry) : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project disbursement</h1>
          <p className="text-muted-foreground">
            Issue inventory to projects in bulk (qty out), linked to a receiving staff member
          </p>
        </div>
        <PackageMinus className="h-8 w-8 text-primary" />
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Record disbursement batch
                {entryTitleSuffix ? ` — ${entryTitleSuffix}` : ""}
              </CardTitle>
              {newItems.length > 0 && (
                <Button onClick={saveBatch} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save Batch
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>Store (your stores)</Label>
                  {myStoresLoading ? (
                    <p className="text-sm text-muted-foreground py-2">Loading stores…</p>
                  ) : myStores.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No stores assigned to your account. Ask an admin to grant store access.
                    </p>
                  ) : (
                    <Combobox
                      value={storeId}
                      onValueChange={handleStoreChange}
                      options={myStores.map((s) => ({
                        value: s.id,
                        label: `${s.name}${s.isStoreManager ? " (manager)" : ""}`,
                      }))}
                      placeholder="Select store..."
                      searchPlaceholder="Search stores..."
                    />
                  )}
                </div>
                <div>
                  <Label>Project</Label>
                  <Combobox
                    value={projectId}
                    onValueChange={setProjectId}
                    options={projects.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    placeholder="Select project..."
                    searchPlaceholder="Search projects..."
                  />
                </div>
                <div>
                  <Label>Receiving staff</Label>
                  <Combobox
                    value={staffId}
                    onValueChange={setStaffId}
                    options={staff.map((s) => ({
                      value: s.id,
                      label: staffLabel(s),
                    }))}
                    placeholder="Select staff..."
                    searchPlaceholder="Search staff..."
                  />
                </div>
                <div>
                  <Label>Reference no. (optional)</Label>
                  <Input
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="Optional reference..."
                  />
                </div>
                <div>
                  <Label>Transaction Date</Label>
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

              {!storeId ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select a store to load items available for disbursement.
                  </p>
                </div>
              ) : newItems.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    {storeItemsLoading
                      ? "Loading store inventory…"
                      : "Add line items to build a disbursement batch for the selected project."}
                  </p>
                  <Button
                    onClick={addNewItemRow}
                    variant="outline"
                    disabled={storeItemsLoading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {newItems.map((row, index) => {
                    const availableStock = row.itemId
                      ? getItemCurrentStock(row.itemId)
                      : 0
                    const exceedsStock = rowExceedsStoreStock(row)

                    return (
                    <div
                      key={index}
                      className={cn(
                        "grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg",
                        exceedsStock && "border-destructive bg-destructive/5"
                      )}
                    >
                      <div className="md:col-span-2">
                        <Label>Item</Label>
                        <Combobox
                          value={row.itemId}
                          onValueChange={(value) => updateNewItem(index, "itemId", value)}
                          options={getItemOptionsForRow(index)}
                          placeholder={
                            storeItemsLoading ? "Loading items…" : "Select item..."
                          }
                          searchPlaceholder="Search items..."
                          emptyText={
                            storeItemsLoading
                              ? "Loading items…"
                              : "No items available (already used in this batch)"
                          }
                          disabled={storeItemsLoading}
                        />
                      </div>
                      <div>
                        <Label>Qty Out</Label>
                        <Input
                          type="number"
                          min="1"
                          value={row.qtyOut}
                          className={cn(
                            exceedsStock && "border-destructive focus-visible:ring-destructive"
                          )}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value, 10)
                            updateNewItem(
                              index,
                              "qtyOut",
                              Number.isNaN(parsed) ? 1 : parsed
                            )
                          }}
                        />
                        {row.itemId && (
                          <p
                            className={cn(
                              "text-xs mt-1",
                              exceedsStock
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {exceedsStock
                              ? `Exceeds store stock — available: ${availableStock}`
                              : `Available in store: ${availableStock}`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-end gap-2">
                        <Button
                          onClick={() => removeNewItem(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {index === newItems.length - 1 && (
                          <Button onClick={addNewItemRow} variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        )}
                      </div>
                    </div>
                    )
                  })}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      ...filterItems.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })),
                    ]}
                    placeholder="All items"
                    searchPlaceholder="Search items..."
                  />
                </div>
                <div>
                  <Label>Project</Label>
                  <Combobox
                    value={filterProjectId}
                    onValueChange={(v) => {
                      setFilterProjectId(v)
                      setPage(1)
                    }}
                    options={[
                      { value: "", label: "All projects" },
                      ...projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                      })),
                    ]}
                    placeholder="All projects"
                    searchPlaceholder="Search projects..."
                  />
                </div>
                <div>
                  <Label>Staff</Label>
                  <Combobox
                    value={filterStaffId}
                    onValueChange={(v) => {
                      setFilterStaffId(v)
                      setPage(1)
                    }}
                    options={[
                      { value: "", label: "All staff" },
                      ...staff.map((s) => ({
                        value: s.id,
                        label: staffLabel(s),
                      })),
                    ]}
                    placeholder="All staff"
                    searchPlaceholder="Search staff..."
                  />
                </div>
                <div>
                  <Label>Session</Label>
                  <Combobox
                    value={selectedSessionId}
                    onValueChange={(v) => {
                      setSelectedSessionId(v)
                      setPage(1)
                    }}
                    options={[
                      { value: "", label: "All sessions" },
                      ...sessions.map((session) => ({
                        value: session.id,
                        label: session.name,
                      })),
                    ]}
                    placeholder="All sessions"
                    searchPlaceholder="Search sessions..."
                  />
                </div>
                <div>
                  <Label>Term</Label>
                  <Combobox
                    value={selectedTermId}
                    onValueChange={(v) => {
                      setSelectedTermId(v)
                      setPage(1)
                    }}
                    options={[
                      { value: "", label: "All terms" },
                      ...terms.map((t) => ({
                        value: t.id,
                        label: t.name,
                      })),
                    ]}
                    placeholder="All terms"
                    searchPlaceholder="Search terms..."
                  />
                </div>
                <div>
                  <Label>Transaction Date From</Label>
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
                  <Label>Transaction Date To</Label>
                  <Input
                    type="date"
                    value={transactionDateTo}
                    onChange={(e) => {
                      setTransactionDateTo(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 md:col-span-1">
                  <div>
                    <Label>Page</Label>
                    <Input
                      type="number"
                      min="1"
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
                      min="1"
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
              <CardTitle>Project collections ({projectCollections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : projectCollections.length === 0 ? (
                <div className="text-center py-8">
                  <PackageMinus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No project collections found</h3>
                  <p className="text-muted-foreground">
                    Record disbursements on the New entry tab or adjust filters.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(groupedBatches.entries()).map(([key, batch]) => (
                      <TableRow key={key}>
                        <TableCell>
                          <Badge variant="outline">{batch.referenceNo ?? "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          {batch.transactionDate
                            ? new Date(batch.transactionDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">
                          {batch.storeName ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {batch.projectName ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm">
                          {batch.staffLabel ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {batch.rows.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center gap-2 min-w-0"
                              >
                                <span className="text-sm flex-1 min-w-0 truncate">
                                  {r.itemName}
                                </span>
                                <Badge variant="outline" className="shrink-0">
                                  {r.qtyOut} out
                                </Badge>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete this item"
                                  onClick={() => handleDelete(r.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {batch.notes || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {batch.createdByName || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this project collection line.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
