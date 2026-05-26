import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  LayoutList,
  Loader2,
  Save,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleDialog } from "@/components/dialogs/RoleDialog";
import { RoleAccessPanel } from "@/components/roles/RoleAccessPanel";
import { useAppRoles } from "@/hooks/useAppRoles";
import { usePrivileges } from "@/hooks/usePrivileges";
import { useMenus } from "@/hooks/useMenus";
import type { AppRole } from "@/lib/api";

type StatusFilter = "all" | "active" | "inactive";

function formatStatusLabel(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "Active";
  if (s === "inactive") return "Inactive";
  return status;
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  const variants: Record<string, string> = {
    active: "bg-success/10 text-success",
    inactive: "bg-warning/10 text-warning",
  };
  return (
    <Badge
      variant="secondary"
      className={variants[s] ?? "bg-muted text-muted-foreground"}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
}

export default function AppRoles() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [searchTerm, setSearchTerm] = useState("");

  const [createName, setCreateName] = useState("");
  const [createStatus, setCreateStatus] = useState<"active" | "inactive">(
    "active",
  );

  const listStatus = statusFilter === "all" ? undefined : statusFilter;

  const {
    roles,
    isLoading,
    createRole,
    updateRole,
    assignPrivileges,
    removePrivilege,
    assignMenus,
    removeMenu,
    isCreating,
    isUpdating,
    isAccessPending,
  } = useAppRoles({ status: listStatus });

  const { privileges: allPrivileges, isLoading: privilegesLoading } =
    usePrivileges();

  const { menus: allMenus, isLoading: menusLoading } = useMenus({
    status: "Active",
  });

  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AppRole | undefined>();

  const filteredRoles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => {
      const inName = r.name.toLowerCase().includes(q);
      const inPrivileges = (r.privileges ?? []).some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
      const inMenus = (r.roleMenus ?? []).some((rm) => {
        const menu = rm.menu;
        if (!menu) return false;
        return (
          menu.caption.toLowerCase().includes(q) ||
          menu.route.toLowerCase().includes(q)
        );
      });
      return inName || inPrivileges || inMenus;
    });
  }, [roles, searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    try {
      await createRole({
        name: createName.trim(),
        status: createStatus,
      });
      setCreateName("");
      setCreateStatus("active");
    } catch {
      /* toast from hook */
    }
  };

  const handleEdit = (role: AppRole) => {
    setEditingRole(role);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: {
    name: string;
    status: "active" | "inactive";
  }) => {
    if (!editingRole) return;
    await updateRole(editingRole.id, data);
    setEditingRole(undefined);
  };

  const toggleExpand = (id: string) => {
    setExpandedRoleId((prev) => (prev === id ? null : id));
  };

  const TABLE_COL_SPAN = 6;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Role management
        </h1>
        <p className="text-muted-foreground mt-1">
          Create roles, assign privileges (what users can do), and navigation
          menus (what they can see).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create role</CardTitle>
          <CardDescription>
            New roles start with no privileges or menus. Expand a role to
            configure access on the Privileges and Menus tabs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-role-name">Role name</Label>
                <Input
                  id="new-role-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Store Manager"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createStatus}
                  onValueChange={(v) =>
                    setCreateStatus(v as "active" | "inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="bg-gradient-primary"
              disabled={isCreating || !createName.trim()}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save role
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles ({filteredRoles.length})</CardTitle>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles, privileges, or menus…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No roles found. Create one using the form above.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[52px]" />
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Privileges</TableHead>
                    <TableHead className="text-center">Menus</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => {
                    const privilegeCount = role.privileges?.length ?? 0;
                    const menuCount = role.roleMenus?.length ?? 0;
                    const isExpanded = expandedRoleId === role.id;

                    return (
                      <Fragment key={role.id}>
                        <TableRow>
                          <TableCell className="align-top pt-4">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => toggleExpand(role.id)}
                              aria-expanded={isExpanded}
                              aria-label={
                                isExpanded
                                  ? "Collapse role access"
                                  : "Expand role access"
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {role.name}
                          </TableCell>
                          <TableCell>{getStatusBadge(role.status)}</TableCell>
                          <TableCell className="text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpand(role.id)}
                              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Shield className="h-4 w-4" />
                              <Badge variant="secondary" className="tabular-nums">
                                {privilegeCount}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpand(role.id)}
                              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <LayoutList className="h-4 w-4" />
                              <Badge variant="secondary" className="tabular-nums">
                                {menuCount}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={TABLE_COL_SPAN} className="p-4">
                              <RoleAccessPanel
                                role={role}
                                allPrivileges={allPrivileges}
                                privilegesLoading={privilegesLoading}
                                allMenus={allMenus}
                                menusLoading={menusLoading}
                                accessPending={isAccessPending}
                                onAssignPrivileges={(privilegeIds) =>
                                  assignPrivileges(role.id, privilegeIds)
                                }
                                onRemovePrivilege={(privilegeId) =>
                                  removePrivilege(role.id, privilegeId)
                                }
                                onAssignMenus={(menuIds) =>
                                  assignMenus(role.id, menuIds)
                                }
                                onRemoveMenu={(menuId) =>
                                  removeMenu(role.id, menuId)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingRole(undefined);
        }}
        role={editingRole}
        onSubmit={handleEditSubmit}
        isSubmitting={isUpdating}
      />
    </div>
  );
}
