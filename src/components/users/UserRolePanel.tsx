import { useState } from "react";
import { Loader2, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppRole } from "@/lib/api";
import type { ManagedUser } from "@/hooks/useUserManagement";

interface UserRolePanelProps {
  user: ManagedUser;
  allRoles: AppRole[];
  rolesLoading: boolean;
  accessPending: boolean;
  onAssign: (roleId: string) => void | Promise<unknown>;
  onRemove: (roleId: string) => void | Promise<unknown>;
}

function roleStatusBadge(status: string) {
  const active = status?.toLowerCase() === "active";
  return (
    <Badge
      variant="secondary"
      className={
        active
          ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning"
      }
    >
      {active ? "Active" : status || "—"}
    </Badge>
  );
}

export function UserRolePanel({
  user,
  allRoles,
  rolesLoading,
  accessPending,
  onAssign,
  onRemove,
}: UserRolePanelProps) {
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const currentRole = user.appRole ?? user.appRoles?.[0] ?? null;

  const handleAssign = async () => {
    if (!selectedRoleId) return;
    try {
      await onAssign(selectedRoleId);
      setSelectedRoleId("");
    } catch {
      /* toast from hook */
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Application role
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          The role defines default privileges and menus for {user.displayName}.
        </p>
        {currentRole ? (
          <div className="rounded-md border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium">{currentRole.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {currentRole.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {roleStatusBadge(currentRole.status)}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={accessPending}
                onClick={async () => {
                  try {
                    await onRemove(currentRole.id);
                  } catch {
                    /* toast from hook */
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove role
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No application role assigned.
          </p>
        )}
      </div>

      <div className="pt-4 border-t space-y-3">
        <div>
          <h4 className="text-sm font-medium">
            {currentRole ? "Change role" : "Assign role"}
          </h4>
          <p className="text-xs text-muted-foreground">
            Select an active role to assign to this user.
          </p>
        </div>
        {rolesLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading roles…
          </p>
        ) : allRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No roles available. Create roles under Setup → Role management.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-2 min-w-0">
              <Label>Role</Label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={accessPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={accessPending || !selectedRoleId}
              onClick={handleAssign}
            >
              {accessPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign role
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
