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
import { CalendarIcon, GraduationCap, Plus, Trash2, User, UserRound } from "lucide-react";
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
import { useStudents, type Student } from "@/hooks/useStudents";
import { useStaff } from "@/hooks/useStaff";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

function formatStudentName(student: Student): string {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

const schema = z
  .object({
    storeId: z.string().min(1, "Please select a store"),
    ref: z.string().optional(),
    note: z.string().optional(),
    customerType: z.enum(["direct", "student", "staff"]),
    studentId: z.string().optional(),
    staffId: z.string().optional(),
    customerName: z.string(),
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
  })
  .superRefine((data, ctx) => {
    if (data.customerType === "direct") {
      if (!data.customerName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter the customer name",
          path: ["customerName"],
        });
      }
    }
    if (data.customerType === "student" && !data.studentId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a student",
        path: ["studentId"],
      });
    }
    if (data.customerType === "staff" && !data.staffId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a staff member",
        path: ["staffId"],
      });
    }
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
  const { students, isLoading: studentsLoading } = useStudents({ page: 1, limit: 500 });
  const { staff, isLoading: staffLoading } = useStaff({ page: 1, limit: 500 });

  const form = useForm<SaleCreateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      ref: "",
      note: "",
      customerType: "direct",
      studentId: "",
      staffId: "",
      customerName: "",
      transactionDate: new Date(),
      items: [{ itemId: "", qty: 1, sellingPrice: 0, amount: 0 }],
    },
  });

  const storeId = form.watch("storeId");
  const customerType = form.watch("customerType");
  const studentId = form.watch("studentId");
  const staffIdWatch = form.watch("staffId");
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

  useEffect(() => {
    if (customerType !== "student" || !studentId) return;
    const student = students.find((s) => s.id === studentId);
    if (student) {
      form.setValue("customerName", formatStudentName(student), { shouldDirty: true });
    }
  }, [customerType, studentId, students, form]);

  useEffect(() => {
    if (customerType !== "staff" || !staffIdWatch) return;
    const member = staff.find((s) => s.id === staffIdWatch);
    if (member?.name) {
      form.setValue("customerName", member.name.trim(), { shouldDirty: true });
    }
  }, [customerType, staffIdWatch, staff, form]);

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: s.id,
        label: `${formatStudentName(s)} · ${s.admissionNumber}`,
      })),
    [students]
  );

  const staffOptions = useMemo(
    () =>
      staff.map((s) => ({
        value: s.id,
        label: s.name?.trim() || s.StaffNumber || s.id,
      })),
    [staff]
  );

  const handleCustomerTypeChange = (value: string) => {
    if (value !== "direct" && value !== "student" && value !== "staff") return;
    form.setValue("customerType", value);
    form.setValue("studentId", "");
    form.setValue("staffId", "");
    form.setValue("customerName", "");
    form.clearErrors(["customerName", "studentId", "staffId"]);
  };

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
              <FormItem className="md:col-span-9">
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
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer</CardTitle>
            <CardDescription>
              Sell to a walk-in customer, or link the sale to a student or staff member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={handleCustomerTypeChange}
                      className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem
                        value="direct"
                        aria-label="Walk-in customer"
                        className="h-auto flex-col gap-1 py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Walk-in</span>
                        <span className="text-xs font-normal opacity-80">
                          Enter name manually
                        </span>
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="student"
                        aria-label="Student customer"
                        className="h-auto flex-col gap-1 py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        <GraduationCap className="h-4 w-4" />
                        <span className="text-sm font-medium">Student</span>
                        <span className="text-xs font-normal opacity-80">
                          Pick from register
                        </span>
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="staff"
                        aria-label="Staff customer"
                        className="h-auto flex-col gap-1 py-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        <UserRound className="h-4 w-4" />
                        <span className="text-sm font-medium">Staff</span>
                        <span className="text-xs font-normal opacity-80">
                          Pick from staff list
                        </span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {customerType === "direct" ? (
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Walk-in buyer, parent, vendor…"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {customerType === "student" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          options={studentOptions}
                          placeholder={
                            studentsLoading ? "Loading students…" : "Search student…"
                          }
                          searchPlaceholder="Name or admission no."
                          disabled={studentsLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          tabIndex={-1}
                          className="bg-muted"
                          placeholder="Select a student above"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {customerType === "staff" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff member</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          options={staffOptions}
                          placeholder={staffLoading ? "Loading staff…" : "Search staff…"}
                          searchPlaceholder="Search staff…"
                          disabled={staffLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          tabIndex={-1}
                          className="bg-muted"
                          placeholder="Select staff above"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>


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
