import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentEmail?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  classId?: string;
  className?: string;
  guardianName: string;
  guardianContact: string;
  guardianEmail?: string;
  address?: string;
  status: string;
  itemsReceived?: number;
  itemsPending?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  class?: { id: string; name: string };
}

export type StudentCreatePayload = Omit<
  Student,
  | "id"
  | "className"
  | "itemsReceived"
  | "itemsPending"
  | "createdBy"
  | "createdAt"
  | "updatedAt"
  | "class"
  | "status"
>;

function sanitizeStudentPayload<T extends Record<string, unknown>>(body: T): T {
  const next = { ...body } as Record<string, unknown>;
  for (const key of Object.keys(next)) {
    if (next[key] === "") delete next[key];
  }
  return next as T;
}

export const useStudents = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  classId?: string;
  class_id?: string;
  gender?: "male" | "female" | "other";
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["students", page, limit, params?.status, params?.classId ?? params?.class_id ?? null, params?.gender ?? null],
    queryFn: () =>
      studentApi.list({
        page,
        limit,
        status: params?.status,
        classId: params?.classId ?? params?.class_id,
        gender: params?.gender,
      }),
  });

  const rawStudents = (response as any)?.data?.students ?? [];
  const pagination = (response as any)?.data?.pagination;

  const students: Student[] = rawStudents.map((student: any) => ({
    id: student.id,
    admissionNumber: student.admissionNumber,
    firstName: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
    studentEmail: student.studentEmail,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    classId: student.classId,
    className: student.class?.name ?? "No Class",
    guardianName: student.guardianName,
    guardianContact: student.guardianContact,
    guardianEmail: student.guardianEmail,
    address: student.address,
    status: student.status,
    itemsReceived: student.itemsReceived ?? 0,
    itemsPending: student.itemsPending ?? 0,
    createdBy: student.createdBy
      ? `${student.createdBy.firstName ?? ""} ${student.createdBy.lastName ?? ""}`.trim()
      : undefined,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    class: student.class,
  }));

  const addMutation = useMutation({
    mutationFn: (body: StudentCreatePayload) =>
      studentApi.create(sanitizeStudentPayload(body as Record<string, unknown>)),
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
      studentApi.update(id, sanitizeStudentPayload(data as Record<string, unknown>)),
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
    pagination,
    isLoading,
    error,
    addStudent: addMutation.mutateAsync,
    updateStudent: (id: string, data: Partial<Student>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteStudent: deleteMutation.mutateAsync,
    getStudent: (id: string) => students.find((student) => student.id === id),
  };
};
