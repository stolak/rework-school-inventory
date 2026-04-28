import { useState } from "react"
import { Plus, Save, Trash2, Edit, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStudentCollections, type StudentCollection } from "@/hooks/useStudentCollections"
import { useClasses } from "@/hooks/useClasses"
import { useInventory } from "@/hooks/useInventory"
import { useSessions } from "@/hooks/useSessions"
import { useStudents } from "@/hooks/useStudents"
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

interface NewCollection {
  student_id: string
  inventory_item_id: string
  qty: number
  received: boolean
  studentName?: string
  itemName?: string
}

export default function StudentItemCollections() {
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSessionTermId, setSelectedSessionTermId] = useState<string>("")
  const [newCollections, setNewCollections] = useState<NewCollection[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<StudentCollection>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null)

  const { collections, addMultipleCollections, updateCollection, deleteCollection, isLoading } = useStudentCollections({
    class_id: selectedClassId || undefined,
    session_term_id: selectedSessionTermId || undefined
  })
  const { classes } = useClasses()
  const { items } = useInventory()
  const { sessions } = useSessions({ status: 'active' })
  const { students: classStudents, isLoading: studentsLoading } = useStudents({
    classId: selectedClassId || undefined,
    status: "Active",
    page: 1,
    limit: 500,
  })
  const { toast } = useToast()

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSession = sessions.find(s => s.id === selectedSessionTermId)

  const addNewCollectionRow = () => {
    setNewCollections(prev => [...prev, {
      student_id: "",
      inventory_item_id: "",
      qty: 1,
      received: true
    }])
  }

  const updateNewCollection = (index: number, field: keyof NewCollection, value: string | number | boolean) => {
    setNewCollections(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value }
        
        // Populate display names
        if (field === 'student_id') {
          const student = classStudents.find(s => s.id === value)
          updated.studentName = student ? `${student.firstName} ${student.lastName}` : undefined
        }
        if (field === 'inventory_item_id') {
          const inventoryItem = items.find(item => item.id === value)
          updated.itemName = inventoryItem?.name
        }
        
        return updated
      }
      return item
    }))
  }

  const removeNewCollection = (index: number) => {
    setNewCollections(prev => prev.filter((_, i) => i !== index))
  }

  const saveNewCollections = async () => {
    if (!selectedClassId) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive"
      })
      return
    }

    if (!selectedSessionTermId) {
      toast({
        title: "Error",
        description: "Please select a session/term first",
        variant: "destructive"
      })
      return
    }

    const validCollections = newCollections.filter(item => 
      item.student_id && item.inventory_item_id && item.qty > 0
    )

    if (validCollections.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one valid collection",
        variant: "destructive"
      })
      return
    }

    const collectionsToAdd = validCollections.map(item => ({
      student_id: item.student_id,
      class_id: selectedClassId,
      session_term_id: selectedSessionTermId,
      inventory_item_id: item.inventory_item_id,
      qty: item.qty,
      eligible: true, // Always true by default
      received: item.received,
    }))

    toast({
      title: "Saving...",
      description: "Please wait while we save the collections",
    });
    
    try {
      await addMultipleCollections(collectionsToAdd);
      toast({
        title: "Success",
        description: "Collections added successfully",
      });
      // Only clear the form data on successful API response
      setNewCollections([]);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add collections: " + (err as any).message,
        variant: "destructive",
      });
      // Keep the form data when API call fails so user doesn't lose their work
      // setNewCollections([]) is NOT called here
    }
  }

  const startEdit = (collection: StudentCollection) => {
    setEditingId(collection.id)
    setEditForm(collection)
  }

  const saveEdit = async () => {
    if (editingId && editForm) {
      toast({
        title: "Updating...",
        description: "Please wait while we update the collection",
      });
      
      try {
        await updateCollection(editingId, editForm);
        toast({
          title: "Success",
          description: "Collection updated successfully",
        });
        setEditingId(null);
        setEditForm({});
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update collection",
          variant: "destructive",
        });
      }
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
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
          <CardTitle>Select Class and Session/Term</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Class</Label>
              <Combobox
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                options={classes.map((class_) => ({
                  value: class_.id,
                  label: `${class_.name}  (${class_.totalStudents} students)`
                }))}
                placeholder="Choose a class..."
                searchPlaceholder="Search classes..."
              />
            </div>
            <div>
              <Label>Session/Term</Label>
              <Combobox
                value={selectedSessionTermId}
                onValueChange={setSelectedSessionTermId}
                options={sessions.map((session) => ({
                  value: session.id,
                  label: `${session.name} - ${session.session}`
                }))}
                placeholder="Choose a session/term..."
                searchPlaceholder="Search sessions..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && selectedSessionTermId && (
        <>
          {/* Add New Collections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Collections for {selectedClass?.name} - {selectedSession?.name}</CardTitle>
              <div className="space-x-2">
                <Button onClick={addNewCollectionRow} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Row
                </Button>
                {newCollections.length > 0 && (
                  <Button onClick={saveNewCollections} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {newCollections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Click "Add Row" to start adding student collections</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newCollections.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>Student</Label>
                        <Combobox
                          value={item.student_id}
                          onValueChange={(value) => updateNewCollection(index, 'student_id', value)}
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
                        <Label>Item</Label>
                        <Combobox
                          value={item.inventory_item_id}
                          onValueChange={(value) => updateNewCollection(index, 'inventory_item_id', value)}
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
                          value={item.qty}
                          onChange={(e) => updateNewCollection(index, 'qty', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div>
                        <Label>Received</Label>
                        <Select 
                          value={item.received.toString()} 
                          onValueChange={(value) => updateNewCollection(index, 'received', value === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          onClick={() => removeNewCollection(index)} 
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
                      <TableHead>Item</TableHead>
                      <TableHead>Session/Term</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Eligible</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>
                          {editingId === collection.id ? (
                            <Select 
                              value={editForm.student_id} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, student_id: value }))}
                              disabled={studentsLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={studentsLoading ? "Loading students..." : "Select student..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {classStudents.map(student => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.firstName} {student.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div>
                              <div className="font-medium">{collection.studentName}</div>
                              <Badge variant="secondary" className="text-xs">
                                {collection.students?.admission_number || "N/A"}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === collection.id ? (
                            <Select 
                              value={editForm.inventory_item_id} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, inventory_item_id: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map(item => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div>
                              <div className="font-medium">{collection.itemName}</div>
                              <Badge variant="secondary" className="text-xs">
                                {collection.inventory_items?.categories?.name || "Unknown Category"}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === collection.id ? (
                            <Select 
                              value={editForm.session_term_id} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, session_term_id: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sessions.map(session => (
                                  <SelectItem key={session.id} value={session.id}>
                                    {session.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            collection.sessionName
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === collection.id ? (
                            <Input
                              type="number"
                              min="1"
                              value={editForm.qty || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                              className="w-20"
                            />
                          ) : (
                            <Badge variant="outline">{collection.qty}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === collection.id ? (
                            <Select 
                              value={editForm.eligible?.toString() || 'true'} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, eligible: value === 'true' }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={collection.eligible ? "default" : "secondary"}>
                              {collection.eligible ? "Yes" : "No"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === collection.id ? (
                            <Select 
                              value={editForm.received?.toString() || 'true'} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, received: value === 'true' }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={collection.received ? "default" : "secondary"}>
                              {collection.received ? "Yes" : "No"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {editingId === collection.id ? (
                              <>
                                <Button onClick={saveEdit} size="sm" variant="default">
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button onClick={cancelEdit} size="sm" variant="outline">
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button onClick={() => startEdit(collection)} size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleDelete(collection.id)} size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
      )}

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

