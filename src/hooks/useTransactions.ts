import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseTransactionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Transaction {
  id: string;
  item_id: string;
  itemName: string; // for display purposes - populated from inventory items
  supplier_id?: string;
  supplierName: string; // for display purposes - populated from suppliers
  receiver_id?: string;
  supplier_receiver?: string;
  transaction_type: "purchase" | "sale" | "distribution";
  qty_in: number;
  in_cost: number;
  qty_out?: number;
  out_cost?: number;
  status: "pending" | "cancelled" | "deleted" | "completed";
  reference_no?: string;
  notes?: string;
  transaction_date?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const useTransactions = (params?: {
  item_id?: string;
  transaction_type?: "purchase" | "sale" | "distribution";
  from_date?: string;
  to_date?: string;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawTransactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory-transactions", params],
    queryFn: () => purchaseTransactionApi.list(params),
  });

  // Transform backend data to frontend format
  const transactions: Transaction[] = rawTransactions.map(
    (transaction: any) => ({
      id: transaction.id,
      item_id: transaction.item_id,
      itemName: transaction.inventory_items?.name || "Unknown Item", // Populated from inventory items
      supplier_id: transaction.supplier_id,
      supplierName: transaction.suppliers?.name || "No Supplier", // Populated from suppliers
      receiver_id: transaction.receiver_id,
      customer_name: transaction.supplier_receiver, // For sales transactions
      supplier_receiver: transaction.supplier_receiver,
      transaction_type: transaction.transaction_type,
      qty_in: transaction.qty_in || 0,
      in_cost: transaction.in_cost || 0,
      qty_out: transaction.qty_out || 0,
      out_cost: transaction.out_cost || 0,
      status: transaction.status,
      reference_no: transaction.reference_no,
      notes: transaction.notes,
      transaction_date: transaction.transaction_date,
      created_by: transaction.created_by,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    })
  );

  const addMutation = useMutation({
    mutationFn: purchaseTransactionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      purchaseTransactionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: purchaseTransactionApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const getPurchaseTransactions = () => {
    return transactions.filter(
      (transaction) => transaction.transaction_type === "purchase"
    );
  };

  const getSaleTransactions = () => {
    return transactions.filter(
      (transaction) => transaction.transaction_type === "sale"
    );
  };
  const getDistributionTransactions = () => {
    return transactions.filter(
      (transaction) => transaction.transaction_type === "distribution"
    );
  };

  const getTransaction = (id: string) => {
    return transactions.find((transaction) => transaction.id === id);
  };

  return {
    transactions,
    purchaseTransactions: getPurchaseTransactions(),
    saleTransactions: getSaleTransactions(),
    isLoading,
    error,
    addTransaction: addMutation.mutate,
    updateTransaction: (id: string, data: Partial<Transaction>) =>
      updateMutation.mutate({ id, data }),
    deleteTransaction: deleteMutation.mutate,
    getTransaction,
  };
};
