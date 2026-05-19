import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Facility } from "@/hooks/useFacilities";

const facilityBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(2, "Description must be at least 2 characters."),
});

const facilityEditSchema = facilityBaseSchema.extend({
  status: z.enum(["active", "inactive"]),
});

type FacilityCreateFormData = z.infer<typeof facilityBaseSchema>;
type FacilityEditFormData = z.infer<typeof facilityEditSchema>;

export type FacilityFormSubmitData = {
  name: string;
  description: string;
  status?: "active" | "inactive";
};

interface FacilityFormProps {
  isEdit?: boolean;
  initialData?: Partial<Facility>;
  onSubmit: (data: FacilityFormSubmitData) => void;
  onCancel: () => void;
}

export function FacilityForm({
  isEdit = false,
  initialData,
  onSubmit,
  onCancel,
}: FacilityFormProps) {
  const form = useForm<FacilityEditFormData | FacilityCreateFormData>({
    resolver: zodResolver(isEdit ? facilityEditSchema : facilityBaseSchema),
    defaultValues: isEdit
      ? {
          name: initialData?.name || "",
          description: initialData?.description || "",
          status: initialData?.status || "active",
        }
      : {
          name: initialData?.name || "",
          description: initialData?.description || "",
        },
  });

  useEffect(() => {
    if (isEdit) {
      form.reset({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        status: initialData?.status ?? "active",
      });
    } else {
      form.reset({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
      });
    }
  }, [
    form,
    isEdit,
    initialData?.id,
    initialData?.name,
    initialData?.description,
    initialData?.status,
  ]);

  const handleSubmit = (data: FacilityCreateFormData | FacilityEditFormData) => {
    const payload: FacilityFormSubmitData = {
      name: data.name,
      description: data.description,
    };
    if (isEdit && "status" in data) {
      payload.status = data.status;
    }
    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className={isEdit ? undefined : "md:col-span-2"}>
                <FormLabel>Facility name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter facility name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEdit ? (
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter facility description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{isEdit ? "Update facility" : "Add facility"}</Button>
        </div>
      </form>
    </Form>
  );
}
