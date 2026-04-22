import { useState } from "react"
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSuppliers, Supplier } from "@/hooks/useSuppliers"
import { SupplierDialog } from "@/components/dialogs/SupplierDialog"
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

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null)

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedSupplier(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setDialogMode('edit')
    setSelectedSupplier(supplier)
    setDialogOpen(true)
  }

  const handleView = (supplier: Supplier) => {
    setDialogMode('view')
    setSelectedSupplier(supplier)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setSupplierToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await deleteSupplier(supplierToDelete);
        setSupplierToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setSupplierToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      try {
        await addSupplier(data);
        setDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
      }
    } else if (dialogMode === 'edit' && selectedSupplier) {
      try {
        await updateSupplier(selectedSupplier.id, data);
        setDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendors</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{supplier.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Contact Name</p>
                <p className="font-medium">{supplier.contact_name || '-'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm">{supplier.email || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm">{supplier.phone || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm">
                  {[supplier.city, supplier.state, supplier.country]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </p>
              </div>

              <div className="flex justify-end space-x-1 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(supplier)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(supplier)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(supplier.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No suppliers found</p>
        </div>
      )}

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        supplier={selectedSupplier}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              supplier and all associated purchase transactions.
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