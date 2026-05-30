import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { useMyStores } from "@/hooks/useMyStores";
import { useStudents } from "@/hooks/useStudents";
import { useClassTeachers } from "@/hooks/useClassTeachers";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function itemSellingPrice(items: InventoryItem[], itemId: string): number {
  const item = items.find((i) => i.id === itemId);
  if (!item) return 0;
  const n = Number(item.sellingPrice ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function itemCurrentStock(items: InventoryItem[], itemId: string): number {
  const item = items.find((i) => i.id === itemId);
  return Number(item?.currentStock ?? 0);
}

function lineTotalAmount(qty: number, unitPrice: number): number {
  return roundMoney(qty * unitPrice);
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
  ref: z.string().optional(),
  note: z.string().optional(),
  customerName: z.string().min(1, "Please enter customer name"),
  transactionDate: z.date(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Please select an item"),
        qty: z.number().min(1, "Qty must be at least 1"),
        sellingPrice: z.number().min(0, "Selling price must be non-negative"),
        amount: z.number().min(0, "Amount must be non-negative"),
      })
    )
    .min(1, "Add at least one item"),
});

export type SaleCreateFormData = z.infer<typeof schema>;

export function SaleCreateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: SaleCreateFormData) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { stores, isLoading: storesLoading } = useMyStores({ page: 1, limit: 100 });
  const { students } = useStudents({ page: 1, limit: 200 });
  const { classTeachers } = useClassTeachers();

  const form = useForm<SaleCreateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      ref: "",
      note: "",
      customerName: "",
      transactionDate: new Date(),
      items: [{ itemId: "", qty: 1, sellingPrice: 0, amount: 0 }],
    },
  });

  const storeId = form.watch("storeId");
  const watchedItems = useWatch({ control: form.control, name: "items" }) ?? [];

  const {
    items: storeInventory,
    isLoading: storeItemsLoading,
  } = useInventory({
    storeId: storeId || undefined,
    page: 1,
    limit: 500,
    enabled: !!storeId,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    form.setValue("items", [{ itemId: "", qty: 1, sellingPrice: 0, amount: 0 }]);
  }, [storeId, form]);

  const stockExceeded = useMemo(() => {
    if (!storeId) return false;
    const totals = new Map<string, number>();
    for (const row of watchedItems) {
      if (!row.itemId || row.qty <= 0) continue;
      totals.set(row.itemId, (totals.get(row.itemId) ?? 0) + row.qty);
    }
    for (const [itemId, totalQty] of totals) {
      if (totalQty > itemCurrentStock(storeInventory, itemId)) return true;
    }
    return false;
  }, [storeId, watchedItems, storeInventory]);

  const applyItemSelection = (index: number, itemId: string) => {
    const sellingPrice = itemSellingPrice(storeInventory, itemId);
    const qty = Number(form.getValues(`items.${index}.qty`)) || 0;
    form.setValue(`items.${index}.sellingPrice`, sellingPrice, { shouldDirty: true });
    form.setValue(`items.${index}.amount`, lineTotalAmount(qty || 1, sellingPrice), {
      shouldDirty: true,
    });
  };

  const lineAmountForRow = (row: SaleCreateFormData["items"][number] | undefined) => {
    if (!row?.itemId) return 0;
    const qty = Number(row.qty) || 0;
    const sellingPrice =
      Number(row.sellingPrice) ||
      itemSellingPrice(storeInventory, row.itemId);
    if (qty <= 0 || sellingPrice <= 0) return 0;
    return lineTotalAmount(qty, sellingPrice);
  };

  const totalAmountToPay = useMemo(
    () =>
      roundMoney(
        watchedItems.reduce((sum, row) => sum + lineAmountForRow(row), 0)
      ),
    [watchedItems, storeInventory]
  );

  const itemOptions = storeInventory.map((it) => ({
    value: it.id,
    label: `${it.name}${it.sku ? ` - ${it.sku}` : ""} (stock: ${it.currentStock ?? 0})`,
  }));

  const handleFormSubmit = async (data: SaleCreateFormData) => {
    if (stockExceeded) return;
    const itemsWithAmounts = data.items.map((row) => ({
      ...row,
      sellingPrice:
        Number(row.sellingPrice) ||
        itemSellingPrice(storeInventory, row.itemId),
      amount: lineAmountForRow(row),
    }));
    await onSubmit({ ...data, items: itemsWithAmounts });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col md:col-span-3">
                <FormLabel>Txn. Date</FormLabel>
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
            name="storeId"
            render={({ field }) => (
              <FormItem className="md:col-span-4">
                <FormLabel>Store</FormLabel>
                <FormControl>
                  {storesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading stores…</p>
                  ) : stores.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stores assigned to you.</p>
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
            name="customerName"
            render={({ field }) => (
              <FormItem className="md:col-span-5">
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Student, staff, or walk-in customer"
                    list="sale-customer-suggestions"
                  />
                </FormControl>
                <datalist id="sale-customer-suggestions">
                  {students.map((student) => (
                    <option
                      key={`student-${student.id}`}
                      value={`${student.firstName} ${student.lastName}`}
                    />
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

        

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this sale…"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Items</p>
              <p className="text-xs text-muted-foreground">
                Add one or more items to this sale.
                {!storeId ? " Select a store first." : null}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!storeId || storeItemsLoading}
              onClick={() => append({ itemId: "", qty: 1, sellingPrice: 0, amount: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {storeId && storeItemsLoading ? (
            <p className="text-sm text-muted-foreground">Loading store inventory…</p>
          ) : null}

          {fields.map((f, index) => {
            const row = watchedItems[index];
            const derivedLineAmount = lineAmountForRow(row);
            const derivedSellingPrice =
              Number(row?.sellingPrice) ||
              (row?.itemId ? itemSellingPrice(storeInventory, row.itemId) : 0);

            return (
            <div key={f.id} className="rounded-md border p-4">
              <div className="flex flex-row items-end gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.itemId`}
                  render={({ field }) => (
                    <FormItem className="min-w-0 flex-1">
                      <FormLabel>Item {index + 1}</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value}
                          onValueChange={(itemId) => {
                            field.onChange(itemId);
                            if (itemId) applyItemSelection(index, itemId);
                          }}
                          options={itemOptions}
                          placeholder={storeId ? "Select item" : "Select store first"}
                          searchPlaceholder="Search items…"
                          disabled={!storeId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.qty`}
                  render={({ field }) => (
                    <FormItem className="w-24 shrink-0">
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const qty = raw === "" ? "" : Number(raw);
                            field.onChange(qty);
                            const sellingPrice =
                              Number(form.getValues(`items.${index}.sellingPrice`)) ||
                              itemSellingPrice(
                                storeInventory,
                                form.getValues(`items.${index}.itemId`)
                              );
                            const numericQty = qty === "" ? 0 : Number(qty);
                            form.setValue(
                              `items.${index}.amount`,
                              lineTotalAmount(numericQty, sellingPrice),
                              { shouldDirty: true }
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.sellingPrice`}
                  render={({ field }) => (
                    <FormItem className="w-36 shrink-0">
                      <FormLabel>Selling Price (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          className="bg-muted text-right tabular-nums"
                          value={formatMoneyDisplay(derivedSellingPrice)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className="w-36 shrink-0">
                      <FormLabel>Line Amount (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          className="bg-muted text-right tabular-nums"
                          value={formatMoneyDisplay(derivedLineAmount)}
                        />
                      </FormControl>
                    </FormItem>

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
            );
          })}

          <div className="flex justify-end rounded-md border bg-muted/40 px-4 py-3">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total amount to pay</p>
              <p className="text-xl font-semibold tabular-nums">
                ₦{formatMoneyDisplay(totalAmountToPay)}
              </p>
            </div>
          </div>

          {stockExceeded ? (
            <p className="text-sm text-destructive">
              One or more items exceed available stock at the selected store.
            </p>
          ) : null}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!storeId || stockExceeded}>
            Create Sale
          </Button>
        </div>
      </form>
    </Form>
  );
}
