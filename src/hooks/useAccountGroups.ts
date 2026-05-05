import { useQuery } from "@tanstack/react-query";
import { fetchAccountGroups, type AccountGroupTree } from "@/lib/api";

function unwrapGroups(
  res: Awaited<ReturnType<typeof fetchAccountGroups>>
): AccountGroupTree[] {
  if (!res.success) throw new Error(res.message || "Failed to load account groups");
  const raw = res.data as unknown as {
    accountGroups?: AccountGroupTree[];
    account_groups?: AccountGroupTree[];
  };
  return raw?.accountGroups ?? raw?.account_groups ?? [];
}

export function useAccountGroups() {
  return useQuery({
    queryKey: ["account-groups"],
    queryFn: async () => unwrapGroups(await fetchAccountGroups()),
    staleTime: 60_000,
  });
}

export type { AccountGroupTree };
