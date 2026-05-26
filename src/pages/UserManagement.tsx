import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
  UserCog,
} from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { UserAccessPanel } from "@/components/users/UserAccessPanel";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAppRoles } from "@/hooks/useAppRoles";
import { usePrivileges } from "@/hooks/usePrivileges";

const ALL_ROLES = "__all_roles__";

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

export default function UserManagement() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const listStatus = statusFilter === "all" ? undefined : statusFilter;
  const listRoleId = roleFilter === ALL_ROLES ? undefined : roleFilter;

  const {
    users,
    pagination,
    isLoading,
    assignPrivileges,
    removePrivilege,
    assignRole,
    removeRole,
    isAccessPending,
  } = useUserManagement({
    roleId: listRoleId,
    status: listStatus,
    page,
    limit,
  });

  const { roles: allRoles, isLoading: rolesLoading } = useAppRoles({
    status: "active",
  });

  const { privileges: allPrivileges, isLoading: privilegesLoading } =
    usePrivileges();

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const roleFilterOptions = useMemo(
    () => [
      { value: ALL_ROLES, label: "All roles" },
      ...allRoles.map((r) => ({ value: r.id, label: r.name })),
    ],
    [allRoles],
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const inProfile =
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.userType ?? "").toLowerCase().includes(q) ||
        (u.phoneNumber ?? "").toLowerCase().includes(q);
      const inRole =
        u.appRole?.name.toLowerCase().includes(q) ||
        (u.appRoles ?? []).some((r) => r.name.toLowerCase().includes(q));
      const inPrivileges = (u.privileges ?? []).some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
      return inProfile || inRole || inPrivileges;
    });
  }, [users, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedUserId((prev) => (prev === id ? null : id));
  };

  const TABLE_COL_SPAN = 7;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCog className="h-8 w-8" />
          User management
        </h1>
        <p className="text-muted-foreground mt-1">
          View users, filter by role and status, and manage application roles
          and direct privileges.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Server-side filters apply to the user list. Search narrows the
            current page locally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Application role</Label>
              <Combobox
                value={roleFilter}
                onValueChange={(v) => {
                  setRoleFilter(v);
                  setPage(1);
                }}
                options={roleFilterOptions}
                placeholder="All roles"
                searchPlaceholder="Search roles…"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, email, role, privilege…"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Users
            {pagination ? ` (${pagination.total})` : ` (${filteredUsers.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCog className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No users match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[52px]" />
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-center">Privileges</TableHead>
                      <TableHead className="w-[52px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const privilegeCount = user.privileges?.length ?? 0;
                      const roleName =
                        user.appRole?.name ??
                        user.appRoles?.[0]?.name ??
                        "—";
                      const isExpanded = expandedUserId === user.id;

                      return (
                        <Fragment key={user.id}>
                          <TableRow>
                            <TableCell className="align-top pt-4">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                                onClick={() => toggleExpand(user.id)}
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded
                                    ? "Collapse user access"
                                    : "Expand user access"
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{user.displayName}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {user.userType ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.status
                                ? getStatusBadge(user.status)
                                : "—"}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate">
                              {roleName}
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() => toggleExpand(user.id)}
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                              >
                                <Shield className="h-4 w-4" />
                                <Badge variant="secondary" className="tabular-nums">
                                  {privilegeCount}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={TABLE_COL_SPAN} className="p-4">
                                <UserAccessPanel
                                  user={user}
                                  allPrivileges={allPrivileges}
                                  privilegesLoading={privilegesLoading}
                                  allRoles={allRoles}
                                  rolesLoading={rolesLoading}
                                  accessPending={isAccessPending}
                                  onAssignPrivileges={(privilegeIds) =>
                                    assignPrivileges(user.id, privilegeIds)
                                  }
                                  onRemovePrivilege={(privilegeId) =>
                                    removePrivilege(user.id, privilegeId)
                                  }
                                  onAssignRole={(roleId) =>
                                    assignRole(user.id, roleId)
                                  }
                                  onRemoveRole={(roleId) =>
                                    removeRole(user.id, roleId)
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
              {pagination && (
                <TablePaginationBar
                  pagination={pagination}
                  totalLabel="Total users"
                  pageSize={limit}
                  onPageChange={setPage}
                  onPageSizeChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                  className="mt-4"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
