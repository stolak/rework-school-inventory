import { useQuery } from "@tanstack/react-query";
import { privilegeApi, type Privilege } from "@/lib/api";

export type { Privilege };

export function usePrivileges() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["privileges"],
    queryFn: () => privilegeApi.list(),
  });

  const privileges: Privilege[] = (response?.data?.privileges ?? []).filter(
    (p) => Boolean(p.id?.trim()),
  );

  return { privileges, isLoading, error };
}
