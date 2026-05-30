import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Edit, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { CashierDialog } from "@/components/dialogs/CashierDialog";
import {
  useCashiers,
  cashierLedgerLabel,
  cashierStaffLabel,
  type Cashier,
} from "@/hooks/useCashiers";
import type { CashierAddFormData, CashierEditFormData } from "@/components/forms/CashierForm";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";

export function CashierSetupSection() {
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedCashier, setSelectedCashier] = useState<Cashier | undefined>();

  useEffect(() => {
    setPage(1);
  }, [statusFilter, limit]);

  const { cashiers, pagination, isLoading, createCashier, updateCashier } =
    useCashiers({
      status: statusFilter === "All" ? undefined : statusFilter,
      page,
      limit,
    });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cashiers;
    return cashiers.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        cashierStaffLabel(row).toLowerCase().includes(q) ||
        cashierLedgerLabel(row).toLowerCase().includes(q) ||
        (row.Staff?.email ?? "").toLowerCase().includes(q)
    );
  }, [cashiers, searchTerm]);

  const handleAdd = () => {
    setDialogMode("add");
    setSelectedCashier(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (row: Cashier) => {
    setDialogMode("edit");
    setSelectedCashier(row);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: CashierAddFormData | CashierEditFormData
  ) => {
    if (dialogMode === "add") {
      const d = data as CashierAddFormData;
      await createCashier({
        name: d.name.trim(),
        staffId: d.staffId,
        accountChartId: d.accountChartId,
      });
    } else if (dialogMode === "edit" && selectedCashier) {
      const d = data as CashierEditFormData;
      await updateCashier({
        id: selectedCashier.id,
        data: {
          name: d.name.trim(),
          staffId: d.staffId,
          accountChartId: d.accountChartId,
          status: d.status,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-xl">
          Assign staff to cashier roles and link each cashier to a ledger account
          for collections and payments.
        </p>
        <Button onClick={handleAdd} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add cashier
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, staff, or ledger…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading cashiers…
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Ledger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{cashierStaffLabel(row)}</div>
                        {row.Staff?.email ? (
                          <div className="text-xs text-muted-foreground">
                            {row.Staff.email}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">
                        {cashierLedgerLabel(row)}
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!isLoading && filtered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No cashiers found.
                </div>
              )}
              {pagination && (
                <TablePaginationBar
                  pagination={pagination}
                  totalLabel="Total cashiers"
                  pageSize={limit}
                  onPageChange={setPage}
                  onPageSizeChange={(nextLimit) => {
                    setLimit(nextLimit);
                    setPage(1);
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CashierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        cashier={selectedCashier}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default function CashierSetupPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Cashier setup
        </h1>
      </div>
      <CashierSetupSection />
    </div>
  );
}
