import { useState } from "react"
import { Plus, Save, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStudentCollections, type StudentCollection } from "@/hooks/useStudentCollections"
import { useClasses } from "@/hooks/useClasses"
import { useInventory } from "@/hooks/useInventory"
import { useSessions } from "@/hooks/useSessions"
import { useStudents } from "@/hooks/useStudents"
import { useSubClasses } from "@/hooks/useSubClasses"
import { useTerms } from "@/hooks/useTerms"
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

interface NewCollectionItem {
  itemId: string
  qtyOut: number
  itemName?: string
}

export default function StudentItemCollections() {
  const [filterStudentId, setFilterStudentId] = useState<string>("")
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSubClassId, setSelectedSubClassId] = useState<string>("")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(20)

  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState<string>("")
  const [newItems, setNewItems] = useState<NewCollectionItem[]>([])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null)

  const { collections, createBulkCollection, deleteCollection, isLoading } = useStudentCollections({
    studentId: filterStudentId || undefined,
    classId: selectedClassId || undefined,
    subclassId: selectedSubClassId || undefined,
    sessionId: selectedSessionId || undefined,
    termId: selectedTermId || undefined,
    page,
    limit,
  })
  const { classes } = useClasses()
  const { items } = useInventory()
  const { sessions } = useSessions({ status: 'active' })
  const { subClasses } = useSubClasses({ page: 1, limit: 500 })
  const { terms } = useTerms({ page: 1, limit: 200, status: "Active" })
  const { students: classStudents, isLoading: studentsLoading } = useStudents({
    classId: selectedClassId || undefined,
    subClassId: selectedSubClassId || undefined,
    status: "Active",
    page: 1,
    limit: 500,
  })
  const { students: allStudents, isLoading: allStudentsLoading } = useStudents({
    status: "Active",
    classId: selectedClassId || undefined,
    subClassId: selectedSubClassId || undefined,
    page: 1,
    limit: 500,
  })
  const { toast } = useToast()

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSession = sessions.find(s => s.id === selectedSessionId)
  const selectedTerm = terms.find(t => t.id === selectedTermId)
  const filteredSubClasses = selectedClassId
    ? subClasses.filter(sc => sc.classId === selectedClassId)
    : subClasses

  const addNewItemRow = () => {
    setNewItems(prev => [
      ...prev,
      {
        itemId: "",
        qtyOut: 1,
      },
    ])
  }

  const updateNewItem = (
    index: number,
    field: keyof NewCollectionItem,
    value: string | number
  ) => {
    setNewItems(prev =>
      prev.map((row, i) => {
        if (i !== index) return row
        const updated = { ...row, [field]: value } as NewCollectionItem
        if (field === "itemId") {
          const inventoryItem = items.find(it => it.id === value)
          updated.itemName = inventoryItem?.name
        }
        return updated
      })
    )
  }

  const removeNewItem = (index: number) => {
    setNewItems(prev => prev.filter((_, i) => i !== index))
  }

  const saveBatch = async () => {
    if (!selectedClassId) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive"
      })
      return
    }

    if (!selectedStudentId) {
      toast({
        title: "Error",
        description: "Please select a student first",
        variant: "destructive"
      })
      return
    }

    const validItems = newItems.filter(it => it.itemId && it.qtyOut > 0)
    if (validItems.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one valid item",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Saving...",
      description: "Please wait while we save the collection batch",
    });
    
    try {
      await createBulkCollection({
        studentId: selectedStudentId,
        notes: notes?.trim() ? notes.trim() : undefined,
        transactionDate,
        items: validItems.map(it => ({ itemId: it.itemId, qtyOut: it.qtyOut })),
      })
      toast({
        title: "Success",
        description: "Collection batch added successfully",
      });
      setNewItems([])
      setNotes("")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add collection batch: " + (err as any).message,
        variant: "destructive",
      });
    }
  }

  const handleDelete = (id: string) => {
    setCollectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (collectionToDelete) {
      try {
        await deleteCollection(collectionToDelete);
        setCollectionToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setCollectionToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const groupedBatches = collections.reduce((acc, row) => {
    const studentId = row.studentId ?? "unknown-student"
    const ref = row.referenceNo ?? row.id
    const key = `${studentId}::${ref}`

    if (!acc.has(key)) {
      acc.set(key, {
        studentId,
        studentName: row.studentName || "Unknown Student",
        admissionNumber: row.students?.admission_number,
        referenceNo: row.referenceNo,
        notes: row.notes,
        transactionDate: row.transactionDate,
        rows: [] as StudentCollection[],
      })
    }
    acc.get(key)!.rows.push(row)
    return acc
  }, new Map<string, {
    studentId: string
    studentName: string
    admissionNumber?: string
    referenceNo: string | null
    notes: string | null
    transactionDate: string
    rows: StudentCollection[]
  }>());

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Item Collections</h1>
          <p className="text-muted-foreground">Track individual student inventory distributions</p>
        </div>
        <Users className="h-8 w-8 text-primary" />
      </div>

      {/* Class and Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Filters (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <Label>Class</Label>
              <Combobox
                value={selectedClassId}
                onValueChange={(v) => {
                  setSelectedClassId(v)
                  // When class changes, reset subclass (since it's dependent)
                  setSelectedSubClassId("")
                  setPage(1)
                }}
                options={[
                  { value: "", label: "All classes" },
                  ...classes.map((class_) => ({
                    value: class_.id,
                    label: `${class_.name}  (${class_.totalStudents} students)`,
                  })),
                ]}
                placeholder="All classes"
                searchPlaceholder="Search classes..."
              />
            </div>
            
            <div>
              <Label>Sub class</Label>
              <Combobox
                value={selectedSubClassId}
                onValueChange={(v) => {
                  setSelectedSubClassId(v)
                  setPage(1)
                }}
                options={[
                  { value: "", label: "All sub classes" },
                  ...filteredSubClasses.map((sc) => ({
                    value: sc.id,
                    label: sc.name,
                  })),
                ]}
                placeholder="All sub classes"
                searchPlaceholder="Search sub classes..."
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
                    label: `${session.name} - ${session.session}`,
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
              <Label>Student</Label>
              <Combobox
                value={filterStudentId}
                onValueChange={(v) => {
                  setFilterStudentId(v)
                  setPage(1)
                }}
                options={[
                  { value: "", label: "All students" },
                  ...(allStudentsLoading ? [] : allStudents.map((student) => ({
                    value: student.id,
                    label: `${student.firstName} ${student.lastName} - ${student.admissionNumber}`,
                  }))),
                ]}
                placeholder={allStudentsLoading ? "Loading students..." : "All students"}
                searchPlaceholder="Search students..."
                disabled={allStudentsLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Page</Label>
                <Input
                  type="number"
                  min="1"
                  value={page}
                  onChange={(e) => setPage(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <Label>Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 20))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* {selectedClassId && ( */}
        <>
          {/* Add New Collection Batch */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Add New Collections for {selectedClass?.name}
                {selectedSession ? ` - ${selectedSession.name}` : ""}
                {selectedTerm ? ` - ${selectedTerm.name}` : ""}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>Student</Label>
                  <Combobox
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                    options={studentsLoading ? [] : classStudents.map((student) => ({
                      value: student.id,
                      label: `${student.firstName} ${student.lastName} - ${student.admissionNumber}`
                    }))}
                    placeholder={studentsLoading ? "Loading students..." : "Select student..."}
                    searchPlaceholder="Search students..."
                    disabled={studentsLoading}
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
                  <p className="text-muted-foreground">Click "Add Item" to start building a batch for the selected student</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newItems.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div className="md:col-span-2">
                        <Label>Item</Label>
                        <Combobox
                          value={row.itemId}
                          onValueChange={(value) => updateNewItem(index, 'itemId', value)}
                          options={items.map((inventoryItem) => ({
                            value: inventoryItem.id,
                            label: `${inventoryItem.name} - ${inventoryItem.category}`
                          }))}
                          placeholder="Select item..."
                          searchPlaceholder="Search items..."
                        />
                      </div>
                      
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={row.qtyOut}
                          onChange={(e) => updateNewItem(index, 'qtyOut', parseInt(e.target.value) || 1)}
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

          {/* Existing Collections */}
          <Card>
            <CardHeader>
              <CardTitle>Current Collections ({collections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No collections found</h3>
                  <p className="text-muted-foreground">Add student item collections using the form above.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(groupedBatches.entries()).map(([key, batch]) => (
                      <TableRow key={key}>
                        <TableCell>
                          <div className="font-medium">{batch.studentName}</div>
                          <Badge variant="secondary" className="text-xs">
                            {batch.admissionNumber || batch.studentId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {batch.referenceNo ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {batch.transactionDate
                            ? new Date(batch.transactionDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {batch.rows.map(r => (
                              <div key={r.id} className="flex items-center justify-between gap-3">
                                <span className="text-sm">{r.itemName}</span>
                                <Badge variant="outline" className="shrink-0">
                                  {r.qtyOut}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate">
                          {batch.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {batch.rows.map(r => (
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
        </>
      {/* )} */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student collection record.
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

