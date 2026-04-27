import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useInventory } from "@/hooks/useInventory"
import { useSuppliers } from "@/hooks/useSuppliers"
import type { Purchase } from "@/hooks/usePurchases"

const purchaseSchema = z.object({
  itemId: z.string().min(1, "Please select an item"),
  supplierId: z.string().min(1, "Please select a supplier"),
  qtyIn: z.string().min(1, "Quantity must be at least 1"),
  inCost: z.string().min(1, "Cost must be provided"),
  amountPaid: z.string().optional(),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
  transactionDate: z.date(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
})

type PurchaseFormData = z.infer<typeof purchaseSchema>

interface PurchaseFormProps {
  mode: "add" | "edit"
  purchase?: Purchase
  onSubmit: (data: PurchaseFormData) => void
  onCancel: () => void
}

export function PurchaseForm({ mode, purchase, onSubmit, onCancel }: PurchaseFormProps) {
  const { items } = useInventory({ page: 1, limit: 100 })
  const { suppliers } = useSuppliers()
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      itemId: purchase?.itemId || "",
      supplierId: purchase?.supplierId || "",
      qtyIn: purchase?.qtyIn || "1",
      inCost: purchase?.inCost || "0",
      amountPaid: purchase?.amountPaid || "",
      referenceNo: purchase?.referenceNo || "",
      notes: purchase?.notes || "",
      transactionDate: purchase?.transactionDate
        ? new Date(purchase.transactionDate)
        : new Date(),
      status:
        mode === "edit"
          ? ((purchase?.status as any) ?? "completed")
          : undefined,
    },
  })

  const handleSubmit = (data: PurchaseFormData) => {
    onSubmit(data)
  }

  const selectedItem = form.watch("itemId")
  const selectedQty = form.watch("qtyIn")
  const item = items.find(i => i.id === selectedItem)

  const handleQtyChange = (qty: string) => {
    const parsedQty = Number(qty);
    const unitCost = Number(item?.costPrice ?? 0);
    if (item && parsedQty > 0) {
      form.setValue("inCost", String(unitCost * parsedQty));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={items.map((item) => ({
                      value: item.id,
                      label: `${item.name}${item.sku ? ` - ${item.sku}` : ""}`
                    }))}
                    placeholder="Select item"
                    searchPlaceholder="Search items..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    options={suppliers.map((supplier) => ({
                      value: supplier.id,
                      label: supplier.name
                    }))}
                    placeholder="Select supplier"
                    searchPlaceholder="Search suppliers..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="qtyIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter quantity"
                    {...field}
                    onChange={(e) => {
                      const qty = e.target.value
                      field.onChange(qty)
                      handleQtyChange(qty)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Cost (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Total cost"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
                {item && selectedQty && (
                  <p className="text-xs text-muted-foreground">
                    Unit cost: ₦{Number(item.costPrice ?? 0).toLocaleString()} × {selectedQty} = ₦{Number(field.value || 0).toLocaleString()}
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amountPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount Paid (₦)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="referenceNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="PO-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Transaction Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border shadow-md" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={mode === "add"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this purchase..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {purchase ? "Update Purchase" : "Create Purchase"}
          </Button>
        </div>
      </form>
    </Form>
  )
}