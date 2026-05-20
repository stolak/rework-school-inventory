import { Package, Plus, Search, Edit, Eye, Trash2, Layers } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "react-router-dom"
import { InventoryBasicSetupSection } from "@/pages/Categories"

const nairaFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

function formatNaira(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0
  return `₦${nairaFormatter.format(value)}`
}

function inventoryTotalValue(
  currentStock: string | number | undefined,
  costPrice: string | number | undefined
): number {
  return Number(currentStock ?? 0) * Number(costPrice ?? 0)
}

function InventoryItemsTab() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"All" | "Active" | "Inactive">("All")
  const [categoryId, setCategoryId] = useState<string>("")
  const [subCategoryId, setSubCategoryId] = useState<string>("")
  const [brandId, setBrandId] = useState<string>("")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

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
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add")
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
    setDialogMode("add")
    setSelectedItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: any) => {
    setDialogMode("edit")
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleView = (item: any) => {
    setDialogMode("view")
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem(itemToDelete)
        setItemToDelete(null)
        setDeleteDialogOpen(false)
      } catch {
        setItemToDelete(null)
        setDeleteDialogOpen(false)
      }
    }
  }

  const handleSubmit = async (data: any) => {
    if (dialogMode === "add") {
      const { status: _status, ...createData } = data || {}
      await addItem(createData)
    } else if (dialogMode === "edit") {
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
      await updateItem(selectedItem.id, payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-xl">
          Search and filter stock items. Add or edit products linked to your categories, brands,
          and units.
        </p>
        <Button className="bg-gradient-primary shrink-0" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add new item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory items..."
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as "All" | "Active" | "Inactive")}>
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

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const stock = Number(item.currentStock ?? 0)
            const unitCost = Number(item.costPrice ?? 0)
            const totalValue = inventoryTotalValue(stock, unitCost)

            return (
              <Card
                key={item.id}
                className="shadow-card hover:shadow-elevated transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold mb-1">{item.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku || "N/A"}</p>
                    </div>
                    {getStatusBadge(item.currentStock ?? 0, item.lowStockThreshold ?? 0)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{item.category?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Brand</p>
                      <p className="font-medium">{item.brand?.name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock level</p>
                      <p className="font-medium text-lg tabular-nums">
                        {stock} {item.uom?.symbol || "units"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit cost</p>
                      <p className="font-medium text-lg tabular-nums">{formatNaira(unitCost)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total value
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums truncate">
                        {stock.toLocaleString()} × {formatNaira(unitCost)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums text-primary shrink-0">
                      {formatNaira(totalValue)}
                    </p>
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
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-md border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku || "N/A"}</TableCell>
                  <TableCell>{item.category?.name || "N/A"}</TableCell>
                  <TableCell>{item.subCategory?.name || "N/A"}</TableCell>
                  <TableCell>{item.brand?.name || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {item.currentStock ?? 0} {item.uom?.symbol || "units"}
                  </TableCell>
                  <TableCell className="text-right">
                    ₦{Number(item.sellingPrice ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell>{item.status || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">No inventory items found.</p>
      )}

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
              This action cannot be undone. This will permanently delete the inventory item and
              all associated data.
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

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get("tab") === "setup" ? "setup" : "items"

  const handleTabChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === "items") {
          next.delete("tab")
        } else {
          next.set("tab", value)
        }
        return next
      },
      { replace: true }
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-8 w-8" />
          Inventory
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Manage stock items and reference data—categories, sub-categories, brands, and units of
          measurement.
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-auto sm:inline-flex">
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="setup" className="gap-2">
            <Layers className="h-4 w-4" />
            Basic setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <InventoryItemsTab />
        </TabsContent>

        <TabsContent value="setup" className="mt-6">
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            Configure categories, sub-categories, brands, and units before adding inventory
            items.
          </p>
          <InventoryBasicSetupSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
