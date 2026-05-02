import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserWithDisplay } from "@/hooks/useUsers";
import type { StoreAccessibleUserView } from "@/hooks/useStores";

interface StoreAccessPanelProps {
  accessibleUsers: StoreAccessibleUserView[];
  candidateUsers: UserWithDisplay[];
  usersLoading: boolean;
  accessPending: boolean;
  onAdd: (userId: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

export function StoreAccessPanel({
  accessibleUsers,
  candidateUsers,
  usersLoading,
  accessPending,
  onAdd,
  onRemove,
}: StoreAccessPanelProps) {
  const [userIdToAdd, setUserIdToAdd] = useState("");

  const existingIds = new Set(accessibleUsers.map((u) => u.id));
  const addOptions = candidateUsers
    .filter((u) => !existingIds.has(u.id))
    .map((u) => ({
      value: u.id,
      label: `${u.displayName} (${u.email})`,
    }));

  const handleAdd = async () => {
    if (!userIdToAdd) return;
    try {
      await onAdd(userIdToAdd);
      setUserIdToAdd("");
    } catch {
      /* toast from hook */
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div>
        <h4 className="text-sm font-medium mb-1">Users with access</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Grant or revoke sign-in / operational access to this store (in addition to the store manager).
        </p>
        {accessibleUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No additional users yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Access granted</TableHead>
                  <TableHead className="w-[100px] text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessibleUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {u.accessGrantedAt
                        ? new Date(u.accessGrantedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={accessPending}
                        onClick={async () => {
                          try {
                            await onRemove(u.id);
                          } catch {
                            /* toast from hook */
                          }
                        }}
                        aria-label={`Remove access for ${u.displayName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1 border-t">
        <div className="flex-1 space-y-2 min-w-0">
          <Label>Grant access to user</Label>
          {usersLoading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : addOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All available users already have access, or no users were returned from the server.
            </p>
          ) : (
            <Combobox
              value={userIdToAdd}
              onValueChange={setUserIdToAdd}
              options={addOptions}
              placeholder="Select user to add…"
              searchPlaceholder="Search users…"
            />
          )}
        </div>
        <Button
          type="button"
          className="shrink-0"
          disabled={
            !userIdToAdd || accessPending || usersLoading || addOptions.length === 0
          }
          onClick={handleAdd}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Grant access
        </Button>
      </div>
    </div>
  );
}
