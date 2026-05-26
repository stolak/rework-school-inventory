import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  staffApi,
  type Staff,
  type StaffPosition,
  type StaffStatus,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type StaffCreateInput = {
  StaffNumber: string;
  email: string;
  name: string;
  position: StaffPosition | string;
  status: StaffStatus;
  profileImageUrl?: string;
  password: string;
  phoneNumber?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  appRoleId: string;
  userType: string;
};

export type StaffUpdateInput = {
  StaffNumber?: string;
  name?: string;
  position?: StaffPosition | string;
  status?: StaffStatus;
  profileImageUrl?: string;
};

export function useStaffManagement(params?: {
  q?: string;
  position?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: [
      "staff",
      "manage",
      params?.q ?? null,
      params?.position ?? null,
      params?.status ?? null,
      page,
      limit,
    ],
    queryFn: () =>
      staffApi.list({
        q: params?.q,
        position: params?.position,
        status: params?.status,
        page,
        limit,
      }),
  });

  const staff: Staff[] = response?.data?.staff ?? [];
  const pagination = response?.data?.pagination;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["staff"] });

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Staff created successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create staff",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffUpdateInput }) =>
      staffApi.update(id, data),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Staff updated successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update staff",
        variant: "destructive",
      });
    },
  });

  return {
    staff,
    pagination,
    isLoading,
    error,
    refetch,
    createStaff: createMutation.mutateAsync,
    updateStaff: (id: string, data: StaffUpdateInput) =>
      updateMutation.mutateAsync({ id, data }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
