import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { useClasses } from "@/hooks/useClasses"
import { useInventory } from "@/hooks/useInventory"
import { useSessions } from "@/hooks/useSessions"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const distributionSchema = z.object({
  class_id: z.string().min(1, "Class is required"),
  inventory_item_id: z.string().min(1, "Inventory item is required"),
  session_term_id: z.string().min(1, "Session/Term is required"),
  distributed_quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  distribution_date: z.string().optional(),
  receiver_name: z.string().optional(),
  notes: z.string().optional(),
})

type DistributionFormData = z.infer<typeof distributionSchema>

interface ClassDistributionFormProps {
  initialData?: Partial<DistributionFormData>
  onSubmit: (data: DistributionFormData) => void
  onCancel: () => void
}

export function ClassDistributionForm({ initialData, onSubmit, onCancel }: ClassDistributionFormProps) {
  const { classes } = useClasses()
  const { items } = useInventory()
  const { sessions } = useSessions()

  const form = useForm<DistributionFormData>({
    resolver: zodResolver(distributionSchema),
    defaultValues: {
      class_id: initialData?.class_id || '',
      inventory_item_id: initialData?.inventory_item_id || '',
      session_term_id: initialData?.session_term_id || '',
      distributed_quantity: initialData?.distributed_quantity || 0,
      distribution_date: initialData?.distribution_date || new Date().toISOString(),
      receiver_name: initialData?.receiver_name || '',
      notes: initialData?.notes || '',
    },
  })

  const handleSubmit = (data: DistributionFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="class_id">Class *</Label>
        <Combobox
          value={form.watch("class_id")}
          onValueChange={(value) => form.setValue("class_id", value)}
          options={classes.map((classItem) => ({
            value: classItem.id,
            label: classItem.name
          }))}
          placeholder="Select class"
          searchPlaceholder="Search classes..."
        />
        {form.formState.errors.class_id && (
          <p className="text-sm text-destructive">{form.formState.errors.class_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="inventory_item_id">Inventory Item *</Label>
        <Combobox
          value={form.watch("inventory_item_id")}
          onValueChange={(value) => form.setValue("inventory_item_id", value)}
          options={items.map((item) => ({
            value: item.id,
            label: `${item.name} - Stock: ${item.current_stock}`
          }))}
          placeholder="Select item"
          searchPlaceholder="Search items..."
        />
        {form.formState.errors.inventory_item_id && (
          <p className="text-sm text-destructive">{form.formState.errors.inventory_item_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="session_term_id">Session/Term *</Label>
        <Combobox
          value={form.watch("session_term_id")}
          onValueChange={(value) => form.setValue("session_term_id", value)}
          options={sessions.map((session) => ({
            value: session.id,
            label: session.name
          }))}
          placeholder="Select session/term"
          searchPlaceholder="Search sessions..."
        />
        {form.formState.errors.session_term_id && (
          <p className="text-sm text-destructive">{form.formState.errors.session_term_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="distributed_quantity">Quantity *</Label>
        <Input
          {...form.register("distributed_quantity")}
          type="number"
          placeholder="Enter quantity"
          min="1"
        />
        {form.formState.errors.distributed_quantity && (
          <p className="text-sm text-destructive">{form.formState.errors.distributed_quantity.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Distribution Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !form.watch("distribution_date") && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.watch("distribution_date") ? format(new Date(form.watch("distribution_date")), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.watch("distribution_date") ? new Date(form.watch("distribution_date")) : undefined}
              onSelect={(date) => form.setValue("distribution_date", date?.toISOString() || new Date().toISOString())}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiver_name">Receiver Name</Label>
        <Input
          {...form.register("receiver_name")}
          placeholder="Name of person receiving items"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          {...form.register("notes")}
          placeholder="Optional notes or remarks"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1 bg-gradient-primary">
          Submit Distribution
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
