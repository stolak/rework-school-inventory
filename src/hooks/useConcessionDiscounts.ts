import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { concessionDiscountsApi, type BillingItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type ConcessionDiscountType = "CONCESSION" | "DISCOUNT";
export type ConcessionDiscountCalculationType = "PERCENTAGE" | "FIXED_AMOUNT";

export type ConcessionDiscountRow = {
  id: number;
  code: string;
  name: string;
  type: ConcessionDiscountType;
  calculationType: ConcessionDiscountCalculationType;
  value: number;
  maxLimit: number;
  status: string;
  accountId: number;
  appliesTo: BillingItem[];
  appliesToIds: number[];
  account?: {
    id: number;
    accountDescription?: string;
  };
};

function toNumber(v: string | number | undefined): number {
  if (v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function useConcessionDiscounts(params: {
  status: string;
  page: number;
  limit: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listQuery = useQuery({
    queryKey: ["concession-discounts", params],
    queryFn: async () => {
      const res = await concessionDiscountsApi.list(params);
      if (!res.success) throw new Error(res.message || "Failed to load concession discounts");
      const raw = res.data as any;
      const items: any[] = raw?.concessionDiscounts ?? [];
      const mapped: ConcessionDiscountRow[] = items.map((d) => {
        const appliesTo: BillingItem[] = (d.appliesTo ?? []) as BillingItem[];
        return {
          id: d.id,
          code: d.code ?? "",
          name: d.name ?? "",
          type: d.type as ConcessionDiscountType,
          calculationType: d.calculationType as ConcessionDiscountCalculationType,
          value: toNumber(d.value),
          maxLimit: toNumber(d.maxLimit),
          status: d.status ?? "Active",
          accountId: d.accountId,
          appliesTo,
          appliesToIds: appliesTo.map((x) => x.id),
          account: d.account ?? undefined,
        };
      });

      return {
        concessionDiscounts: mapped,
        pagination: raw?.pagination ?? null,
      };
    },
  });

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["concession-discounts"] });
  };

  const createMutation = useMutation({
    mutationFn: (body: {
      code: string;
      name: string;
      type: ConcessionDiscountType;
      calculationType: ConcessionDiscountCalculationType;
      value: number;
      accountId: number;
      appliesToIds: number[];
      maxLimit: number;
      status: string;
    }) => concessionDiscountsApi.create(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Concession/discount created successfully",
      });
      invalidateLists();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create concession/discount",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: {
      id: number;
      data: {
        code: string;
        name: string;
        type: ConcessionDiscountType;
        calculationType: ConcessionDiscountCalculationType;
        value: number;
        accountId: number;
        appliesToIds: number[];
        maxLimit: number;
        status: string;
      };
    }) => concessionDiscountsApi.update(body.id, body.data as any),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Concession/discount updated successfully",
      });
      invalidateLists();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update concession/discount",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => concessionDiscountsApi.remove(id),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Concession/discount deleted successfully",
      });
      invalidateLists();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete concession/discount",
        variant: "destructive",
      });
    },
  });

  return {
    concessionDiscounts: listQuery.data?.concessionDiscounts ?? [],
    pagination: listQuery.data?.pagination ?? null,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    createConcessionDiscount: createMutation.mutateAsync,
    updateConcessionDiscount: updateMutation.mutateAsync,
    deleteConcessionDiscount: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

