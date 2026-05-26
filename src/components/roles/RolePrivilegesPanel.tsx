import { useMemo, useState } from "react";
import { Loader2, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRole, AppRolePrivilege } from "@/lib/api";
import type { Privilege } from "@/hooks/usePrivileges";

interface RolePrivilegesPanelProps {
  role: AppRole;
  allPrivileges: Privilege[];
  privilegesLoading: boolean;
  accessPending: boolean;
  onAssign: (privilegeIds: string[]) => Promise<void>;
  onRemove: (privilegeId: string) => Promise<void>;
}

export function RolePrivilegesPanel({
  role,
  allPrivileges,
  privilegesLoading,
  accessPending,
  onAssign,
  onRemove,
}: RolePrivilegesPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const assigned: AppRolePrivilege[] = role.privileges ?? [];
  const assignedIds = useMemo(
    () => new Set(assigned.map((p) => p.id)),
    [assigned],
  );

  const unassigned = useMemo(
    () => allPrivileges.filter((p) => !assignedIds.has(p.id)),
    [allPrivileges, assignedIds],
  );

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) return;
    try {
      await onAssign(selectedIds);
      setSelectedIds([]);
    } catch {
      /* toast from hook */
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Assigned privileges
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Permissions granted to users with the &ldquo;{role.name}&rdquo; role.
        </p>
        {assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No privileges assigned yet.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Privilege</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px] text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.description}
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
                            await onRemove(p.id);
                          } catch {
                            /* toast from hook */
                          }
                        }}
                        aria-label={`Remove ${p.name}`}
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

      <div className="pt-4 border-t space-y-3">
        <div>
          <h4 className="text-sm font-medium">Assign privileges</h4>
          <p className="text-xs text-muted-foreground">
            Select one or more privileges, then assign them to this role.
          </p>
        </div>
        {privilegesLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading privileges…
          </p>
        ) : unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All available privileges are already assigned to this role.
          </p>
        ) : (
          <>
            <ScrollArea className="h-[220px] rounded-md border p-3">
              <div className="space-y-3 pr-3">
                {unassigned.map((p) => (
                  <div key={p.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`priv-${role.id}-${p.id}`}
                      checked={selectedIds.includes(p.id)}
                      onCheckedChange={(checked) =>
                        toggleSelection(p.id, checked === true)
                      }
                      disabled={accessPending}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor={`priv-${role.id}-${p.id}`}
                        className="font-mono text-sm cursor-pointer"
                      >
                        {p.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button
              type="button"
              size="sm"
              disabled={accessPending || selectedIds.length === 0}
              onClick={handleAssign}
            >
              {accessPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign selected ({selectedIds.length})
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
