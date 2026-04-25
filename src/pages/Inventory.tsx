import { Package, Plus, Search, Edit, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInventory } from "@/hooks/useInventory"
import { InventoryDialog } from "@/components/dialogs/InventoryDialog"
import { useState } from "react"
import type { UpdateInventoryItemBody } from "@/lib/api"
import { Combobox } from "@/components/ui/combobox"
import { useCategories } from "@/hooks/useCategories"
import { useSubCategories } from "@/hooks/useSubCategories"
import { useBrands } from "@/hooks/useBrands"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export default function Inventory() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"All" | "Active" | "Inactive">("All")
  const [categoryId, setCategoryId] = useState<string>("")
  const [subCategoryId, setSubCategoryId] = useState<string>("")
  const [brandId, setBrandId] = useState<string>("")

  const { categories } = useCategories()
  const { subCategories } = useSubCategories({
    categoryId: categoryId || undefined,
  })
  const { brands } = useBrands()

  const { items, addItem, updateItem, deleteItem } = useInventory({
    q,
    status,
    categoryId: categoryId || undefined,
    subCategoryId: subCategoryId || undefined,
    brandId: brandId || undefined,
    page: 1,
    limit: 100,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const getStatusBadge = (currentStock: string | number, threshold: number) => {
    if (Number(currentStock) <= threshold) {
      return <Badge variant="destructive">Low Stock</Badge>
    }
    return <Badge variant="secondary" className="bg-success/10 text-success">In Stock</Badge>
  }

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: any) => {
    setDialogMode('edit')
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleView = (item: any) => {
    setDialogMode('view')
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem(itemToDelete);
        setItemToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setItemToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      const { status: _status, ...createData } = data || {}
      await addItem(createData);
    } else if (dialogMode === 'edit') {
      const payload: UpdateInventoryItemBody = {
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        brandId: data.brandId,
        uomId: data.uomId,
        barcode: data.barcode,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        lowStockThreshold: data.lowStockThreshold,
        status: data.status,
      }
      await updateItem(selectedItem.id, payload);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-8 w-8" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your school bookstore inventory items
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search inventory items..." 
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-full sm:w-[220px]">
          <Combobox
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v)
              setSubCategoryId("")
            }}
            options={[
              { value: "", label: "All" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            placeholder="Category"
            searchPlaceholder="Search categories..."
          />
        </div>

        <div className="w-full sm:w-[220px]">
          <Combobox
            value={subCategoryId}
            onValueChange={(v) => setSubCategoryId(v)}
            options={[
              { value: "", label: "All" },
              ...subCategories.map((sc) => ({ value: sc.id, label: sc.name })),
            ]}
            placeholder="Subcategory"
            searchPlaceholder="Search subcategories..."
          />
        </div>

        <div className="w-full sm:w-[220px]">
          <Combobox
            value={brandId}
            onValueChange={(v) => setBrandId(v)}
            options={[
              { value: "", label: "All" },
              ...brands.map((b) => ({ value: b.id, label: b.name })),
            ]}
            placeholder="Brand"
            searchPlaceholder="Search brands..."
          />
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="shadow-card hover:shadow-elevated transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold mb-1">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku || 'N/A'}</p>
                </div>
                {getStatusBadge(item.currentStock ?? 0, item.lowStockThreshold ?? 0)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{item.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Brand</p>
                  <p className="font-medium">{item.brand?.name || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Stock Level</p>
                  <p className="font-medium text-lg">
                    {item.currentStock ?? 0} {item.uom?.symbol || "units"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selling Price</p>
                  <p className="font-medium text-lg">
                    ₦{Number(item.sellingPrice ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleView(item)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(item)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">
          Load More Items
        </Button>
      </div>

      <InventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        item={selectedItem}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              inventory item and all associated data.
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