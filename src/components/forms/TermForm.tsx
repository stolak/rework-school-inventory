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
import type { Term } from "@/hooks/useTerms";

const schema = z.object({
  name: z.string().min(1, "Term name is required (e.g., First Term)"),
  status: z.enum(["Active", "Inactive"]),
});

export type TermFormData = z.infer<typeof schema>;

interface TermFormProps {
  initialData?: Partial<Term>;
  mode?: "add" | "edit" | "view";
  onSubmit: (data: TermFormData) => void;
  onCancel: () => void;
}

export function TermForm({ initialData, mode, onSubmit, onCancel }: TermFormProps) {
  const form = useForm<TermFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      status: (initialData?.status as any) || "Active",
    },
  });

  const disabled = mode === "view";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Term</FormLabel>
              <FormControl>
                <Input placeholder="e.g., First Term" {...field} disabled={disabled} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {mode !== "view" && (
            <Button type="submit" className="bg-gradient-primary">
              {initialData?.id ? "Update Term" : "Create Term"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

