import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { InventoryItem } from "@/hooks/useInventory"
import { useCategories } from "@/hooks/useCategories"
import { useSubCategories } from "@/hooks/useSubCategories"
import { useBrands } from "@/hooks/useBrands"
import { useUoms } from "@/hooks/useUoms"

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  subCategoryId: z.string().min(1, "Sub-category is required"),
  brandId: z.string().min(1, "Brand is required"),
  uomId: z.string().min(1, "Unit of measurement is required"),
  lowStockThreshold: z.number().min(0, "Threshold must be non-negative"),
  costPrice: z.number().min(0, "Cost price must be non-negative"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative"),
  barcode: z.string().optional(),
})

type InventoryFormData = z.infer<typeof inventorySchema>

interface InventoryFormProps {
  initialData?: Partial<InventoryItem>
  onSubmit: (data: InventoryFormData) => void
  onCancel: () => void
}

export function InventoryForm({ initialData, onSubmit, onCancel }: InventoryFormProps) {
  const { categories } = useCategories()
  const { brands } = useBrands()
  const { uoms } = useUoms()

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      categoryId: initialData?.categoryId || "",
      subCategoryId: initialData?.subCategoryId || "",
      brandId: initialData?.brandId || "",
      uomId: initialData?.uomId || "",
      lowStockThreshold: initialData?.lowStockThreshold || 0,
      costPrice: Number(initialData?.costPrice ?? 0),
      sellingPrice: Number(initialData?.sellingPrice ?? 0),
      barcode: initialData?.barcode || "",
    },
  })

  const selectedCategoryId = form.watch("categoryId")
  const { subCategories } = useSubCategories({
    categoryId: selectedCategoryId || undefined,
  })

  const handleSubmit = (data: InventoryFormData) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter item name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Enter SKU" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name
                    }))}
                    placeholder="Select category"
                    searchPlaceholder="Search categories..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub-Category</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={subCategories.map((subCategory) => ({
                      value: subCategory.id,
                      label: subCategory.name
                    }))}
                    placeholder="Select sub-category"
                    searchPlaceholder="Search sub-categories..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={brands.map((brand) => ({
                      value: brand.id,
                      label: brand.name
                    }))}
                    placeholder="Select brand"
                    searchPlaceholder="Search brands..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measurement</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={uoms.map((uom) => ({
                      value: uom.id,
                      label: `${uom.name} (${uom.symbol})`
                    }))}
                    placeholder="Select UOM"
                    searchPlaceholder="Search units..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter cost price"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter selling price"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barcode (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter barcode" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-primary">
            {initialData ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  )
}