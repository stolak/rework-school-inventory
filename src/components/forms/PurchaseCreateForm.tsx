import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useInventory } from "@/hooks/useInventory";
import { useSuppliers } from "@/hooks/useSuppliers";

const schema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
  transactionDate: z.date(),
  amountPaid: z.number().min(0, "Amount paid must be non-negative").optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Please select an item"),
        qtyIn: z.number().min(1, "Qty must be at least 1"),
        inCost: z.number().min(0, "Cost must be non-negative"),
      })
    )
    .min(1, "Add at least one item"),
});

export type PurchaseCreateFormData = z.infer<typeof schema>;

export function PurchaseCreateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: PurchaseCreateFormData) => void;
  onCancel: () => void;
}) {
  const { items: inventoryItems } = useInventory({ page: 1, limit: 100 });
  const { suppliers } = useSuppliers({ status: "Active", page: 1, limit: 100 });

  const form = useForm<PurchaseCreateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: "",
      referenceNo: "",
      notes: "",
      transactionDate: new Date(),
      amountPaid: undefined,
      items: [{ itemId: "", qtyIn: 1, inCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                    placeholder="Select supplier"
                    searchPlaceholder="Search suppliers..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border shadow-md" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
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
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference No (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="string" value={field.value ?? ""} onChange={field.onChange} />
                </FormControl>
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
                <Textarea placeholder="string" value={field.value ?? ""} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Items</p>
              <p className="text-xs text-muted-foreground">Add one or more items to this purchase.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ itemId: "", qtyIn: 1, inCost: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {fields.map((f, index) => (
            <div key={f.id} className="rounded-md border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Item {index + 1}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.itemId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Item</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value}
                          onValueChange={field.onChange}
                          options={inventoryItems.map((it) => ({
                            value: it.id,
                            label: `${it.name}${it.sku ? ` - ${it.sku}` : ""}`,
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
                  name={`items.${index}.qtyIn`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qty In</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.inCost`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>In Cost (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Purchases</Button>
        </div>
      </form>
    </Form>
  );
}

