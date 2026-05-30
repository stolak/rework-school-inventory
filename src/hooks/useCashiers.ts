import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cashiersApi,
  type Cashier,
  type Pagination,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type { Cashier };

export type CreateCashierInput = {
  name: string;
  staffId: string;
  accountChartId: number;
};

export type UpdateCashierInput = {
  name?: string;
  staffId?: string;
  accountChartId?: number;
  status?: string;
};

function unwrapCashiers(res: Awaited<ReturnType<typeof cashiersApi.list>>): {
  cashiers: Cashier[];
  pagination: Pagination | null;
} {
  if (!res?.success) throw new Error(res?.message || "Failed to load cashiers");
  return {
    cashiers: res.data?.cashiers ?? [],
    pagination: res.data?.pagination ?? null,
  };
}

export function cashierStaffLabel(row: Cashier): string {
  if (row.Staff?.name?.trim()) return row.Staff.name.trim();
  if (row.user) {
    const name = `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim();
    if (name) return name;
  }
  return row.staffId;
}

export function cashierLedgerLabel(row: Cashier): string {
  const ledger = row.ledger;
  if (!ledger) return "—";
  const no = ledger.accountNo?.trim();
  const desc = ledger.accountDescription?.trim();
  if (no && desc) return `${no} — ${desc}`;
  return desc || no || "—";
}

export function useCashiers(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listQuery = useQuery({
    queryKey: [
      "cashiers",
      params?.status ?? "Active",
      params?.page ?? 1,
      params?.limit ?? 20,
    ],
    queryFn: async () =>
      unwrapCashiers(
        await cashiersApi.list({
          status: params?.status,
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
        })
      ),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cashiers"] });
  };

  const createMutation = useMutation({
    mutationFn: (body: CreateCashierInput) => cashiersApi.create(body),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res?.message || "Cashier created successfully",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create cashier",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCashierInput }) =>
      cashiersApi.update(id, data),
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res?.message || "Cashier updated successfully",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update cashier",
        variant: "destructive",
      });
    },
  });

  return {
    cashiers: listQuery.data?.cashiers ?? [],
    pagination: listQuery.data?.pagination ?? null,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,
    createCashier: createMutation.mutateAsync,
    updateCashier: updateMutation.mutateAsync,
  };
}
