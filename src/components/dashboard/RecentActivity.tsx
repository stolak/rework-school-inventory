import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useMyAuditLogs } from "@/hooks/useAuditLogs";

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "SUCCESS") return "bg-success/10 text-success";
  if (normalized === "FAILED" || normalized === "FAILURE" || normalized === "ERROR") {
    return "bg-destructive/10 text-destructive";
  }
  if (normalized === "PENDING") return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
}

function getActionAvatarClass(action: string): string {
  const normalized = action.toUpperCase();
  if (normalized.includes("LOGIN") || normalized.includes("LOGOUT")) {
    return "bg-primary/10 text-primary";
  }
  if (normalized.includes("CREATE") || normalized.includes("ADD")) {
    return "bg-success/10 text-success";
  }
  if (normalized.includes("UPDATE") || normalized.includes("EDIT")) {
    return "bg-accent/10 text-accent";
  }
  if (normalized.includes("DELETE") || normalized.includes("REMOVE")) {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

export function RecentActivity() {
  const { auditLogs, isLoading, error } = useMyAuditLogs({ page: 1, limit: 5 });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading activity…</p>
        ) : error ? (
          <p className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load activity"}
          </p>
        ) : auditLogs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-1">
            {auditLogs.map((log, index) => {
              const avatarClass = getActionAvatarClass(log.action);
              const actionLabel = formatActionLabel(log.action);
              const timestamp = new Date(log.createdAt);

              return (
                <div
                  key={log.id}
                  className={`p-4 hover:bg-muted/30 transition-colors ${
                    index !== auditLogs.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className={`h-8 w-8 ${avatarClass}`}>
                      <AvatarFallback className="text-xs font-medium">
                        {log.action.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {actionLabel}
                          </p>
                          {log.description ? (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {log.description}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground mt-2">
                            {Number.isNaN(timestamp.getTime())
                              ? log.createdAt
                              : formatDistanceToNow(timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 ${getStatusBadgeClass(log.status)}`}
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
