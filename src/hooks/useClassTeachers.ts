import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classTeachersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface ClassTeacher {
  id: string;
  class_id: string;
  session_term_id?: string;
  teacher_id?: string;
  email: string;
  name: string;
  role: "class_teacher" | "assistant_teacher" | "subject_teacher";
  status: "active" | "inactive" | "archived";
  assigned_at: string;
  unassigned_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Display fields populated from API response
  className?: string; // populated from school_classes
  // Nested objects from API response
  school_classes?: {
    id: string;
    name: string;
  };
}

export const useClassTeachers = (params?: {
  class_id?: string;
  session_term_id?: string;
  status?: "active" | "inactive" | "archived";
  role?: "class_teacher" | "assistant_teacher" | "subject_teacher";
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawClassTeachers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["class-teachers", params],
    queryFn: () => classTeachersApi.list(params),
  });

  // Transform backend data to frontend format
  const classTeachers: ClassTeacher[] = rawClassTeachers.map(
    (teacher: any) => ({
      id: teacher.id,
      class_id: teacher.class_id,
      session_term_id: teacher.session_term_id,
      teacher_id: teacher.teacher_id,
      email: teacher.email,
      name: teacher.name,
      role: teacher.role,
      status: teacher.status,
      assigned_at: teacher.assigned_at,
      unassigned_at: teacher.unassigned_at,
      created_by: teacher.created_by,
      created_at: teacher.created_at,
      updated_at: teacher.updated_at,
      // Populate display names from nested objects
      className: teacher.school_classes?.name || "No Class",
      // Include nested objects for additional data access
      school_classes: teacher.school_classes,
    })
  );

  const addMutation = useMutation({
    mutationFn: (data: any) => {
      const transformedData = {
        ...data,
        class_id: data.class_id === "none" ? undefined : data.class_id,
      };
      return classTeachersApi.create(transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-teachers"] });
      toast({
        title: "Success",
        description: "Class teacher added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add class teacher",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassTeacher> }) => {
      const transformedData = {
        ...data,
        class_id: data.class_id === "none" ? undefined : data.class_id,
      };
      return classTeachersApi.update(id, transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-teachers"] });
      toast({
        title: "Success",
        description: "Class teacher updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class teacher",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classTeachersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-teachers"] });
      toast({
        title: "Success",
        description: "Class teacher deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class teacher",
        variant: "destructive",
      });
    },
  });

  const getClassTeacher = (id: string) => {
    return classTeachers.find((teacher) => teacher.id === id);
  };

  const getClassTeachersByClass = (classId: string) => {
    return classTeachers.filter((teacher) => teacher.class_id === classId);
  };

  const getClassTeachersBySession = (sessionId: string) => {
    return classTeachers.filter(
      (teacher) => teacher.session_term_id === sessionId
    );
  };

  const getActiveTeachers = () => {
    return classTeachers.filter((teacher) => teacher.status === "active");
  };

  return {
    classTeachers,
    isLoading,
    error,
    addClassTeacher: addMutation.mutate,
    updateClassTeacher: (id: string, data: Partial<ClassTeacher>) =>
      updateMutation.mutate({ id, data }),
    deleteClassTeacher: deleteMutation.mutate,
    getClassTeacher,
    getClassTeachersByClass,
    getClassTeachersBySession,
    getActiveTeachers,
  };
};
