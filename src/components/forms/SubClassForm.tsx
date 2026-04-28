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
import { useClasses } from "@/hooks/useClasses";
import type { SubClass } from "@/hooks/useSubClasses";

const schema = z.object({
  name: z.string().min(1, "Sub class name is required"),
  classId: z.string().min(1, "Class is required"),
  status: z.enum(["Active", "Inactive"]),
});

export type SubClassFormData = z.infer<typeof schema>;

interface SubClassFormProps {
  initialData?: Partial<SubClass>;
  mode?: "add" | "edit" | "view";
  onSubmit: (data: SubClassFormData) => void;
  onCancel: () => void;
}

export function SubClassForm({
  initialData,
  mode,
  onSubmit,
  onCancel,
}: SubClassFormProps) {
  const { classes } = useClasses({ page: 1, limit: 100 });

  const form = useForm<SubClassFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      classId: initialData?.classId || "",
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
              <FormLabel>Sub Class Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter sub class name (e.g., A)" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {initialData?.id ? "Update Sub Class" : "Create Sub Class"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

