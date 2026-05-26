import { useMemo, useState } from "react";
import { Edit, LayoutList, Loader2, Save, Search } from "lucide-react";
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
import { MenuDialog } from "@/components/dialogs/MenuDialog";
import { useMenus } from "@/hooks/useMenus";
import type { AppMenu } from "@/lib/api";

type StatusFilter = "All" | "Active" | "Inactive";

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    Active: "bg-success/10 text-success",
    Inactive: "bg-warning/10 text-warning",
  };
  const label =
    status?.toLowerCase() === "inactive"
      ? "Inactive"
      : status?.toLowerCase() === "active"
        ? "Active"
        : status;
  const key =
    label === "Active" || label === "Inactive" ? label : status;
  return (
    <Badge
      variant="secondary"
      className={variants[key] ?? "bg-muted text-muted-foreground"}
    >
      {label}
    </Badge>
  );
}

export default function Menus() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [searchTerm, setSearchTerm] = useState("");

  const [createRoute, setCreateRoute] = useState("");
  const [createCaption, setCreateCaption] = useState("");
  const [createStatus, setCreateStatus] = useState<"Active" | "Inactive">(
    "Active",
  );

  const listStatus = statusFilter === "All" ? undefined : statusFilter;

  const {
    menus,
    isLoading,
    createMenu,
    updateMenu,
    isCreating,
    isUpdating,
  } = useMenus({ status: listStatus });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<AppMenu | undefined>();

  const filteredMenus = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return menus;
    return menus.filter(
      (m) =>
        m.route.toLowerCase().includes(q) ||
        m.caption.toLowerCase().includes(q),
    );
  }, [menus, searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoute.trim() || !createCaption.trim()) return;
    try {
      await createMenu({
        route: createRoute.trim(),
        caption: createCaption.trim(),
        status: createStatus,
      });
      setCreateRoute("");
      setCreateCaption("");
      setCreateStatus("Active");
    } catch {
      /* toast from hook */
    }
  };

  const handleEdit = (menu: AppMenu) => {
    setEditingMenu(menu);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: {
    route: string;
    caption: string;
    status: "Active" | "Inactive";
  }) => {
    if (!editingMenu) return;
    await updateMenu(editingMenu.id, data);
    setEditingMenu(undefined);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutList className="h-8 w-8" />
          Menu management
        </h1>
        <p className="text-muted-foreground mt-1">
          Define navigation entries with a route path, display caption, and
          status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create menu</CardTitle>
          <CardDescription>
            Routes should match application paths (e.g.{" "}
            <code className="text-xs">/inventory/items</code>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-menu-route">Route</Label>
                <Input
                  id="new-menu-route"
                  value={createRoute}
                  onChange={(e) => setCreateRoute(e.target.value)}
                  placeholder="/inventory/items"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-menu-caption">Caption</Label>
                <Input
                  id="new-menu-caption"
                  value={createCaption}
                  onChange={(e) => setCreateCaption(e.target.value)}
                  placeholder="Inventory Items"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createStatus}
                  onValueChange={(v) =>
                    setCreateStatus(v as "Active" | "Inactive")
                  }
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
            </div>
            <Button
              type="submit"
              className="bg-gradient-primary"
              disabled={
                isCreating || !createRoute.trim() || !createCaption.trim()
              }
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save menu
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menus ({filteredMenus.length})</CardTitle>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search route or caption…"
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
                <SelectItem value="All">All status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <LayoutList className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No menus found. Create one using the form above.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caption</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMenus.map((menu) => (
                    <TableRow key={menu.id}>
                      <TableCell className="font-medium">
                        {menu.caption}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {menu.route}
                      </TableCell>
                      <TableCell>{getStatusBadge(menu.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(menu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MenuDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingMenu(undefined);
        }}
        menu={editingMenu}
        onSubmit={handleEditSubmit}
        isSubmitting={isUpdating}
      />
    </div>
  );
}
