import { useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Landmark } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountChartDialog } from "@/components/dialogs/AccountChartDialog";
import { useAccountGroups } from "@/hooks/useAccountGroups";
import {
  useAccountCharts,
  type AccountChart,
} from "@/hooks/useAccountCharts";
import type { AccountGroupTree } from "@/lib/api";
import type { AccountChartAddFormData, AccountChartEditFormData } from "@/components/forms/AccountChartForm";
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

const ANY_VALUE = "";

function parseId(s: string): number | undefined {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function AccountChartSetup() {
  const { data: groups = [], isLoading: groupsLoading } = useAccountGroups();

  const [groupStr, setGroupStr] = useState<string>(ANY_VALUE);
  const [headStr, setHeadStr] = useState<string>(ANY_VALUE);
  const [subheadStr, setSubheadStr] = useState<string>(ANY_VALUE);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const selectedGroupId = parseId(groupStr);
  const selectedHeadId = parseId(headStr);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const groupOptions = useMemo(
    () => [
      { value: ANY_VALUE, label: "Any group" },
      ...groups.map((g) => ({
        value: String(g.id),
        label: `${g.name} (rank ${g.rank})`,
      })),
    ],
    [groups]
  );

  const headOptions = useMemo(() => {
    const anyOpt = { value: ANY_VALUE, label: "Any head" };
    if (!selectedGroup) {
      const flat = groups.flatMap((g) =>
        g.heads.map((h) => ({
          value: String(h.id),
          label: `${g.name} › ${h.code} — ${h.name}`,
        }))
      );
      return [anyOpt, ...flat];
    }
    return [
      anyOpt,
      ...selectedGroup.heads.map((h) => ({
        value: String(h.id),
        label: `${h.code} — ${h.name}`,
      })),
    ];
  }, [groups, selectedGroup]);

  const subheadFilterOptions = useMemo(() => {
    const anyOpt = { value: ANY_VALUE, label: "Any subhead" };
    let subs: AccountGroupTree["subHeads"] = [];
    if (selectedGroup) {
      subs = selectedGroup.subHeads;
      if (selectedHeadId) {
        subs = subs.filter((s) => s.headId === selectedHeadId);
      }
    } else {
      subs = groups.flatMap((g) => g.subHeads);
      if (selectedHeadId) {
        subs = subs.filter((s) => s.headId === selectedHeadId);
      }
    }
    return [
      anyOpt,
      ...subs.map((s) => {
        const g = groups.find((gr) => gr.subHeads.some((x) => x.id === s.id));
        const head = g?.heads.find((h) => h.id === s.headId);
        const prefix = g ? `${g.name} › ` : "";
        const hl = head ? `${head.code} › ` : "";
        const codePart = s.code ? `${s.code} ` : "";
        return {
          value: String(s.id),
          label: `${prefix}${hl}${codePart}${s.name}`.replace(/\s+/g, " ").trim(),
        };
      }),
    ];
  }, [groups, selectedGroup, selectedHeadId]);

  const listFilters = useMemo(
    () => ({
      groupId: selectedGroupId,
      headId: selectedHeadId,
      subheadId: parseId(subheadStr),
      status: statusFilter || "All",
    }),
    [selectedGroupId, selectedHeadId, subheadStr, statusFilter]
  );

  const {
    charts,
    isLoading: chartsLoading,
    createChart,
    updateChart,
    deleteChart,
  } = useAccountCharts(listFilters);

  const subheadFormOptions = useMemo(
    () =>
      groups.flatMap((g) =>
        g.subHeads.map((s) => {
          const head = g.heads.find((h) => h.id === s.headId);
          const hl = head ? `${head.code} — ${head.name}` : `Head ${s.headId}`;
          const codePart = s.code ? `${s.code} ` : "";
          return {
            value: String(s.id),
            label: `${g.name} › ${hl} › ${codePart}${s.name}`
              .replace(/\s+/g, " ")
              .trim(),
          };
        })
      ),
    [groups]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedChart, setSelectedChart] = useState<AccountChart | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AccountChart | null>(null);

  const onGroupChange = (v: string) => {
    setGroupStr(v);
    setHeadStr(ANY_VALUE);
    setSubheadStr(ANY_VALUE);
  };

  const onHeadChange = (v: string) => {
    setHeadStr(v);
    setSubheadStr(ANY_VALUE);
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return charts;
    return charts.filter(
      (c) =>
        (c.accountNo ?? "").toLowerCase().includes(q) ||
        c.accountDescription.toLowerCase().includes(q) ||
        (c.accountRef ?? "").toLowerCase().includes(q)
    );
  }, [charts, searchTerm]);

  const handleAdd = () => {
    setDialogMode("add");
    setSelectedChart(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (row: AccountChart) => {
    setDialogMode("edit");
    setSelectedChart(row);
    setDialogOpen(true);
  };

  const handleDelete = (row: AccountChart) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteChart(toDelete.id);
      setToDelete(null);
      setDeleteOpen(false);
    } catch {
      setToDelete(null);
      setDeleteOpen(false);
    }
  };

  const handleFormSubmit = async (
    data: AccountChartAddFormData | AccountChartEditFormData
  ) => {
    const sid = parseInt(
      dialogMode === "add"
        ? (data as AccountChartAddFormData).subheadId
        : (data as AccountChartEditFormData).subheadId,
      10
    );
    if (!Number.isFinite(sid) || sid <= 0) return;

    if (dialogMode === "add") {
      const d = data as AccountChartAddFormData;
      const noTrim = d.accountNo.trim();
      await createChart({
        subheadId: sid,
        ...(noTrim !== "" ? { accountNo: noTrim } : {}),
        accountDescription: d.accountDescription.trim(),
        rank: d.rank,
      });
    } else if (dialogMode === "edit" && selectedChart) {
      const d = data as AccountChartEditFormData;
      await updateChart({
        id: selectedChart.id,
        data: {
          subheadId: sid,
          accountNo: d.accountNo.trim(),
          accountDescription: d.accountDescription.trim(),
          status: d.status,
          rank: d.rank,
        },
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Landmark className="h-8 w-8" />
            Account chart setup
          </h1>
          <p className="text-muted-foreground mt-1">
            Define ledger accounts linked to account subheads
          </p>
        </div>
        <Button onClick={handleAdd} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add account
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Group</Label>
            <Combobox
              options={groupOptions}
              value={groupStr}
              onValueChange={onGroupChange}
              placeholder={groupsLoading ? "Loading…" : "Any group"}
              searchPlaceholder="Search groups…"
              disabled={groupsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Head</Label>
            <Combobox
              options={headOptions}
              value={headStr}
              onValueChange={onHeadChange}
              placeholder="Any head"
              searchPlaceholder="Search heads…"
              disabled={groupsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Subhead</Label>
            <Combobox
              options={subheadFilterOptions}
              value={subheadStr}
              onValueChange={setSubheadStr}
              placeholder="Any subhead"
              searchPlaceholder="Search subheads…"
              disabled={groupsLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by account no., description, ref…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          {chartsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading account charts…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account no.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rank</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Subhead</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.accountNo?.trim() ? row.accountNo : "—"}
                    </TableCell>
                    <TableCell>{row.accountDescription}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.accountRef ?? "—"}
                    </TableCell>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {row.group?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.head?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.subhead?.name ?? "—"}
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
          {!chartsLoading && filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No account charts match the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      <AccountChartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        chart={selectedChart}
        subheadOptions={subheadFormOptions}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Account{" "}
              <strong>
                {toDelete?.accountNo?.trim() || toDelete?.accountDescription}
              </strong>{" "}
              will be removed.
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
