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
import { useInventory, type InventoryItem } from "@/hooks/useInventory";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useStores } from "@/hooks/useStores";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function itemUnitCost(items: InventoryItem[], itemId: string): number {
  const item = items.find((i) => i.id === itemId);
  if (!item) return 0;
  const n = Number(item.costPrice ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function lineTotalCost(qty: number, unitCost: number): number {
  return roundMoney(qty * unitCost);
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function formatMoneyDisplay(n: number): string {
  const value = Number.isFinite(n) ? n : 0;
  return moneyFormatter.format(value);
}

const schema = z.object({
  storeId: z.string().min(1, "Please select a store"),
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
        unitCost: z.number().min(0, "Unit cost must be non-negative"),
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
  const { stores, isLoading: storesLoading } = useStores({
    status: "Active",
    page: 1,
    limit: 100,
  });

  const form = useForm<PurchaseCreateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      supplierId: "",
      referenceNo: "",
      notes: "",
      transactionDate: new Date(),
      amountPaid: undefined,
      items: [{ itemId: "", qtyIn: 1, unitCost: 0, inCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const applyItemSelection = (index: number, itemId: string) => {
    const unitCost = itemUnitCost(inventoryItems, itemId);
    const qty = form.getValues(`items.${index}.qtyIn`) || 1;
    form.setValue(`items.${index}.unitCost`, unitCost, { shouldDirty: true });
    form.setValue(`items.${index}.inCost`, lineTotalCost(qty, unitCost), {
      shouldDirty: true,
    });
  };

  const applyLineTotals = (index: number) => {
    const qty = form.getValues(`items.${index}.qtyIn`) || 0;
    const unitCost = form.getValues(`items.${index}.unitCost`) || 0;
    form.setValue(`items.${index}.inCost`, lineTotalCost(qty, unitCost), {
      shouldDirty: true,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="storeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store</FormLabel>
                <FormControl>
                  {storesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading stores…</p>
                  ) : stores.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active stores found.</p>
                  ) : (
                    <Combobox
                      value={field.value}
                      onValueChange={field.onChange}
                      options={stores.map((s) => ({
                        value: s.id,
                        label: s.name,
                      }))}
                      placeholder="Select store"
                      searchPlaceholder="Search stores…"
                    />
                  )}
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
        </div>

        

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Items</p>
              <p className="text-xs text-muted-foreground">Add one or more items to this purchase.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ itemId: "", qtyIn: 1, unitCost: 0, inCost: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {fields.map((f, index) => (
            <div key={f.id} className="rounded-md border p-4">
              <div className="flex flex-row items-end gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.itemId`}
                  render={({ field }) => (
                    <FormItem className="min-w-0 flex-1">
                      <FormLabel>Inventory Item {index + 1}</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value}
                          onValueChange={(itemId) => {
                            field.onChange(itemId);
                            if (itemId) applyItemSelection(index, itemId);
                          }}
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
                    <FormItem className="w-24 shrink-0">
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(e) => {
                            const qty = Number(e.target.value) || 0;
                            field.onChange(qty);
                            applyLineTotals(index);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.unitCost`}
                  render={({ field }) => (
                    <FormItem className="w-32 shrink-0">
                      <FormLabel>Unit Cost (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value}
                          onChange={(e) => {
                            const unitCost = Number(e.target.value) || 0;
                            field.onChange(unitCost);
                            applyLineTotals(index);
                          }}
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
                    <FormItem className="w-32 shrink-0">
                      <FormLabel>Cost Value (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          className="bg-muted text-right tabular-nums"
                          value={formatMoneyDisplay(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-row items-end gap-4">
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem className="flex min-w-0 flex-1 flex-col">
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

         

          <FormField
            control={form.control}
            name="referenceNo"
            render={({ field }) => (
              <FormItem className="min-w-0 flex-1">
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
            name="amountPaid"
            render={({ field }) => (
              <FormItem className="w-36 shrink-0">
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
          <Button type="submit" disabled={storesLoading || stores.length === 0}>
            Create Purchases
          </Button>
        </div>
      </form>
    </Form>
  );
}

