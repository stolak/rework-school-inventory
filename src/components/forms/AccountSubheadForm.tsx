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
import type { AccountSubhead } from "@/hooks/useAccountSubheads";

const addSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  rank: z.coerce.number().int().min(0, "Rank must be 0 or greater"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

const editSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["Active", "Inactive"]),
  rank: z.coerce.number().int().min(0, "Rank must be 0 or greater"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export type AccountSubheadAddFormData = z.infer<typeof addSchema>;
export type AccountSubheadEditFormData = z.infer<typeof editSchema>;

function normalizeStatus(s: string | undefined): "Active" | "Inactive" {
  if (!s) return "Active";
  const lower = s.toLowerCase();
  return lower === "inactive" ? "Inactive" : "Active";
}

function AccountSubheadAddForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: AccountSubheadAddFormData) => void;
  onCancel: () => void;
}) {
  const form = useForm<AccountSubheadAddFormData>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      code: "",
      name: "",
      rank: 1,
      paymentMethod: "cash",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 7888" {...field} />
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
                <Input placeholder="Subhead name" {...field} />
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
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment method</FormLabel>
              <FormControl>
                <Input placeholder="e.g. cash" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create subhead</Button>
        </div>
      </form>
    </Form>
  );
}

function AccountSubheadEditForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData: AccountSubhead;
  onSubmit: (data: AccountSubheadEditFormData) => void;
  onCancel: () => void;
}) {
  const form = useForm<AccountSubheadEditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      code: initialData.code,
      name: initialData.name,
      status: normalizeStatus(initialData.status),
      rank: initialData.rank,
      paymentMethod: initialData.paymentMethod,
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
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment method</FormLabel>
              <FormControl>
                <Input {...field} />
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

interface AccountSubheadFormProps {
  mode: "add" | "edit";
  initialData?: AccountSubhead;
  onSubmit: (data: AccountSubheadAddFormData | AccountSubheadEditFormData) => void;
  onCancel: () => void;
}

export function AccountSubheadForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: AccountSubheadFormProps) {
  if (mode === "add") {
    return (
      <AccountSubheadAddForm
        onSubmit={onSubmit as (data: AccountSubheadAddFormData) => void}
        onCancel={onCancel}
      />
    );
  }
  if (!initialData) return null;
  return (
    <AccountSubheadEditForm
      initialData={initialData}
      onSubmit={onSubmit as (data: AccountSubheadEditFormData) => void}
      onCancel={onCancel}
    />
  );
}
