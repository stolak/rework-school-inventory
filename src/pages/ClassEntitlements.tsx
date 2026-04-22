import { useState } from "react"
import { Plus, Save, Trash2, Edit, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useEntitlements, type ClassEntitlement } from "@/hooks/useEntitlements"
import { useClasses } from "@/hooks/useClasses"
import { useInventory } from "@/hooks/useInventory"
import { useSessions } from "@/hooks/useSessions"
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

interface NewEntitlement {
  inventory_item_id: string
  quantity: number
  notes: string
  itemName?: string
}

export default function ClassEntitlements() {
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSessionTermId, setSelectedSessionTermId] = useState<string>("")
  const [newEntitlements, setNewEntitlements] = useState<NewEntitlement[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ClassEntitlement>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entitlementToDelete, setEntitlementToDelete] = useState<string | null>(null)

  const { entitlements, addMultipleEntitlements, updateEntitlement, deleteEntitlement, getEntitlementsByClass, isLoading } = useEntitlements({
    class_id: selectedClassId || undefined,
    session_term_id: selectedSessionTermId || undefined
  })
  const { classes } = useClasses()
  const { items } = useInventory()
  const { sessions } = useSessions({ status: 'active' })
  const { toast } = useToast()

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSession = sessions.find(s => s.id === selectedSessionTermId)
  const classEntitlements = selectedClassId ? getEntitlementsByClass(selectedClassId) : []

  const addNewEntitlementRow = () => {
    setNewEntitlements(prev => [...prev, {
      inventory_item_id: "",
      quantity: 1,
      notes: ""
    }])
  }

  const updateNewEntitlement = (index: number, field: keyof NewEntitlement, value: string | number) => {
    setNewEntitlements(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value }
        
        // Populate display names
        if (field === 'inventory_item_id') {
          const inventoryItem = items.find(item => item.id === value)
          updated.itemName = inventoryItem?.name
        }
        
        return updated
      }
      return item
    }))
  }

  const removeNewEntitlement = (index: number) => {
    setNewEntitlements(prev => prev.filter((_, i) => i !== index))
  }

  const saveNewEntitlements = async () => {
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

    const validEntitlements = newEntitlements.filter(item => 
      item.inventory_item_id && item.quantity > 0
    )

    if (validEntitlements.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one valid entitlement",
        variant: "destructive"
      })
      return
    }

    const entitlementsToAdd = validEntitlements.map(item => ({
      class_id: selectedClassId,
      inventory_item_id: item.inventory_item_id,
      session_term_id: selectedSessionTermId,
      quantity: item.quantity,
      notes: item.notes,
    }))

    toast({
      title: "Saving...",
      description: "Please wait while we save the entitlements",
    });
    
    try {
      await addMultipleEntitlements(entitlementsToAdd);
      toast({
        title: "Success",
        description: "Entitlements added successfully",
      });
      setNewEntitlements([]);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add entitlements",
        variant: "destructive",
      });
    }
  }

  const startEdit = (entitlement: ClassEntitlement) => {
    setEditingId(entitlement.id)
    setEditForm(entitlement)
  }

  const saveEdit = async () => {
    if (editingId && editForm) {
      toast({
        title: "Updating...",
        description: "Please wait while we update the entitlement",
      });
      
      try {
        await updateEntitlement(editingId, editForm);
        toast({
          title: "Success",
          description: "Entitlement updated successfully",
        });
        setEditingId(null);
        setEditForm({});
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update entitlement",
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
    setEntitlementToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (entitlementToDelete) {
      try {
        await deleteEntitlement(entitlementToDelete);
        setEntitlementToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setEntitlementToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Inventory Entitlements</h1>
          <p className="text-muted-foreground">Manage book and inventory allocations for classes</p>
        </div>
        <BookOpen className="h-8 w-8 text-primary" />
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
                  label: session.name + " - " + session.session
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
          {/* Add New Entitlements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Entitlements for {selectedClass?.name} - {selectedSession?.name}</CardTitle>
              <div className="space-x-2">
                <Button onClick={addNewEntitlementRow} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Row
                </Button>
                {newEntitlements.length > 0 && (
                  <Button onClick={saveNewEntitlements} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {newEntitlements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Click "Add Row" to start adding entitlements</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newEntitlements.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>Inventory Item</Label>
                        <Combobox
                          value={item.inventory_item_id}
                          onValueChange={(value) => updateNewEntitlement(index, 'inventory_item_id', value)}
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
                          value={item.quantity}
                          onChange={(e) => updateNewEntitlement(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div>
                        <Label>Notes</Label>
                        <Input
                          value={item.notes}
                          onChange={(e) => updateNewEntitlement(index, 'notes', e.target.value)}
                          placeholder="Optional notes..."
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          onClick={() => removeNewEntitlement(index)} 
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

          {/* Existing Entitlements */}
          <Card>
            <CardHeader>
              <CardTitle>Current Entitlements ({classEntitlements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : classEntitlements.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No entitlements found</h3>
                  <p className="text-muted-foreground">Add inventory entitlements for this class using the form above.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Session/Term</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classEntitlements.map((entitlement) => (
                      <TableRow key={entitlement.id}>
                        <TableCell>
                          {editingId === entitlement.id ? (
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
                              <div className="font-medium">{entitlement.itemName}</div>
                              <Badge variant="secondary" className="text-xs">
                                {entitlement.inventory_items?.categories?.name || 
                                 items.find(i => i.id === entitlement.inventory_item_id)?.category || 
                                 "Unknown Category"}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === entitlement.id ? (
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
                            entitlement.sessionName
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === entitlement.id ? (
                            <Input
                              type="number"
                              min="1"
                              value={editForm.quantity || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                              className="w-20"
                            />
                          ) : (
                            <Badge variant="outline">{entitlement.quantity}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === entitlement.id ? (
                            <Textarea
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                              className="min-h-[60px]"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {entitlement.notes || 'No notes'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {editingId === entitlement.id ? (
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
                                <Button onClick={() => startEdit(entitlement)} size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleDelete(entitlement.id)} size="sm" variant="destructive">
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
              class entitlement record.
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
