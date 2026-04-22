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
import { Brand } from "@/hooks/useBrands";

const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  initialData?: Partial<Brand>;
  onSubmit: (data: BrandFormData) => void;
  onCancel: () => void;
}

export function BrandForm({
  initialData,
  onSubmit,
  onCancel,
}: BrandFormProps) {
  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  const handleSubmit = (data: BrandFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter brand name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? "Update Brand" : "Add Brand"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
