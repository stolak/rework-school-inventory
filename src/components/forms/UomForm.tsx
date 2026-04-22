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
import { Uom } from "@/hooks/useUoms";

const uomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
});

type UomFormData = z.infer<typeof uomSchema>;

interface UomFormProps {
  initialData?: Uom;
  onSubmit: (data: UomFormData) => void;
  onCancel: () => void;
}

export function UomForm({ initialData, onSubmit, onCancel }: UomFormProps) {
  const form = useForm<UomFormData>({
    resolver: zodResolver(uomSchema),
    defaultValues: {
      name: initialData?.name || "",
      symbol: initialData?.symbol || "",
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter unit name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input placeholder="Enter unit symbol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? "Update" : "Add"} Unit
          </Button>
        </div>
      </form>
    </Form>
  );
}
