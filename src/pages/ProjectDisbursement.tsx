import { useMemo, useState } from "react"
import { Plus, Save, Trash2, PackageMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  useProjectCollections,
  type ProjectCollection,
} from "@/hooks/useProjectCollections"
import { useInventory } from "@/hooks/useInventory"
import { useSchoolSessions } from "@/hooks/useSchoolSessions"
import { useTerms } from "@/hooks/useTerms"
import { useProjects } from "@/hooks/useProjects"
import { useStaff } from "@/hooks/useStaff"
import { useToast } from "@/hooks/use-toast"
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

  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState<string>("")
  const [projectId, setProjectId] = useState<string>("")
  const [staffId, setStaffId] = useState<string>("")
  const [newItems, setNewItems] = useState<NewLineItem[]>([])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null)

  const { items } = useInventory()
  const { sessions } = useSchoolSessions({ status: "Active", page: 1, limit: 500 })
  const { terms } = useTerms({ page: 1, limit: 200, status: "Active" })
  const { projects } = useProjects({ page: 1, limit: 500 })
  const { staff } = useStaff({ page: 1, limit: 500 })
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

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)
  const selectedTerm = terms.find((t) => t.id === selectedTermId)
  const selectedProject = projects.find((p) => p.id === projectId)

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
          const inventoryItem = items.find((it) => it.id === value)
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

    toast({
      title: "Saving...",
      description: "Please wait while we save the disbursement batch",
    })

    try {
      await createBulkProjectCollections({
        notes: notes?.trim() ? notes.trim() : undefined,
        projectId,
        staffId,
        transactionDate,
        items: validItems.map((it) => ({ itemId: it.itemId, qtyOut: it.qtyOut })),
      })
      toast({
        title: "Success",
        description: "Project disbursement recorded successfully",
      })
      setNewItems([])
      setNotes("")
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
    rows: ProjectCollection[]
  }>())

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
                  ...items.map((item) => ({
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
                    label:
                      [s.name, s.StaffNumber, s.email].filter(Boolean).join(" — ") ||
                      s.id,
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Record disbursement batch
            {selectedProject ? ` — ${selectedProject.name}` : ""}
            {selectedSession ? ` — ${selectedSession.name}` : ""}
            {selectedTerm ? ` — ${selectedTerm.name}` : ""}
          </CardTitle>
          <div className="space-x-2">
            <Button onClick={addNewItemRow} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            {newItems.length > 0 && (
              <Button onClick={saveBatch} size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save Batch
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  label:
                    [s.name, s.StaffNumber, s.email].filter(Boolean).join(" — ") ||
                    s.id,
                }))}
                placeholder="Select staff..."
                searchPlaceholder="Search staff..."
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

          {newItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Click &quot;Add Item&quot; to build a disbursement batch (multiple lines allowed).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {newItems.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                >
                  <div className="md:col-span-2">
                    <Label>Item</Label>
                    <Combobox
                      value={row.itemId}
                      onValueChange={(value) => updateNewItem(index, "itemId", value)}
                      options={items.map((inventoryItem) => ({
                        value: inventoryItem.id,
                        label: `${inventoryItem.name}${inventoryItem.category?.name ? ` — ${inventoryItem.category.name}` : ""}`,
                      }))}
                      placeholder="Select item..."
                      searchPlaceholder="Search items..."
                    />
                  </div>

                  <div>
                    <Label>Qty Out</Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.qtyOut}
                      onChange={(e) =>
                        updateNewItem(index, "qtyOut", parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </div>

                  <div className="flex items-end justify-end">
                    <Button
                      onClick={() => removeNewItem(index)}
                      variant="destructive"
                      size="sm"
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
                Record disbursements using the form above or adjust filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Actions</TableHead>
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
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-sm">{r.itemName}</span>
                            <Badge variant="outline" className="shrink-0">
                              {r.qtyOut} out
                            </Badge>
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
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {batch.rows.map((r) => (
                          <Button
                            key={r.id}
                            onClick={() => handleDelete(r.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
