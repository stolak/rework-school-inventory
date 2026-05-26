import { useMemo, useState } from "react";
import { LayoutList, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppMenu, AppRole, RoleMenu } from "@/lib/api";

interface RoleMenusPanelProps {
  role: AppRole;
  allMenus: AppMenu[];
  menusLoading: boolean;
  accessPending: boolean;
  onAssign: (menuIds: string[]) => void | Promise<unknown>;
  onRemove: (menuId: string) => void | Promise<unknown>;
}

function menuStatusBadge(status: string) {
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

export function RoleMenusPanel({
  role,
  allMenus,
  menusLoading,
  accessPending,
  onAssign,
  onRemove,
}: RoleMenusPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const assigned: RoleMenu[] = role.roleMenus ?? [];
  const assignedMenuIds = useMemo(
    () => new Set(assigned.map((rm) => rm.menuId)),
    [assigned],
  );

  const unassigned = useMemo(
    () => allMenus.filter((m) => !assignedMenuIds.has(m.id)),
    [allMenus, assignedMenuIds],
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
          <LayoutList className="h-4 w-4" />
          Assigned navigation menus
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Menu entries users with &ldquo;{role.name}&rdquo; can see in the app
          navigation.
        </p>
        {assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No menus assigned yet.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caption</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.map((rm) => {
                  const menu = rm.menu;
                  return (
                    <TableRow key={rm.id}>
                      <TableCell className="font-medium">
                        {menu?.caption ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {menu?.route ?? "—"}
                      </TableCell>
                      <TableCell>
                        {menu?.status
                          ? menuStatusBadge(menu.status)
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
                              await onRemove(rm.menuId);
                            } catch {
                              /* toast from hook */
                            }
                          }}
                          aria-label={`Remove menu ${menu?.caption ?? rm.menuId}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="pt-4 border-t space-y-3">
        <div>
          <h4 className="text-sm font-medium">Assign menus</h4>
          <p className="text-xs text-muted-foreground">
            Select active menu definitions to add to this role.
          </p>
        </div>
        {menusLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading menus…
          </p>
        ) : unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {allMenus.length === 0
              ? "No menus exist yet. Create menus under Setup → Menu management."
              : "All available menus are already assigned to this role."}
          </p>
        ) : (
          <>
            <ScrollArea className="h-[220px] rounded-md border p-3">
              <div className="space-y-3 pr-3">
                {unassigned.map((m) => (
                  <div key={m.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`menu-${role.id}-${m.id}`}
                      checked={selectedIds.includes(m.id)}
                      onCheckedChange={(checked) =>
                        toggleSelection(m.id, checked === true)
                      }
                      disabled={accessPending}
                    />
                    <div className="grid gap-0.5 leading-none min-w-0 flex-1">
                      <Label
                        htmlFor={`menu-${role.id}-${m.id}`}
                        className="text-sm cursor-pointer font-medium"
                      >
                        {m.caption}
                      </Label>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {m.route}
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
