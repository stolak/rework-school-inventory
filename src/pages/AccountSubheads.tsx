import { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountSubheadDialog } from "@/components/dialogs/AccountSubheadDialog";
import {
  useAccountHeads,
  useAccountSubheads,
  type AccountSubhead,
} from "@/hooks/useAccountSubheads";
import type { AccountSubheadAddFormData, AccountSubheadEditFormData } from "@/components/forms/AccountSubheadForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Combobox value that loads all subheads (no `headId` query param). */
const ALL_HEADS_VALUE = "__all__";

export default function AccountSubheads() {
  const { data: accountHeads = [], isLoading: headsLoading, isError: headsError } =
    useAccountHeads();
  const [selectedHeadIdStr, setSelectedHeadIdStr] = useState<string>(ALL_HEADS_VALUE);
  const [manualHeadId, setManualHeadId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const headFilter = useMemo(() => {
    if (selectedHeadIdStr === ALL_HEADS_VALUE) return "all" as const;
    const n = parseInt(selectedHeadIdStr, 10);
    if (Number.isFinite(n) && n > 0) return n;
    return undefined;
  }, [selectedHeadIdStr]);

  const selectedHeadId = useMemo(() => {
    if (selectedHeadIdStr === ALL_HEADS_VALUE) return undefined;
    const n = parseInt(selectedHeadIdStr, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [selectedHeadIdStr]);

  const canAddSubhead =
    typeof headFilter === "number" && headFilter > 0;

  const {
    subheads,
    isLoading: subheadsLoading,
    createSubhead,
    updateSubhead,
    deleteSubhead,
  } = useAccountSubheads(headFilter);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedSubhead, setSelectedSubhead] = useState<AccountSubhead | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AccountSubhead | null>(null);

  const headOptions = useMemo(
    () => [
      { value: ALL_HEADS_VALUE, label: "All" },
      ...accountHeads.map((h) => ({
        value: String(h.id),
        label: `${h.code} — ${h.name}`,
      })),
    ],
    [accountHeads]
  );

  const selectedHead = accountHeads.find((h) => h.id === selectedHeadId);

  const applyManualHeadId = () => {
    const n = parseInt(manualHeadId.trim(), 10);
    if (Number.isFinite(n) && n > 0) {
      setSelectedHeadIdStr(String(n));
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return subheads;
    return subheads.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
    );
  }, [subheads, searchTerm]);

  const handleAdd = () => {
    if (!selectedHeadId) return;
    setDialogMode("add");
    setSelectedSubhead(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (row: AccountSubhead) => {
    setDialogMode("edit");
    setSelectedSubhead(row);
    setDialogOpen(true);
  };

  const handleDelete = (row: AccountSubhead) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteSubhead(toDelete.id);
      setToDelete(null);
      setDeleteOpen(false);
    } catch {
      setToDelete(null);
      setDeleteOpen(false);
    }
  };

  const handleFormSubmit = async (
    data: AccountSubheadAddFormData | AccountSubheadEditFormData
  ) => {
    if (dialogMode === "add" && selectedHeadId) {
      const d = data as AccountSubheadAddFormData;
      await createSubhead({
        headId: selectedHeadId,
        code: d.code,
        name: d.name,
        status: "Active",
        rank: d.rank,
        paymentMethod: d.paymentMethod,
      });
    } else if (dialogMode === "edit" && selectedSubhead) {
      const d = data as AccountSubheadEditFormData;
      await updateSubhead({
        id: selectedSubhead.id,
        data: {
          code: d.code,
          name: d.name,
          status: d.status,
          rank: d.rank,
          paymentMethod: d.paymentMethod,
        },
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTree className="h-8 w-8" />
            Account subheads
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage subheads under each account head
          </p>
        </div>
        <Button
          onClick={handleAdd}
          disabled={!canAddSubhead}
          className="shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add subhead
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Filter by account head</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          {headsError ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Could not load account heads. Enter a head ID to filter subheads
                (same as{" "}
                <code className="text-xs bg-muted px-1 rounded">headId</code>{" "}
                query), or load every subhead.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={selectedHeadIdStr === ALL_HEADS_VALUE ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedHeadIdStr(ALL_HEADS_VALUE)}
                >
                  All subheads
                </Button>
              </div>
              <div className="flex gap-2 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Account head ID</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 1"
                    value={manualHeadId}
                    onChange={(e) => setManualHeadId(e.target.value)}
                  />
                </div>
                <Button type="button" variant="secondary" onClick={applyManualHeadId}>
                  Load
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Account head</Label>
              <Combobox
                options={headOptions}
                value={selectedHeadIdStr}
                onValueChange={setSelectedHeadIdStr}
                placeholder={headsLoading ? "Loading heads…" : "Select account head"}
                searchPlaceholder="Search heads…"
                disabled={headsLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {headFilter == null ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
          Select <strong>All</strong> or a specific account head to view subheads.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, payment method…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              {subheadsLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading subheads…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Rank</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Head</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "Active" ? "default" : "secondary"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.rank}
                        </TableCell>
                        <TableCell>{row.paymentMethod}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.group?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.head?.name ?? selectedHead?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(row)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(row)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!subheadsLoading && filtered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No subheads for this head.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AccountSubheadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        subhead={selectedSubhead}
        headLabel={
          selectedHead
            ? `${selectedHead.code} — ${selectedHead.name}`
            : selectedHeadId
              ? `Head ID ${selectedHeadId}`
              : undefined
        }
        onSubmit={handleFormSubmit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this subhead?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Subhead{" "}
              <strong>{toDelete?.code}</strong> will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
