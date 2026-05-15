import { useMemo } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

function sanitizeAmountInput(raw: string): string {
  let t = raw.replace(/,/g, "").replace(/[^\d.]/g, "")
  const firstDot = t.indexOf(".")
  if (firstDot !== -1) {
    t = t.slice(0, firstDot + 1) + t.slice(firstDot + 1).replace(/\./g, "")
  }
  return t
}

function formatAmountOnBlur(s: string): string {
  const cleaned = sanitizeAmountInput((s ?? "").toString())
  if (cleaned === "" || cleaned === ".") return ""
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n)) return ""
  return amountFormatter.format(n)
}

const intInputSchema = (label: string) =>
  z.string().refine((s) => s.trim() === "" || /^\d+$/.test(s.trim()), {
    message: `${label} must be a non-negative whole number`,
  })

const decimalInputSchema = (label: string) =>
  z.string().refine((s) => {
    const cleaned = sanitizeAmountInput(s.trim())
    if (cleaned === "") return true
    return /^\d+(\.\d+)?$/.test(cleaned)
  }, { message: `${label} must be a non-negative number` })

const baseInventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  subCategoryId: z.string().min(1, "Sub-category is required"),
  brandId: z.string().min(1, "Brand is required"),
  uomId: z.string().min(1, "Unit of measurement is required"),
  lowStockThreshold: intInputSchema("Low stock threshold"),
  costPrice: decimalInputSchema("Cost price"),
  sellingPrice: decimalInputSchema("Selling price"),
  barcode: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
})

const buildInventorySchema = (mode: "add" | "edit") => {
  if (mode === "edit") {
    return baseInventorySchema.extend({
      status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
    })
  }
  return baseInventorySchema
}

type InventoryFormValues = z.infer<ReturnType<typeof buildInventorySchema>>

export type InventoryFormData = Omit<
  InventoryFormValues,
  "lowStockThreshold" | "costPrice" | "sellingPrice"
> & {
  lowStockThreshold: number
  costPrice: number
  sellingPrice: number
}

function parseIntField(s: string): number {
  const t = s.trim()
  if (t === "") return 0
  const n = parseInt(t, 10)
  return Number.isFinite(n) ? n : 0
}

function parseDecimalField(s: string): number {
  const cleaned = sanitizeAmountInput(s.trim())
  if (cleaned === "" || cleaned === ".") return 0
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

function toInventoryFormData(values: InventoryFormValues): InventoryFormData {
  return {
    ...values,
    lowStockThreshold: parseIntField(values.lowStockThreshold),
    costPrice: parseDecimalField(values.costPrice),
    sellingPrice: parseDecimalField(values.sellingPrice),
  }
}

export const INVENTORY_ITEM_FORM_ID = "inventory-item-form"

function toIntegerInputString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n === 0) return "";
  return String(n);
}

function toMoneyInputString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const n =
    typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n === 0) return "";
  return amountFormatter.format(n);
}

function MoneyAmountInput({
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      className="text-right tabular-nums"
      placeholder={placeholder}
      value={value}
      onFocus={() => onChange(value.replace(/,/g, ""))}
      onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
      onBlur={() => {
        onChange(formatAmountOnBlur(value));
        onBlur?.();
      }}
    />
  );
}

function NumericFormInput({
  value,
  onChange,
  onBlur,
  integerOnly,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  integerOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <Input
      type="text"
      inputMode={integerOnly ? "numeric" : "decimal"}
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "") {
          onChange("");
          return;
        }
        if (integerOnly) {
          if (/^\d+$/.test(next)) onChange(next);
          return;
        }
        if (/^\d*\.?\d*$/.test(next)) onChange(next);
      }}
      onBlur={onBlur}
    />
  );
}

interface InventoryFormProps {
  initialData?: Partial<InventoryItem>
  mode: "add" | "edit"
  onSubmit: (data: InventoryFormData) => void
  onCancel?: () => void
  /** When false, submit/cancel render in DialogFooter (see InventoryDialog). */
  showFooter?: boolean
}

export function InventoryForm({
  initialData,
  mode,
  onSubmit,
  onCancel,
  showFooter = false,
}: InventoryFormProps) {
  const { categories } = useCategories()
  const { brands } = useBrands()
  const { uoms } = useUoms()

  const schema = useMemo(() => buildInventorySchema(mode), [mode])

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku ?? "",
      categoryId: initialData?.categoryId || "",
      subCategoryId: initialData?.subCategoryId || "",
      brandId: initialData?.brandId || "",
      uomId: initialData?.uomId || "",
      lowStockThreshold: toIntegerInputString(initialData?.lowStockThreshold),
      costPrice: toMoneyInputString(initialData?.costPrice),
      sellingPrice: toMoneyInputString(initialData?.sellingPrice),
      barcode: initialData?.barcode ?? "",
      status:
        mode === "edit"
          ? ((initialData?.status as "Active" | "Inactive" | undefined) ?? "Active")
          : undefined,
    },
  })

  const selectedCategoryId = form.watch("categoryId")
  const { subCategories } = useSubCategories({
    categoryId: selectedCategoryId || undefined,
  })

  const handleSubmit = (values: InventoryFormValues) => {
    onSubmit(toInventoryFormData(values))
  }

  return (
    <Form {...form}>
      <form
        id={INVENTORY_ITEM_FORM_ID}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        {mode === "edit" && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div />
          </div>
        )}

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
                  <Input placeholder="Enter SKU" value={field.value ?? ""} onChange={field.onChange} />
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
                  <MoneyAmountInput
                    placeholder="Enter cost price"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
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
                  <MoneyAmountInput
                    placeholder="Enter selling price"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="lowStockThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Low stock threshold</FormLabel>
              <FormControl>
                <NumericFormInput
                  integerOnly
                  placeholder="e.g. 10"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Item is marked low stock when quantity is at or below this level.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barcode (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter barcode" value={field.value ?? ""} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showFooter ? (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary">
              {mode === "edit" ? "Update Item" : "Add Item"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  )
}