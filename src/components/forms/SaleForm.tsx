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
import { useStudents } from "@/hooks/useStudents"
import { useClassTeachers } from "@/hooks/useClassTeachers"
import type { Transaction } from "@/hooks/useTransactions"

const saleSchema = z.object({
  item_id: z.string().min(1, "Please select an item"),
  customer_name: z.string().min(1, "Please enter customer name"),
  qty_out: z.number().min(1, "Quantity must be at least 1"),
  out_cost: z.number().min(0, "Cost must be positive"),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.date(),
  status: z.enum(["pending", "completed", "cancelled"]),
})

type SaleFormData = z.infer<typeof saleSchema>

interface SaleFormProps {
  transaction?: Transaction
  onSubmit: (data: SaleFormData) => void
  onCancel: () => void
}

export function SaleForm({ transaction, onSubmit, onCancel }: SaleFormProps) {
  const { items } = useInventory()
  const { students } = useStudents()
  const { classTeachers } = useClassTeachers()

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      item_id: transaction?.item_id || "",
      customer_name: (transaction as any)?.customer_name || "",
      qty_out: transaction?.qty_out || 1,
      out_cost: transaction?.out_cost || 0,
      reference_no: transaction?.reference_no || "",
      notes: transaction?.notes || "",
      transaction_date: transaction?.transaction_date ? new Date(transaction.transaction_date) : new Date(),
      status: (transaction?.status && ['pending', 'completed', 'cancelled'].includes(transaction.status)) 
        ? transaction.status as "pending" | "completed" | "cancelled"
        : "pending",
    },
  })

  const handleSubmit = (data: SaleFormData) => {
    onSubmit(data)
  }

  const selectedItem = form.watch("item_id")
  const selectedQty = form.watch("qty_out")
  const item = items.find(i => i.id === selectedItem)

  // Auto-calculate total cost based on item selling price and quantity
  const handleQtyChange = (qty: number) => {
    if (item && qty > 0) {
      form.setValue("out_cost", item.selling_price * qty)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="item_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={items.map((item) => ({
                      value: item.id,
                      label: `${item.name} - ${item.sku}`
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
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter customer name (student, teacher, or walk-in customer)"
                    list="customer-suggestions"
                  />
                </FormControl>
                <datalist id="customer-suggestions">
                  {students.map((student) => (
                    <option key={`student-${student.id}`} value={`${student.first_name} ${student.last_name}`} />
                  ))}
                  {classTeachers.map((teacher) => (
                    <option key={`teacher-${teacher.id}`} value={teacher.name} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="qty_out"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    {...field}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 0
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
            name="out_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Revenue (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Total revenue"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
                {item && selectedQty && (
                  <p className="text-xs text-muted-foreground">
                    Selling price: ₦{item.selling_price.toLocaleString()} × {selectedQty} = ₦{(item.selling_price * selectedQty).toLocaleString()}
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reference_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="SO-2024-001" {...field} />
                </FormControl>
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
          name="transaction_date"
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this sale..."
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
            {transaction ? "Update Sale" : "Create Sale"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
