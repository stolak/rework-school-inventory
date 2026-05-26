import { useMemo, useState } from "react";
import { Edit, Loader2, Save, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
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
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { StaffDialog } from "@/components/dialogs/StaffDialog";
import { useStaffManagement } from "@/hooks/useStaffManagement";
import { useAppRoles } from "@/hooks/useAppRoles";
import type { Staff, StaffPosition, StaffStatus } from "@/lib/api";
import {
  STAFF_POSITIONS,
  STAFF_STATUSES,
  STAFF_USER_TYPES,
  formatStaffPosition,
} from "@/lib/staffConstants";

const ALL_POSITIONS = "__all_positions__";
const ALL_STATUS = "__all_status__";

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    Active: "bg-success/10 text-success",
    Inactive: "bg-warning/10 text-warning",
    Archived: "bg-muted text-muted-foreground",
  };
  return (
    <Badge
      variant="secondary"
      className={variants[status] ?? "bg-muted text-muted-foreground"}
    >
      {status}
    </Badge>
  );
}

export default function StaffManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>(ALL_POSITIONS);
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const listPosition =
    positionFilter === ALL_POSITIONS ? undefined : positionFilter;
  const listStatus = statusFilter === ALL_STATUS ? undefined : statusFilter;

  const {
    staff,
    pagination,
    isLoading,
    createStaff,
    updateStaff,
    isCreating,
    isUpdating,
  } = useStaffManagement({
    q: appliedQuery || undefined,
    position: listPosition,
    status: listStatus,
    page,
    limit,
  });

  const { roles: appRoles, isLoading: rolesLoading } = useAppRoles({
    status: "active",
  });

  const [staffNumber, setStaffNumber] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState<StaffPosition>("class_teacher");
  const [status, setStatus] = useState<StaffStatus>("Active");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [appRoleId, setAppRoleId] = useState("");
  const [userType, setUserType] = useState<string>("Staff");
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();

  const positionFilterOptions = useMemo(
    () => [
      { value: ALL_POSITIONS, label: "All positions" },
      ...STAFF_POSITIONS.map((p) => ({ value: p.value, label: p.label })),
    ],
    [],
  );

  const roleOptions = useMemo(
    () =>
      appRoles.map((r) => ({
        value: r.id,
        label: r.name,
      })),
    [appRoles],
  );

  const applySearch = () => {
    setAppliedQuery(searchQuery.trim());
    setPage(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !staffNumber.trim() ||
      !email.trim() ||
      !name.trim() ||
      !password.trim() ||
      !appRoleId
    ) {
      return;
    }
    try {
      await createStaff({
        StaffNumber: staffNumber.trim(),
        email: email.trim(),
        name: name.trim(),
        position,
        status,
        profileImageUrl: profileImageUrl.trim() || undefined,
        password,
        phoneNumber: phoneNumber.trim() || undefined,
        isActive,
        isVerified,
        isEmailVerified,
        appRoleId,
        userType,
      });
      setStaffNumber("");
      setEmail("");
      setName("");
      setPosition("class_teacher");
      setStatus("Active");
      setProfileImageUrl("");
      setPassword("");
      setPhoneNumber("");
      setAppRoleId("");
      setUserType("Staff");
      setIsActive(true);
      setIsVerified(true);
      setIsEmailVerified(true);
    } catch {
      /* toast from hook */
    }
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: {
    StaffNumber?: string;
    name?: string;
    position?: StaffPosition | string;
    status?: StaffStatus;
    profileImageUrl?: string;
  }) => {
    if (!editingStaff) return;
    await updateStaff(editingStaff.id, data);
    setEditingStaff(undefined);
  };

  const createdByName = (member: Staff) => {
    const c = member.createdBy;
    if (!c) return "—";
    return `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—";
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Staff management
        </h1>
        <p className="text-muted-foreground mt-1">
          Register staff members with login accounts, roles, and employment
          details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register staff</CardTitle>
          <CardDescription>
            Creates a staff record and linked user account. Email and password
            are set at registration only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-number">Staff number</Label>
                <Input
                  id="staff-number"
                  value={staffNumber}
                  onChange={(e) => setStaffNumber(e.target.value)}
                  placeholder="e.g. STF-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full name</Label>
                <Input
                  id="staff-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-password">Password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone number</Label>
                <Input
                  id="staff-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={position}
                  onValueChange={(v) => setPosition(v as StaffPosition)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_POSITIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as StaffStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>User type</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_USER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Application role</Label>
                {rolesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading roles…</p>
                ) : (
                  <Combobox
                    value={appRoleId}
                    onValueChange={setAppRoleId}
                    options={roleOptions}
                    placeholder="Select role…"
                    searchPlaceholder="Search roles…"
                  />
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="staff-profile-url">Profile image URL</Label>
                <Input
                  id="staff-profile-url"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="staff-is-active"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(v === true)}
                />
                <Label htmlFor="staff-is-active" className="cursor-pointer">
                  Active account
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="staff-is-verified"
                  checked={isVerified}
                  onCheckedChange={(v) => setIsVerified(v === true)}
                />
                <Label htmlFor="staff-is-verified" className="cursor-pointer">
                  Verified
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="staff-email-verified"
                  checked={isEmailVerified}
                  onCheckedChange={(v) => setIsEmailVerified(v === true)}
                />
                <Label htmlFor="staff-email-verified" className="cursor-pointer">
                  Email verified
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="bg-gradient-primary"
              disabled={
                isCreating ||
                !staffNumber.trim() ||
                !email.trim() ||
                !name.trim() ||
                !password.trim() ||
                !appRoleId
              }
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Register staff
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Staff
            {pagination ? ` (${pagination.total})` : ` (${staff.length})`}
          </CardTitle>
          <div className="pt-2 flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="flex flex-1 gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                  placeholder="Search name, email, staff number…"
                  className="pl-8"
                />
              </div>
              <Button type="button" variant="secondary" onClick={applySearch}>
                Search
              </Button>
            </div>
            <Select
              value={positionFilter}
              onValueChange={(v) => {
                setPositionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                {positionFilterOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS}>All status</SelectItem>
                {STAFF_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No staff found for the current filters.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered by</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-sm">
                          {member.StaffNumber ?? "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {member.email ?? member.user?.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          {formatStaffPosition(member.position)}
                        </TableCell>
                        <TableCell>
                          {member.status
                            ? getStatusBadge(member.status)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {createdByName(member)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pagination && (
                <TablePaginationBar
                  pagination={pagination}
                  totalLabel="Total staff"
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

      <StaffDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingStaff(undefined);
        }}
        staff={editingStaff}
        onSubmit={handleEditSubmit}
        isSubmitting={isUpdating}
      />
    </div>
  );
}
