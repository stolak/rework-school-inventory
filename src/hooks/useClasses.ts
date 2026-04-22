import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface SchoolClass {
  id: string;
  name: string;
  totalStudents?: number; // for display purposes
  distributionProgress?: number; // for display purposes
  totalItems?: number; // for display purposes
  distributedItems?: number; // for display purposes
  status: "active" | "inactive" | "archived";
  session?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const useClasses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawClasses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: classApi.list,
  });

  // Transform backend data to frontend format
  const classes: SchoolClass[] = rawClasses.map((classItem: any) => ({
    id: classItem.id,
    name: classItem.name,
    totalStudents: 0, // This would need to be calculated from students
    distributionProgress: 0, // This would need to be calculated
    totalItems: 0, // This would need to be calculated
    distributedItems: 0, // This would need to be calculated
    status: classItem.status,
    session: classItem.session,
    created_by: classItem.created_by,
    created_at: classItem.created_at,
    updated_at: classItem.updated_at,
  }));

  const addMutation = useMutation({
    mutationFn: classApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add class",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SchoolClass> }) =>
      classApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class",
        variant: "destructive",
      });
    },
  });

  return {
    classes,
    isLoading,
    error,
    addClass: addMutation.mutate,
    updateClass: (id: string, data: Partial<SchoolClass>) =>
      updateMutation.mutate({ id, data }),
    deleteClass: deleteMutation.mutate,
    getClass: (id: string) => classes.find((classItem) => classItem.id === id),
  };
};
