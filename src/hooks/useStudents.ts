import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: "male" | "female" | "other";
  date_of_birth?: string;
  class_id?: string;
  className?: string; // for display purposes - populated from classes
  guardian_name: string;
  guardian_contact: string;
  guardian_email?: string;
  student_email?: string;
  address?: string;
  status: "active" | "inactive" | "graduated";
  itemsReceived?: number; // for display purposes
  itemsPending?: number; // for display purposes
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Nested objects from API response
  school_classes?: {
    id: string;
    name: string;
  };
}

export const useStudents = (params?: {
  status?: "active" | "inactive" | "graduated";
  class_id?: string;
  gender?: "male" | "female" | "other";
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawStudents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students", params],
    queryFn: () => studentApi.list(params),
  });

  // Transform backend data to frontend format
  const students: Student[] = rawStudents.map((student: any) => ({
    id: student.id,
    admission_number: student.admission_number,
    first_name: student.first_name,
    middle_name: student.middle_name,
    last_name: student.last_name,
    gender: student.gender,
    date_of_birth: student.date_of_birth,
    class_id: student.class_id,
    className: student.school_classes?.name || "No Class", // Populated from nested school_classes
    guardian_name: student.guardian_name,
    guardian_contact: student.guardian_contact,
    guardian_email: student.guardian_email,
    student_email: student.student_email,
    address: student.address,
    status: student.status,
    itemsReceived: 0, // This would need to be calculated from transactions
    itemsPending: 0, // This would need to be calculated from transactions
    created_by: student.created_by,
    created_at: student.created_at,
    updated_at: student.updated_at,
    // Include nested object for additional data access
    school_classes: student.school_classes,
  }));

  const addMutation = useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      studentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  return {
    students,
    isLoading,
    error,
    addStudent: addMutation.mutate,
    updateStudent: (id: string, data: Partial<Student>) =>
      updateMutation.mutate({ id, data }),
    deleteStudent: deleteMutation.mutate,
    getStudent: (id: string) => students.find((student) => student.id === id),
  };
};
