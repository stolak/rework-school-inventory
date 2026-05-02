import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { ProjectRow } from "@/hooks/useProjects";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

export type ProjectFormData = z.infer<typeof schema>;

interface ProjectFormProps {
  initialData?: Partial<ProjectRow>;
  mode?: "add" | "edit" | "view";
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
}

export function ProjectForm({
  initialData,
  mode = "add",
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description ?? "",
      status:
        (initialData?.status === "Inactive" ? "Inactive" : "Active") as
          | "Active"
          | "Inactive",
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Project name" {...field} disabled={disabled} />
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
                <Textarea
                  placeholder="Optional description"
                  rows={4}
                  {...field}
                  disabled={disabled}
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
              >
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
              {initialData?.id ? "Update Project" : "Create Project"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
