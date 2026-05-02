import { Fragment, useMemo, useState } from "react";
import {
  Search,
  Store,
  UserCog,
  Save,
  Edit,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { useStores, type StoreListItem } from "@/hooks/useStores";
import { useToast } from "@/hooks/use-toast";
import { StoreDialog } from "@/components/dialogs/StoreDialog";
import type { StoreFormData } from "@/components/forms/StoreForm";
import { StoreAccessPanel } from "@/components/stores/StoreAccessPanel";

export default function StoreSetup() {
  const { users: adminUsers, isLoading: usersLoading } = useUsers({
    userType: "Admin",
    page: 1,
    limit: 100,
  });

  const { users: allUsersForAccess, isLoading: allUsersLoading } = useUsers({
    page: 1,
    limit: 200,
  });

  const {
    stores,
    createStore,
    updateStore,
    addUserToStore,
    removeUserFromStore,
    isStoreAccessPending,
    isLoading: storesLoading,
  } = useStores({
    page: 1,
    limit: 100,
  });

  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [managerId, setManagerId] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreListItem | undefined>();

  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);

  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) return stores;
    const q = searchTerm.toLowerCase();
    return stores.filter((s) => {
      const inBasics =
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.managerDisplayName && s.managerDisplayName.toLowerCase().includes(q));
      const inAccess = s.accessibleUsersView.some(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
      return inBasics || inAccess;
    });
  }, [stores, searchTerm]);

  const getStatusBadge = (statusValue: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
    };
    return (
      <Badge
        variant="secondary"
        className={variants[statusValue] ?? "bg-muted text-muted-foreground"}
      >
        {statusValue}
      </Badge>
    );
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Store name is required",
        variant: "destructive",
      });
      return;
    }
    if (!managerId) {
      toast({
        title: "Error",
        description: "Select a store manager (Admin user)",
        variant: "destructive",
      });
      return;
    }

    try {
      await createStore({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        managerId,
      });
      setName("");
      setDescription("");
      setStatus("Active");
      setManagerId("");
    } catch {
      /* toast from hook */
    }
  };

  const handleEdit = (store: StoreListItem) => {
    setEditingStore(store);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: StoreFormData) => {
    if (!editingStore) return;
    await updateStore(editingStore.id, {
      name: data.name.trim(),
      description: data.description?.trim() ? data.description.trim() : undefined,
      status: data.status,
      managerId: data.managerId,
    });
    setEditingStore(undefined);
  };

  const toggleExpand = (id: string) => {
    setExpandedStoreId((prev) => (prev === id ? null : id));
  };

  const loading = usersLoading || storesLoading;

  const TABLE_COL_SPAN = 9;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            Store setup
          </h1>
          <p className="text-muted-foreground mt-1">
            Create stores, assign managers, and control which users can access each store.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Create store
          </CardTitle>
          <CardDescription>
            Pick an Admin user as manager. After creation, use “Users with access” on each store row to grant access to more accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateStore} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store name</Label>
                <Input
                  id="store-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main campus shop"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as "Active" | "Inactive")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="store-desc">Description</Label>
                <Input
                  id="store-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Store manager (Admin user)</Label>
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users…</p>
                ) : adminUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No Admin users returned. Ensure users exist with userType Admin.
                  </p>
                ) : (
                  <Combobox
                    value={managerId}
                    onValueChange={setManagerId}
                    options={adminUsers.map((u) => ({
                      value: u.id,
                      label: `${u.displayName} (${u.email})`,
                    }))}
                    placeholder="Select manager..."
                    searchPlaceholder="Search by name or email..."
                  />
                )}
              </div>
            </div>
            <Button type="submit" className="bg-gradient-primary" disabled={usersLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save store
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stores ({filteredStores.length})</CardTitle>
          <div className="pt-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores, managers, or users with access…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No stores yet. Create one using the form above.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[52px]" />
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead className="text-center">Access</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((s) => (
                    <Fragment key={s.id}>
                      <TableRow>
                        <TableCell className="align-top pt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => toggleExpand(s.id)}
                            aria-expanded={expandedStoreId === s.id}
                            aria-label={
                              expandedStoreId === s.id
                                ? "Collapse access"
                                : "Expand access"
                            }
                          >
                            {expandedStoreId === s.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {s.name}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate text-muted-foreground">
                          {s.description?.trim() ? s.description : "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(s.status)}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {s.managerDisplayName ?? s.manager?.email ?? "—"}
                        </TableCell>
                        <TableCell>{s.transactionCount ?? "—"}</TableCell>
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(s.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <Users className="h-4 w-4" />
                            <Badge variant="secondary" className="tabular-nums">
                              {s.accessibleUsersView.length}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(s)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedStoreId === s.id && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={TABLE_COL_SPAN} className="p-4">
                            <StoreAccessPanel
                              accessibleUsers={s.accessibleUsersView}
                              candidateUsers={allUsersForAccess}
                              usersLoading={allUsersLoading}
                              accessPending={isStoreAccessPending}
                              onAdd={(userId) => addUserToStore(s.id, userId)}
                              onRemove={(userId) =>
                                removeUserFromStore(s.id, userId)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StoreDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingStore(undefined);
        }}
        store={editingStore}
        adminUsers={adminUsers}
        usersLoading={usersLoading}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
