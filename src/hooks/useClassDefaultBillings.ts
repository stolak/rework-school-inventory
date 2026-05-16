import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classDefaultBillingsApi,
  type ClassDefaultBillingBulkItem,
  type ClassDefaultBillingRow,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type ClassDefaultBillingsListParams = {
  classId: string;
  subclassId: string;
  session: string;
  term: string;
};

export type BulkClassDefaultBillingsBody = ClassDefaultBillingsListParams & {
  items: ClassDefaultBillingBulkItem[];
};

function unwrapList(
  res: Awaited<ReturnType<typeof classDefaultBillingsApi.list>>
): ClassDefaultBillingRow[] {
  if (!res.success) throw new Error(res.message || "Failed to load class default billings");
  return Array.isArray(res.data) ? res.data : [];
}

export function useClassDefaultBillingsQuery(params: ClassDefaultBillingsListParams | null) {
  const enabled =
    Boolean(params?.classId) &&
    Boolean(params?.subclassId) &&
    Boolean(params?.session) &&
    Boolean(params?.term);

  return useQuery({
    queryKey: ["class-default-billings", params],
    queryFn: async () => {
      if (!params) throw new Error("Missing filters");
      return unwrapList(await classDefaultBillingsApi.list(params));
    },
    enabled,
    staleTime: 15_000,
  });
}

export function useClassDefaultBillingsMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["class-default-billings"] });
  };

  const bulkCreate = useMutation({
    mutationFn: (body: BulkClassDefaultBillingsBody) =>
      classDefaultBillingsApi.bulkCreate(body),
    onSuccess: (res) => {
      const count = res.data?.count;
      toast({
        title: "Success",
        description:
          res.message ||
          (count != null
            ? `${count} default billing line${count === 1 ? "" : "s"} created`
            : "Class default billings created"),
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class default billings",
        variant: "destructive",
      });
    },
  });

  const updateAmount = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      classDefaultBillingsApi.update(id, { amount }),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Default billing updated",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default billing",
        variant: "destructive",
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => classDefaultBillingsApi.remove(id),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Default billing deleted",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete default billing",
        variant: "destructive",
      });
    },
  });

  return {
    bulkCreate: bulkCreate.mutateAsync,
    updateAmount: updateAmount.mutateAsync,
    remove: remove.mutateAsync,
    isBulkCreating: bulkCreate.isPending,
    isUpdating: updateAmount.isPending,
    isDeleting: remove.isPending,
  };
}
