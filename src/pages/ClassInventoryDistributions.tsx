import { useState, useMemo } from "react"
import { PackageOpen, Plus, Trash2, Save, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useClassDistributions } from "@/hooks/useClassDistributions"
import { useClasses } from "@/hooks/useClasses"
import { useInventory } from "@/hooks/useInventory"
import { useSchoolSessions } from "@/hooks/useSchoolSessions"
import { useClassTeachers } from "@/hooks/useClassTeachers"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
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

interface NewDistributionRow {
  id: string
  inventory_item_id: string
  distributed_quantity: number
  received_by: string
  notes: string
}

export default function ClassInventoryDistributions() {
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSessionTermId, setSelectedSessionTermId] = useState<string>("")
  const [newRows, setNewRows] = useState<NewDistributionRow[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [distributionToDelete, setDistributionToDelete] = useState<string | null>(null)
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({})

  const { distributions, addDistribution, deleteDistribution } = useClassDistributions({
    class_id: selectedClassId || undefined,
    session_term_id: selectedSessionTermId || undefined,
    page: 1,
    limit: 100
  })
  const { classes } = useClasses()
  const { items } = useInventory()
  const { sessions } = useSchoolSessions({ status: "Active", page: 1, limit: 500 })
  const { classTeachers } = useClassTeachers()

  const toggleCombobox = (rowId: string) => {
    setOpenComboboxes(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }

  const setComboboxOpen = (rowId: string, open: boolean) => {
    setOpenComboboxes(prev => ({
      ...prev,
      [rowId]: open
    }))
  }

  const totalDistributed = distributions.reduce(
    (sum, dist) => sum + (dist.distributed_quantity || 0), 
    0
  )

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSessionTerm = sessions.find(s => s.id === selectedSessionTermId)

  const addNewRow = () => {
    if (!selectedClassId || !selectedSessionTermId) {
      toast.error("Please select class and session term first")
      return
    }
    
    setNewRows([
      ...newRows,
      {
        id: crypto.randomUUID(),
        inventory_item_id: "",
        distributed_quantity: 0,
        received_by: "",
        notes: ""
      }
    ])
  }

  const removeNewRow = (id: string) => {
    setNewRows(newRows.filter(row => row.id !== id))
  }

  const updateNewRow = (id: string, field: keyof NewDistributionRow, value: any) => {
    setNewRows(newRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const saveNewRow = async (row: NewDistributionRow) => {
    if (!row.inventory_item_id || row.distributed_quantity <= 0) {
      toast.error("Please select an inventory item and enter a valid quantity")
      return
    }

    const data = {
      class_id: selectedClassId,
      session_term_id: selectedSessionTermId,
      inventory_item_id: row.inventory_item_id,
      distributed_quantity: row.distributed_quantity,
      distribution_date: new Date().toISOString(),
      received_by: row.received_by || undefined,
      notes: row.notes || undefined
    }

    toast.success("Adding distribution...")
    
    try {
      await addDistribution(data);
      toast.success("Distribution added successfully");
      removeNewRow(row.id);
    } catch (err) {
      toast.error("Failed to add distribution");
    }
  }

  const handleDelete = (id: string) => {
    setDistributionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (distributionToDelete) {
      try {
        await deleteDistribution(distributionToDelete);
        setDistributionToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setDistributionToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <PackageOpen className="h-8 w-8" />
          Class Inventory Distributions
        </h1>
        <p className="text-muted-foreground mt-1">
          Track and manage inventory distributions to classes
        </p>
      </div>

      {/* Class and Session Term Selection */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Select Class and Session Term</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Combobox
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                options={classes.map((classItem) => ({
                  value: classItem.id,
                  label: classItem.name
                }))}
                placeholder="Select class"
                searchPlaceholder="Search classes..."
              />
            </div>

            <div className="space-y-2">
              <Label>Session/Term *</Label>
              <Combobox
                value={selectedSessionTermId}
                onValueChange={setSelectedSessionTermId}
                options={sessions.map((session) => ({
                  value: session.id,
                  label: session.name
                }))}
                placeholder="Select session/term"
                searchPlaceholder="Search sessions..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && selectedSessionTermId && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PackageOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{distributions.length}</p>
                    <p className="text-sm text-muted-foreground">Total Distributions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <PackageOpen className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalDistributed}</p>
                    <p className="text-sm text-muted-foreground">Items Distributed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <PackageOpen className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedClass?.name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{selectedSessionTerm?.name || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Existing Distributions Table */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Existing Distributions</CardTitle>
            </CardHeader>
            <CardContent>
              {distributions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventory Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((distribution) => (
                      <TableRow key={distribution.id}>
                        <TableCell className="font-medium">
                          {distribution.inventory_items?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            {distribution.distributed_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {distribution.distribution_date 
                            ? format(new Date(distribution.distribution_date), "PP")
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {distribution.class_teachers?.name || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {distribution.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(distribution.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No distributions found for this class and session term
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Distributions */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Distribution</CardTitle>
              <Button onClick={addNewRow} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </CardHeader>
            <CardContent>
              {newRows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventory Item *</TableHead>
                      <TableHead>Quantity *</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Combobox
                            value={row.inventory_item_id}
                            onValueChange={(value) => updateNewRow(row.id, 'inventory_item_id', value)}
                            options={items.map((item) => ({
                              value: item.id,
                              label: `${item.name} (Stock: ${item.current_stock})`
                            }))}
                            placeholder="Select item"
                            searchPlaceholder="Search items..."
                            className="w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={row.distributed_quantity || ''}
                            onChange={(e) => updateNewRow(row.id, 'distributed_quantity', parseInt(e.target.value) || 0)}
                            className="w-24"
                            placeholder="Qty"
                          />
                        </TableCell>
                        <TableCell>
                          <Popover open={openComboboxes[row.id] || false} onOpenChange={(open) => setComboboxOpen(row.id, open)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openComboboxes[row.id] || false}
                                className="w-40 justify-between"
                              >
                                {row.received_by 
                                  ? classTeachers.find(t => t.id === row.received_by)?.name || "Unknown teacher"
                                  : "Select teacher..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-0">
                              <Command>
                                <CommandInput placeholder="Search teachers..." />
                                <CommandList>
                                  <CommandEmpty>No teacher found.</CommandEmpty>
                                  <CommandGroup>
                                    {classTeachers.map((teacher) => (
                                      <CommandItem
                                        key={teacher.id}
                                        value={teacher.name}
                                        onSelect={() => {
                                          updateNewRow(row.id, 'received_by', teacher.id)
                                          setComboboxOpen(row.id, false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            row.received_by === teacher.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {teacher.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={row.notes}
                            onChange={(e) => updateNewRow(row.id, 'notes', e.target.value)}
                            className="w-48 min-h-[60px]"
                            placeholder="Optional notes"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm" 
                              onClick={() => saveNewRow(row)}
                              className="bg-gradient-primary"
                            >
                              <Save className="mr-1 h-3 w-3" />
                              Save
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeNewRow(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Add Row" to create a new distribution
                </div>
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
              distribution record and all associated data.
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
