import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComboboxOption } from "@/components/ui/combobox";
import type {
  ConcessionDiscountCalculationType,
  ConcessionDiscountType,
  ConcessionDiscountRow,
} from "@/hooks/useConcessionDiscounts";

const discountFormSchema = z
  .object({
    code: z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    type: z.enum(["CONCESSION", "DISCOUNT"]),
    calculationType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.coerce.number().min(0, "Value must be 0 or greater"),
    maxLimit: z.coerce.number().int().min(0, "Max limit must be 0 or greater"),
    accountId: z.string().min(1, "Account is required"),
    appliesToIds: z.array(z.string()),
    status: z.enum(["Active", "Inactive"]),
  })
  .superRefine((data, ctx) => {
    if (data.calculationType === "PERCENTAGE") {
      if (data.appliesToIds.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one billing item.",
          path: ["appliesToIds"],
        });
      }
      return;
    }

    // FIXED_AMOUNT
    if (data.appliesToIds.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select exactly one billing item.",
        path: ["appliesToIds"],
      });
    }
  });

export type ConcessionDiscountFormData = z.infer<
  typeof discountFormSchema
>;

function normalizeStatus(s: string | undefined): "Active" | "Inactive" {
  if (!s) return "Active";
  return s.toLowerCase() === "inactive" ? "Inactive" : "Active";
}

export function ConcessionDiscountForm({
  mode,
  initialData,
  billingItemOptions,
  accountOptions,
  onSubmit,
  onCancel,
}: {
  mode: "add" | "edit";
  initialData?: ConcessionDiscountRow;
  billingItemOptions: ComboboxOption[];
  accountOptions: ComboboxOption[];
  onSubmit: (data: ConcessionDiscountFormData) => void;
  onCancel: () => void;
}) {
  const form = useForm<ConcessionDiscountFormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: initialData?.code ?? "",
      name: initialData?.name ?? "",
      type: (initialData?.type as ConcessionDiscountType) ?? "CONCESSION",
      calculationType:
        (initialData?.calculationType as ConcessionDiscountCalculationType) ??
        "PERCENTAGE",
      value: initialData?.value ?? 0,
      maxLimit: initialData?.maxLimit ?? 0,
      accountId: initialData ? String(initialData.accountId) : "",
      appliesToIds: initialData?.appliesToIds
        ? initialData.appliesToIds.map(String)
        : [],
      status: normalizeStatus(initialData?.status),
    },
  });

  const calculationType = form.watch("calculationType");
  const appliesToIds = form.watch("appliesToIds");

  useEffect(() => {
    if (calculationType === "FIXED_AMOUNT" && appliesToIds.length > 1) {
      form.setValue("appliesToIds", [appliesToIds[0]], { shouldValidate: true });
    }
  }, [calculationType, appliesToIds, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. TUI001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Tuition discount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CONCESSION">CONCESSION</SelectItem>
                    <SelectItem value="DISCOUNT">DISCOUNT</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="calculationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calculation</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v === "FIXED_AMOUNT") {
                      // keep only first selection
                      const first = form.getValues("appliesToIds")[0];
                      form.setValue(
                        "appliesToIds",
                        first ? [first] : [],
                        { shouldValidate: true }
                      );
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select calculation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">FIXED_AMOUNT</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max limit</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Account</FormLabel>
                <FormControl>
                  <Combobox
                    options={accountOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select account…"
                    searchPlaceholder="Search accounts…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {calculationType === "PERCENTAGE" ? (
            <FormField
              control={form.control}
              name="appliesToIds"
              render={() => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Applies to (multi-select)</FormLabel>
                  <FormControl>
                    <MultiCombobox
                      options={billingItemOptions}
                      value={appliesToIds}
                      onValueChange={(v) =>
                        form.setValue("appliesToIds", v, { shouldValidate: true })
                      }
                      placeholder="Select billing items…"
                      searchPlaceholder="Search billing items…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="appliesToIds"
              render={() => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Applies to (single)</FormLabel>
                  <FormControl>
                    <Combobox
                      options={billingItemOptions}
                      value={appliesToIds[0] ?? ""}
                      onValueChange={(v) =>
                        form.setValue(
                          "appliesToIds",
                          v ? [v] : [],
                          { shouldValidate: true }
                        )
                      }
                      placeholder="Select billing item…"
                      searchPlaceholder="Search billing items…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === "add" ? "Create" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

