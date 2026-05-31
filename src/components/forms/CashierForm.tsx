import { zodResolver } from "@hookform/resolvers/zod";
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
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Cashier } from "@/hooks/useCashiers";
import { useStaff } from "@/hooks/useStaff";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import { accountChartOptionLabel } from "@/hooks/useDefaultAccountSettings";
import { useMemo } from "react";

const addSchema = z.object({
  name: z.string().min(1, "Name is required"),
  staffId: z.string().min(1, "Please select a staff member"),
  accountChartId: z.coerce.number().int().positive("Please select a ledger account"),
});

const editSchema = addSchema.extend({
  status: z.enum(["Active", "Inactive"]),
});

export type CashierAddFormData = z.infer<typeof addSchema>;
export type CashierEditFormData = z.infer<typeof editSchema>;

function normalizeStatus(s: string | undefined): "Active" | "Inactive" {
  if (!s) return "Active";
  return s.toLowerCase() === "inactive" ? "Inactive" : "Active";
}

function CashierAddForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CashierAddFormData) => void;
  onCancel: () => void;
}) {
  const { staff, isLoading: staffLoading } = useStaff({ page: 1, limit: 500 });
  const { charts, isLoading: chartsLoading } = useAccountCharts({
    status: "Active",
    accountType: "Cash",
  });

  const staffOptions = useMemo(
    () =>
      staff.map((s) => ({
        value: s.id,
        label: s.name?.trim() || s.StaffNumber || s.id,
      })),
    [staff]
  );

  const chartOptions = useMemo(
    () =>
      charts.map((c) => ({
        value: String(c.id),
        label: accountChartOptionLabel(c),
      })),
    [charts]
  );

  const form = useForm<CashierAddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      name: "",
      staffId: "",
      accountChartId: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cashier name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cashier 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={staffOptions}
                  placeholder={staffLoading ? "Loading staff…" : "Select staff"}
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
          name="accountChartId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ledger account</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                  options={chartOptions}
                  placeholder={chartsLoading ? "Loading accounts…" : "Select ledger"}
                  searchPlaceholder="Search chart accounts…"
                  disabled={chartsLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create cashier</Button>
        </div>
      </form>
    </Form>
  );
}

function CashierEditForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData: Cashier;
  onSubmit: (data: CashierEditFormData) => void;
  onCancel: () => void;
}) {
  const { staff, isLoading: staffLoading } = useStaff({ page: 1, limit: 500 });
  const { charts, isLoading: chartsLoading } = useAccountCharts({
    status: "All",
    accountType: "Cash",
  });

  const staffOptions = useMemo(
    () =>
      staff.map((s) => ({
        value: s.id,
        label: s.name?.trim() || s.StaffNumber || s.id,
      })),
    [staff]
  );

  const chartOptions = useMemo(
    () =>
      charts.map((c) => ({
        value: String(c.id),
        label: accountChartOptionLabel(c),
      })),
    [charts]
  );

  const form = useForm<CashierEditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: initialData.name,
      staffId: initialData.staffId,
      accountChartId: initialData.accountChartId,
      status: normalizeStatus(initialData.status),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cashier name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={staffOptions}
                  placeholder={staffLoading ? "Loading staff…" : "Select staff"}
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
          name="accountChartId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ledger account</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                  options={chartOptions}
                  placeholder={chartsLoading ? "Loading accounts…" : "Select ledger"}
                  searchPlaceholder="Search chart accounts…"
                  disabled={chartsLoading}
                />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
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

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Form>
  );
}

interface CashierFormProps {
  mode: "add" | "edit";
  initialData?: Cashier;
  onSubmit: (data: CashierAddFormData | CashierEditFormData) => void | Promise<void>;
  onCancel: () => void;
}

export function CashierForm({ mode, initialData, onSubmit, onCancel }: CashierFormProps) {
  if (mode === "add") {
    return (
      <CashierAddForm
        onSubmit={onSubmit as (data: CashierAddFormData) => void}
        onCancel={onCancel}
      />
    );
  }
  if (!initialData) return null;
  return (
    <CashierEditForm
      initialData={initialData}
      onSubmit={onSubmit as (data: CashierEditFormData) => void}
      onCancel={onCancel}
    />
  );
}
