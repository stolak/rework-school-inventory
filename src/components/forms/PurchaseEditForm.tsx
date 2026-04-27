import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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
import type { Purchase } from "@/hooks/usePurchases";

const schema = z.object({
  itemId: z.string().min(1, "Please select an item"),
  supplierId: z.string().optional(),
  qtyIn: z.string().min(1, "Quantity must be at least 1"),
  inCost: z.string().min(1, "Cost must be provided"),
  amountPaid: z.string().optional(),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
  transactionDate: z.date(),
  status: z.enum(["pending", "completed", "cancelled"]),
});

export type PurchaseEditFormData = z.infer<typeof schema>;

export function PurchaseEditForm({
  purchase,
  onSubmit,
  onCancel,
}: {
  purchase?: Purchase;
  onSubmit: (data: PurchaseEditFormData) => void;
  onCancel: () => void;
}) {
  const { items: inventoryItems } = useInventory({ page: 1, limit: 100 });
  const { suppliers } = useSuppliers({ page: 1, limit: 100 });

  const form = useForm<PurchaseEditFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: purchase?.itemId || "",
      supplierId: purchase?.supplierId || "",
      qtyIn: purchase?.qtyIn || "1",
      inCost: purchase?.inCost || "0",
      amountPaid: purchase?.amountPaid || "",
      referenceNo: purchase?.referenceNo || "",
      notes: purchase?.notes || "",
      transactionDate: purchase?.transactionDate ? new Date(purchase.transactionDate) : new Date(),
      status: (purchase?.status as any) ?? "completed",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier (Optional)</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value || ""}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="qtyIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
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
                  <Input type="text" {...field} />
                </FormControl>
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
                  <Input type="text" {...field} />
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
                <Select value={field.value} onValueChange={field.onChange}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Update Purchase</Button>
        </div>
      </form>
    </Form>
  );
}

