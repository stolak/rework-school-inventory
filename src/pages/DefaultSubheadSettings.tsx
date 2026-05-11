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
import type { DefaultSubheadSetting } from "@/lib/api";

function selectedSubheadIdStr(row: DefaultSubheadSetting): string {
  return row.subheadId != null ? String(row.subheadId) : "";
}

export default function DefaultSubheadSettings() {
  const {
    settings,
    isLoadingSettings,
    activeSubheads,
    isLoadingSubheads,
    updateSetting,
    isUpdating,
  } = useDefaultSubheadSettings();

  const [pending, setPending] = useState<Record<string, string>>({});

  useEffect(() => {
    setPending((prev) => {
      const next = { ...prev };
      for (const row of settings) {
        if (!(row.settingsId in next)) {
          next[row.settingsId] = selectedSubheadIdStr(row);
        }
      }
      for (const key of Object.keys(next)) {
        if (!settings.some((s) => s.settingsId === key)) delete next[key];
      }
      return next;
    });
  }, [settings]);

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

  const valueFor = (row: DefaultSubheadSetting) =>
    pending[row.settingsId] ?? selectedSubheadIdStr(row);

  const isDirty = (row: DefaultSubheadSetting) =>
    valueFor(row) !== selectedSubheadIdStr(row);

  const handleSave = async (row: DefaultSubheadSetting) => {
    const v = valueFor(row);
    const id = parseInt(v, 10);
    if (!Number.isFinite(id) || id <= 0) return;
    await updateSetting({ settingsId: row.settingsId, subheadId: id });
  };

  const canSaveRow = (row: DefaultSubheadSetting) => {
    const v = valueFor(row);
    const id = parseInt(v, 10);
    return isDirty(row) && Number.isFinite(id) && id > 0;
  };

  const loading = isLoadingSettings || isLoadingSubheads;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SlidersHorizontal className="h-8 w-8" />
          Default subhead settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose which account subhead applies by default for each posting context. Only active
          subheads are listed.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Posting defaults</CardTitle>
          <CardDescription>
            Changes are saved per row and sent to the server immediately when you click Save.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : settings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No settings returned.</div>
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
                {settings.map((row) => (
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
                        value={valueFor(row)}
                        onValueChange={(v) =>
                          setPending((p) => ({ ...p, [row.settingsId]: v }))
                        }
                        placeholder="Select subhead…"
                        searchPlaceholder="Search subheads…"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={!canSaveRow(row) || isUpdating}
                        onClick={() => handleSave(row)}
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
