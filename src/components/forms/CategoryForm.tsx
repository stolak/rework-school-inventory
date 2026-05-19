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
import { Combobox } from "@/components/ui/combobox";
import { Category, type CategoryType } from "@/hooks/useCategories";
import {
  consumableAccountChartLabel,
  useConsumableExpenseAccountCharts,
} from "@/hooks/useConsumableExpenseAccountCharts";

const categoryTypeValues = ["Consumable", "NonConsumable"] as const;

const categoryBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
  categoryType: z.enum(categoryTypeValues),
  consumableAccountId: z.string().optional(),
});

const categoryEditSchema = categoryBaseSchema.extend({
  status: z.enum(["active", "inactive"]),
});

type CategoryCreateFormData = z.infer<typeof categoryBaseSchema>;
type CategoryEditFormData = z.infer<typeof categoryEditSchema>;

export type CategoryFormSubmitData = {
  name: string;
  description: string;
  categoryType: CategoryType;
  consumableAccountId: number | null;
  status?: "active" | "inactive";
};

interface CategoryFormProps {
  isEdit?: boolean;
  initialData?: Partial<Category>;
  onSubmit: (data: CategoryFormSubmitData) => void;
  onCancel: () => void;
}

export function CategoryForm({
  isEdit = false,
  initialData,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const { accountCharts, isLoading: accountsLoading } = useConsumableExpenseAccountCharts();

  const accountOptions = accountCharts.map((a) => ({
    value: String(a.id),
    label: consumableAccountChartLabel(a),
  }));

  const consumableDefault = initialData?.consumableAccountId
    ? String(initialData.consumableAccountId)
    : "";

  const categoryTypeDefault: CategoryType =
    initialData?.categoryType === "NonConsumable" ? "NonConsumable" : "Consumable";

  const form = useForm<CategoryEditFormData | CategoryCreateFormData>({
    resolver: zodResolver(isEdit ? categoryEditSchema : categoryBaseSchema),
    defaultValues: isEdit
      ? {
          name: initialData?.name || "",
          description: initialData?.description || "",
          categoryType: categoryTypeDefault,
          consumableAccountId: consumableDefault,
          status: initialData?.status || "active",
        }
      : {
          name: initialData?.name || "",
          description: initialData?.description || "",
          categoryType: categoryTypeDefault,
          consumableAccountId: consumableDefault,
        },
  });

  useEffect(() => {
    const consumableId = initialData?.consumableAccountId
      ? String(initialData.consumableAccountId)
      : "";
    const type: CategoryType =
      initialData?.categoryType === "NonConsumable" ? "NonConsumable" : "Consumable";
    if (isEdit) {
      form.reset({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        categoryType: type,
        consumableAccountId: consumableId,
        status: initialData?.status ?? "active",
      });
    } else {
      form.reset({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        categoryType: type,
        consumableAccountId: consumableId,
      });
    }
  }, [
    form,
    isEdit,
    initialData?.id,
    initialData?.name,
    initialData?.description,
    initialData?.status,
    initialData?.categoryType,
    initialData?.consumableAccountId,
  ]);

  const handleSubmit = (data: CategoryCreateFormData | CategoryEditFormData) => {
    const accountId = data.consumableAccountId?.trim()
      ? parseInt(data.consumableAccountId, 10)
      : null;
    const payload: CategoryFormSubmitData = {
      name: data.name,
      description: data.description,
      categoryType: data.categoryType,
      consumableAccountId: Number.isFinite(accountId) ? accountId : null,
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
                <FormLabel>Category name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter category name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Consumable">Consumable</SelectItem>
                    <SelectItem value="NonConsumable">Non-consumable</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEdit ? (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
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
                <Textarea placeholder="Enter category description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consumableAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consumable expense account (optional)</FormLabel>
              {accountsLoading ? (
                <p className="text-sm text-muted-foreground">Loading accounts…</p>
              ) : (
                <Combobox
                  options={accountOptions}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  placeholder="Select GL account…"
                  searchPlaceholder="Search accounts…"
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{isEdit ? "Update category" : "Add category"}</Button>
        </div>
      </form>
    </Form>
  );
}