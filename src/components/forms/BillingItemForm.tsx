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
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComboboxOption } from "@/components/ui/combobox";
import type { BillingItem } from "@/lib/api";

const addSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  optional: z.boolean(),
});

const editSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  optional: z.boolean(),
  status: z.enum(["Active", "Inactive"]),
});

export type BillingItemAddFormData = z.infer<typeof addSchema>;
export type BillingItemEditFormData = z.infer<typeof editSchema>;

function normalizeStatus(s: string | undefined): "Active" | "Inactive" {
  if (!s) return "Active";
  return s.toLowerCase() === "inactive" ? "Inactive" : "Active";
}

function BillingItemAddForm({
  categoryOptions,
  accountOptions,
  onSubmit,
  onCancel,
}: {
  categoryOptions: ComboboxOption[];
  accountOptions: ComboboxOption[];
  onSubmit: (data: BillingItemAddFormData) => void;
  onCancel: () => void;
}) {
  const form = useForm<BillingItemAddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "",
      accountId: "",
      optional: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Input placeholder="e.g. Tuition Fee" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Combobox
                  options={categoryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select category…"
                  searchPlaceholder="Search categories…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
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
        <FormField
          control={form.control}
          name="optional"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 rounded-md border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Optional</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Mark this billing item as optional for students.
                </div>
                <FormMessage />
              </div>
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

function BillingItemEditForm({
  initialData,
  categoryOptions,
  accountOptions,
  onSubmit,
  onCancel,
}: {
  initialData: BillingItem;
  categoryOptions: ComboboxOption[];
  accountOptions: ComboboxOption[];
  onSubmit: (data: BillingItemEditFormData) => void;
  onCancel: () => void;
}) {
  const form = useForm<BillingItemEditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      code: initialData.code,
      name: initialData.name,
      category: initialData.category,
      accountId: String(initialData.accountId),
      optional: Boolean(initialData.optional),
      status: normalizeStatus(initialData.status),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Combobox
                  options={categoryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select category…"
                  searchPlaceholder="Search categories…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
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
          name="optional"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 rounded-md border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Optional</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Mark this billing item as optional for students.
                </div>
                <FormMessage />
              </div>
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

interface BillingItemFormProps {
  mode: "add" | "edit";
  initialData?: BillingItem;
  categoryOptions: ComboboxOption[];
  accountOptions: ComboboxOption[];
  onSubmit: (data: BillingItemAddFormData | BillingItemEditFormData) => void;
  onCancel: () => void;
}

export function BillingItemForm({
  mode,
  initialData,
  categoryOptions,
  accountOptions,
  onSubmit,
  onCancel,
}: BillingItemFormProps) {
  if (mode === "add") {
    return (
      <BillingItemAddForm
        categoryOptions={categoryOptions}
        accountOptions={accountOptions}
        onSubmit={onSubmit as (data: BillingItemAddFormData) => void}
        onCancel={onCancel}
      />
    );
  }
  if (!initialData) return null;
  return (
    <BillingItemEditForm
      initialData={initialData}
      categoryOptions={categoryOptions}
      accountOptions={accountOptions}
      onSubmit={onSubmit as (data: BillingItemEditFormData) => void}
      onCancel={onCancel}
    />
  );
}

