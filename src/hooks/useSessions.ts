import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Session {
  id: string;
  session: string; // e.g., "2025/2026"
  name: string; // e.g., "First Term"
  start_date: string;
  end_date: string;
  status: "active" | "inactive" | "archived";
  totalClasses?: number; // for display purposes
  totalStudents?: number; // for display purposes
  created_at?: string;
}

export const useSessions = (params?: {
  status?: "active" | "inactive" | "archived";
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawSessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sessions", params],
    queryFn: () => sessionApi.list(params),
  });

  // Transform backend data to frontend format
  const sessions: Session[] = rawSessions.map((session: any) => ({
    id: session.id,
    session: session.session,
    name: session.name,
    start_date: session.start_date,
    end_date: session.end_date,
    status: session.status,
    totalClasses: 0, // This would need to be calculated from classes
    totalStudents: 0, // This would need to be calculated from students
    created_at: session.created_at,
  }));

  const addMutation = useMutation({
    mutationFn: sessionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Success",
        description: "Session added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add session",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Session> }) =>
      sessionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Success",
        description: "Session updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update session",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sessionApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Success",
        description: "Session deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete session",
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    error,
    addSession: addMutation.mutate,
    updateSession: (id: string, data: Partial<Session>) =>
      updateMutation.mutate({ id, data }),
    deleteSession: deleteMutation.mutate,
    getSession: (id: string) => sessions.find((session) => session.id === id),
  };
};
