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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import type { AccountChart } from "@/hooks/useAccountCharts";
import type { ComboboxOption } from "@/components/ui/combobox";

const addSchema = z.object({
  subheadId: z.string().min(1, "Select a subhead"),
  accountNo: z.string(),
  accountDescription: z.string().min(1, "Description is required"),
  rank: z.coerce.number().int().min(0),
});

const editSchema = z.object({
  subheadId: z.string().min(1, "Select a subhead"),
  accountNo: z.string(),
  accountDescription: z.string().min(1, "Description is required"),
  status: z.enum(["Active", "Inactive"]),
  rank: z.coerce.number().int().min(0),
});

export type AccountChartAddFormData = z.infer<typeof addSchema>;
export type AccountChartEditFormData = z.infer<typeof editSchema>;

function AccountChartAddForm({
  subheadOptions,
  onSubmit,
  onCancel,
}: {
  subheadOptions: ComboboxOption[];
  onSubmit: (data: AccountChartAddFormData) => void;
  onCancel: () => void;
}) {
  const form = useForm<AccountChartAddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      subheadId: "",
      accountNo: "",
      accountDescription: "",
      rank: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subheadId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subhead</FormLabel>
              <FormControl>
                <Combobox
                  options={subheadOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select subhead…"
                  searchPlaceholder="Search subheads…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account number (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 0001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Account description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </Form>
  );
}

function normalizeChartStatus(s: string | undefined): "Active" | "Inactive" {
  if (!s) return "Active";
  return s.toLowerCase() === "inactive" ? "Inactive" : "Active";
}

function AccountChartEditForm({
  subheadOptions,
  initialData,
  onSubmit,
  onCancel,
}: {
  subheadOptions: ComboboxOption[];
  initialData: AccountChart;
  onSubmit: (data: AccountChartEditFormData) => void;
  onCancel: () => void;
}) {
  const form = useForm<AccountChartEditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      subheadId: String(initialData.subheadId),
      accountNo: initialData.accountNo ?? "",
      accountDescription: initialData.accountDescription,
      status: normalizeChartStatus(initialData.status),
      rank: initialData.rank,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subheadId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subhead</FormLabel>
              <FormControl>
                <Combobox
                  options={subheadOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select subhead…"
                  searchPlaceholder="Search subheads…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account number (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
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
                    <SelectValue />
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
        <FormField
          control={form.control}
          name="rank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Form>
  );
}

interface AccountChartFormProps {
  mode: "add" | "edit";
  subheadOptions: ComboboxOption[];
  initialData?: AccountChart;
  onSubmit: (data: AccountChartAddFormData | AccountChartEditFormData) => void;
  onCancel: () => void;
}

export function AccountChartForm({
  mode,
  subheadOptions,
  initialData,
  onSubmit,
  onCancel,
}: AccountChartFormProps) {
  if (mode === "add") {
    return (
      <AccountChartAddForm
        subheadOptions={subheadOptions}
        onSubmit={onSubmit as (data: AccountChartAddFormData) => void}
        onCancel={onCancel}
      />
    );
  }
  if (!initialData) return null;
  return (
    <AccountChartEditForm
      subheadOptions={subheadOptions}
      initialData={initialData}
      onSubmit={onSubmit as (data: AccountChartEditFormData) => void}
      onCancel={onCancel}
    />
  );
}
