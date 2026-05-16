import { useMemo, useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDefaultSubheadSettings } from "@/hooks/useDefaultSubheadSettings";
import {
  accountChartOptionLabel,
  useDefaultAccountSettings,
} from "@/hooks/useDefaultAccountSettings";
import type {
  AccountChart,
  DefaultAccountSetting,
  DefaultSubheadSetting,
} from "@/lib/api";

function selectedSubheadIdStr(row: DefaultSubheadSetting): string {
  return row.subheadId != null ? String(row.subheadId) : "";
}

function selectedAccountIdStr(row: DefaultAccountSetting): string {
  return row.accountId != null ? String(row.accountId) : "";
}

function currentAccountLabel(
  row: DefaultAccountSetting,
  chartsById: Map<number, AccountChart>
): string {
  if (row.account?.accountDescription) {
    const no = row.account.accountNo?.trim();
    return no
      ? `${no} — ${row.account.accountDescription}`
      : row.account.accountDescription;
  }
  if (row.accountId == null) return "—";
  const chart = chartsById.get(row.accountId);
  return chart ? accountChartOptionLabel(chart) : String(row.accountId);
}

export default function DefaultSettings() {
  const {
    settings: subheadSettings,
    isLoadingSettings: isLoadingSubheadSettings,
    activeSubheads,
    isLoadingSubheads,
    updateSetting: updateSubheadSetting,
    isUpdating: isUpdatingSubhead,
  } = useDefaultSubheadSettings();

  const {
    settings: accountSettings,
    isLoadingSettings: isLoadingAccountSettings,
    activeCharts,
    isLoadingCharts,
    updateSetting: updateAccountSetting,
    isUpdating: isUpdatingAccount,
  } = useDefaultAccountSettings();

  const [pendingSubheads, setPendingSubheads] = useState<Record<string, string>>({});
  const [pendingAccounts, setPendingAccounts] = useState<Record<string, string>>({});

  const chartsById = useMemo(
    () => new Map(activeCharts.map((c) => [c.id, c])),
    [activeCharts]
  );

  useEffect(() => {
    setPendingSubheads((prev) => {
      const next = { ...prev };
      for (const row of subheadSettings) {
        if (!(row.settingsId in next)) {
          next[row.settingsId] = selectedSubheadIdStr(row);
        }
      }
      for (const key of Object.keys(next)) {
        if (!subheadSettings.some((s) => s.settingsId === key)) delete next[key];
      }
      return next;
    });
  }, [subheadSettings]);

  useEffect(() => {
    setPendingAccounts((prev) => {
      const next = { ...prev };
      for (const row of accountSettings) {
        if (!(row.settingsId in next)) {
          next[row.settingsId] = selectedAccountIdStr(row);
        }
      }
      for (const key of Object.keys(next)) {
        if (!accountSettings.some((s) => s.settingsId === key)) delete next[key];
      }
      return next;
    });
  }, [accountSettings]);

  const subheadOptions = useMemo(
    () =>
      [...activeSubheads]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          value: String(s.id),
          label: [
            s.code?.trim() ? s.code.trim() : null,
            s.name,
            s.head?.name ? `(${s.head.name})` : null,
          ]
            .filter(Boolean)
            .join(" — "),
        })),
    [activeSubheads]
  );

  const accountOptions = useMemo(
    () =>
      [...activeCharts]
        .sort((a, b) => {
          const na = (a.accountNo ?? "").toString();
          const nb = (b.accountNo ?? "").toString();
          if (na !== nb) return na.localeCompare(nb, undefined, { numeric: true });
          return a.accountDescription.localeCompare(b.accountDescription);
        })
        .map((a) => ({
          value: String(a.id),
          label: accountChartOptionLabel(a),
        })),
    [activeCharts]
  );

  const subheadValueFor = (row: DefaultSubheadSetting) =>
    pendingSubheads[row.settingsId] ?? selectedSubheadIdStr(row);

  const accountValueFor = (row: DefaultAccountSetting) =>
    pendingAccounts[row.settingsId] ?? selectedAccountIdStr(row);

  const canSaveSubhead = (row: DefaultSubheadSetting) => {
    const v = subheadValueFor(row);
    const id = parseInt(v, 10);
    return (
      subheadValueFor(row) !== selectedSubheadIdStr(row) &&
      Number.isFinite(id) &&
      id > 0
    );
  };

  const canSaveAccount = (row: DefaultAccountSetting) => {
    const v = accountValueFor(row);
    const id = parseInt(v, 10);
    return (
      accountValueFor(row) !== selectedAccountIdStr(row) &&
      Number.isFinite(id) &&
      id > 0
    );
  };

  const subheadLoading = isLoadingSubheadSettings || isLoadingSubheads;
  const accountLoading = isLoadingAccountSettings || isLoadingCharts;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SlidersHorizontal className="h-8 w-8" />
          Default settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure default account subheads and account charts used for each posting context.
          Only active subheads and accounts are available to select.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Default subheads</CardTitle>
          <CardDescription>
            Subhead used by default when posting to each context. Save applies per row.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {subheadLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading subhead settings…</div>
          ) : subheadSettings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No subhead settings returned.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Context</TableHead>
                  <TableHead className="text-muted-foreground w-[180px]">Setting ID</TableHead>
                  <TableHead>Current subhead</TableHead>
                  <TableHead className="min-w-[280px]">Default subhead</TableHead>
                  <TableHead className="w-[100px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subheadSettings.map((row) => (
                  <TableRow key={row.settingsId}>
                    <TableCell>
                      <div className="font-medium">{row.settings}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.settingsId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.subhead?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Combobox
                        options={subheadOptions}
                        value={subheadValueFor(row)}
                        onValueChange={(v) =>
                          setPendingSubheads((p) => ({ ...p, [row.settingsId]: v }))
                        }
                        placeholder="Select subhead…"
                        searchPlaceholder="Search subheads…"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={!canSaveSubhead(row) || isUpdatingSubhead}
                        onClick={async () => {
                          const id = parseInt(subheadValueFor(row), 10);
                          if (!Number.isFinite(id) || id <= 0) return;
                          await updateSubheadSetting({
                            settingsId: row.settingsId,
                            subheadId: id,
                          });
                        }}
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Default accounts</CardTitle>
          <CardDescription>
            Account chart used by default when posting to each context. Save applies per row.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {accountLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading account settings…</div>
          ) : accountSettings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No account settings returned.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Context</TableHead>
                  <TableHead className="text-muted-foreground w-[220px]">Setting ID</TableHead>
                  <TableHead>Current account</TableHead>
                  <TableHead className="min-w-[280px]">Default account</TableHead>
                  <TableHead className="w-[100px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountSettings.map((row) => (
                  <TableRow key={row.settingsId}>
                    <TableCell>
                      <div className="font-medium">{row.settings}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.settingsId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {currentAccountLabel(row, chartsById)}
                    </TableCell>
                    <TableCell>
                      <Combobox
                        options={accountOptions}
                        value={accountValueFor(row)}
                        onValueChange={(v) =>
                          setPendingAccounts((p) => ({ ...p, [row.settingsId]: v }))
                        }
                        placeholder="Select account…"
                        searchPlaceholder="Search accounts…"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={!canSaveAccount(row) || isUpdatingAccount}
                        onClick={async () => {
                          const id = parseInt(accountValueFor(row), 10);
                          if (!Number.isFinite(id) || id <= 0) return;
                          await updateAccountSetting({
                            settingsId: row.settingsId,
                            accountId: id,
                          });
                        }}
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
