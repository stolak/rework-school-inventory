import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UserWithDisplay } from "@/hooks/useUsers";
import type { StoreListItem } from "@/hooks/useStores";

const schema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
  managerId: z.string().min(1, "Select a store manager"),
});

export type StoreFormData = z.infer<typeof schema>;

interface StoreFormProps {
  initialData?: Partial<StoreListItem>;
  adminUsers: UserWithDisplay[];
  usersLoading?: boolean;
  onSubmit: (data: StoreFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function StoreForm({
  initialData,
  adminUsers,
  usersLoading,
  onSubmit,
  onCancel,
  submitLabel = "Save changes",
}: StoreFormProps) {
  const form = useForm<StoreFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description ?? "",
      status:
        String(initialData?.status ?? "").toLowerCase() === "inactive"
          ? "Inactive"
          : "Active",
      managerId: initialData?.managerId || "",
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
              <FormLabel>Store name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Main campus shop" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional description"
                  {...field}
                  value={field.value ?? ""}
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

        <FormField
          control={form.control}
          name="managerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store manager (Admin user)</FormLabel>
              {usersLoading ? (
                <p className="text-sm text-muted-foreground">Loading users…</p>
              ) : adminUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Admin users available.
                </p>
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    {adminUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.displayName} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-primary"
            disabled={usersLoading || adminUsers.length === 0}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
