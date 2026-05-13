import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarRange,
  CalendarIcon,
  CalendarClock,
  Banknote,
  ChevronRight,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSchoolSessions,
  type SchoolSession,
} from "@/hooks/useSchoolSessions";
import { useTerms, type Term } from "@/hooks/useTerms";
import { useActivePeriod } from "@/hooks/useActivePeriod";
import { useDefaultBillingPeriod } from "@/hooks/useDefaultBillingPeriod";
import { SchoolSessionDialog } from "@/components/dialogs/SchoolSessionDialog";
import { TermDialog } from "@/components/dialogs/TermDialog";
import type { TermFormData } from "@/components/forms/TermForm";
import type { SchoolSessionFormData } from "@/components/forms/SchoolSessionForm";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Sessions() {
  const {
    sessions,
    addSession,
    updateSession,
    deleteSession,
    isLoading: sessionsLoading,
  } = useSchoolSessions({ page: 1, limit: 100 });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }
    if (
      !selectedSessionId ||
      !sessions.some((s) => s.id === selectedSessionId)
    ) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const {
    terms,
    addTerm,
    updateTerm,
    deleteTerm,
    isLoading: termsLoading,
  } = useTerms({
    page: 1,
    limit: 100,
    sessionId: selectedSessionId ?? undefined,
    queryEnabled: !!selectedSessionId,
  });

  const [sessionSearch, setSessionSearch] = useState("");
  const [termSearch, setTermSearch] = useState("");

  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionDialogMode, setSessionDialogMode] = useState<
    "add" | "edit" | "view"
  >("add");
  const [sessionForDialog, setSessionForDialog] = useState<
    SchoolSession | undefined
  >();
  const [sessionDeleteOpen, setSessionDeleteOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [termDialogMode, setTermDialogMode] = useState<"add" | "edit" | "view">(
    "add",
  );
  const [termForDialog, setTermForDialog] = useState<Term | undefined>();
  const [termDeleteOpen, setTermDeleteOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const {
    activePeriod,
    isLoading: activePeriodLoading,
    isError: activePeriodError,
    upsertActivePeriod,
    isSaving: savingActivePeriod,
  } = useActivePeriod();

  const [apSessionId, setApSessionId] = useState("");
  const [apTermId, setApTermId] = useState("");
  const [apStart, setApStart] = useState<Date | undefined>();
  const [apEnd, setApEnd] = useState<Date | undefined>();

  const { terms: apTermsRaw, isLoading: apTermsLoading } = useTerms({
    page: 1,
    limit: 100,
    sessionId: apSessionId || undefined,
    queryEnabled: !!apSessionId,
  });

  const apTerms = useMemo(() => {
    if (!apSessionId) return [];
    return apTermsRaw.filter(
      (t) => !t.sessionId || t.sessionId === apSessionId,
    );
  }, [apTermsRaw, apSessionId]);

  useEffect(() => {
    if (!activePeriod) return;
    setApSessionId(activePeriod.sessionId);
    setApTermId(activePeriod.termId);
    try {
      setApStart(parseISO(activePeriod.startDate));
      setApEnd(parseISO(activePeriod.endDate));
    } catch {
      setApStart(undefined);
      setApEnd(undefined);
    }
  }, [
    activePeriod?.id,
    activePeriod?.sessionId,
    activePeriod?.termId,
    activePeriod?.startDate,
    activePeriod?.endDate,
    activePeriod?.updatedAt,
  ]);

  const handleApSessionChange = (value: string) => {
    setApSessionId(value);
    setApTermId("");
  };

  const handleSaveActivePeriod = async () => {
    if (!apStart || !apEnd || !apSessionId || !apTermId) {
      toast({
        title: "Incomplete",
        description: "Choose start and end dates, session, and term.",
        variant: "destructive",
      });
      return;
    }
    if (apEnd < apStart) {
      toast({
        title: "Invalid range",
        description: "End date must be on or after start date.",
        variant: "destructive",
      });
      return;
    }
    await upsertActivePeriod({
      startDate: format(apStart, "yyyy-MM-dd"),
      endDate: format(apEnd, "yyyy-MM-dd"),
      sessionId: apSessionId,
      termId: apTermId,
    });
  };

  const {
    defaultBillingPeriod,
    isLoading: defaultBillingLoading,
    isError: defaultBillingError,
    upsertDefaultBillingPeriod,
    isSaving: savingDefaultBilling,
  } = useDefaultBillingPeriod();

  const [dbpSessionId, setDbpSessionId] = useState("");
  const [dbpTermId, setDbpTermId] = useState("");
  const [dbpStart, setDbpStart] = useState<Date | undefined>();
  const [dbpEnd, setDbpEnd] = useState<Date | undefined>();

  const { terms: dbpTermsRaw, isLoading: dbpTermsLoading } = useTerms({
    page: 1,
    limit: 100,
    sessionId: dbpSessionId || undefined,
    queryEnabled: !!dbpSessionId,
  });

  const dbpTerms = useMemo(() => {
    if (!dbpSessionId) return [];
    return dbpTermsRaw.filter(
      (t) => !t.sessionId || t.sessionId === dbpSessionId,
    );
  }, [dbpTermsRaw, dbpSessionId]);

  useEffect(() => {
    if (!defaultBillingPeriod) return;
    setDbpSessionId(defaultBillingPeriod.sessionId);
    setDbpTermId(defaultBillingPeriod.termId);
    try {
      setDbpStart(parseISO(defaultBillingPeriod.startDate));
      setDbpEnd(parseISO(defaultBillingPeriod.endDate));
    } catch {
      setDbpStart(undefined);
      setDbpEnd(undefined);
    }
  }, [
    defaultBillingPeriod?.id,
    defaultBillingPeriod?.sessionId,
    defaultBillingPeriod?.termId,
    defaultBillingPeriod?.startDate,
    defaultBillingPeriod?.endDate,
    defaultBillingPeriod?.updatedAt,
  ]);

  const handleDbpSessionChange = (value: string) => {
    setDbpSessionId(value);
    setDbpTermId("");
  };

  const handleSaveDefaultBillingPeriod = async () => {
    if (!dbpStart || !dbpEnd || !dbpSessionId || !dbpTermId) {
      toast({
        title: "Incomplete",
        description: "Choose start and end dates, session, and term.",
        variant: "destructive",
      });
      return;
    }
    if (dbpEnd < dbpStart) {
      toast({
        title: "Invalid range",
        description: "End date must be on or after start date.",
        variant: "destructive",
      });
      return;
    }
    await upsertDefaultBillingPeriod({
      startDate: format(dbpStart, "yyyy-MM-dd"),
      endDate: format(dbpEnd, "yyyy-MM-dd"),
      sessionId: dbpSessionId,
      termId: dbpTermId,
    });
  };

  const filteredSessions = useMemo(
    () =>
      sessions.filter((s) =>
        s.name.toLowerCase().includes(sessionSearch.toLowerCase()),
      ),
    [sessions, sessionSearch],
  );

  /** Terms for selected session; includes legacy rows with no sessionId */
  const scopedTerms = useMemo(() => {
    if (!selectedSessionId) return [];
    return terms.filter(
      (t) => !t.sessionId || t.sessionId === selectedSessionId,
    );
  }, [terms, selectedSessionId]);

  const filteredTerms = useMemo(() => {
    const needle = termSearch.toLowerCase().trim();
    if (!needle) return scopedTerms;
    return scopedTerms.filter((t) => t.name.toLowerCase().includes(needle));
  }, [scopedTerms, termSearch]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
    };
    return (
      <Badge
        variant="secondary"
        className={variants[status] ?? "bg-muted text-muted-foreground"}
      >
        {status}
      </Badge>
    );
  };

  const handleAddSession = () => {
    setSessionDialogMode("add");
    setSessionForDialog(undefined);
    setSessionDialogOpen(true);
  };

  const handleEditSession = (session: SchoolSession) => {
    setSessionDialogMode("edit");
    setSessionForDialog(session);
    setSessionDialogOpen(true);
  };

  const handleViewSession = (session: SchoolSession) => {
    setSessionDialogMode("view");
    setSessionForDialog(session);
    setSessionDialogOpen(true);
  };

  const handleDeleteSession = (id: string) => {
    setSessionToDelete(id);
    setSessionDeleteOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSession(sessionToDelete);
    } finally {
      setSessionToDelete(null);
      setSessionDeleteOpen(false);
    }
  };

  const sessionPendingDelete = useMemo(
    () => sessions.find((s) => s.id === sessionToDelete) ?? null,
    [sessions, sessionToDelete],
  );

  const handleSessionSubmit = async (data: SchoolSessionFormData) => {
    if (sessionDialogMode === "add") {
      await addSession({ name: data.name, status: data.status });
    } else if (sessionDialogMode === "edit" && sessionForDialog) {
      await updateSession(sessionForDialog.id, {
        name: data.name,
        status: data.status,
      });
    }
  };

  const handleAddTerm = () => {
    setTermForDialog(undefined);
    setTermDialogMode("add");
    setTermDialogOpen(true);
  };

  const handleEditTerm = (term: Term) => {
    setTermForDialog(term);
    setTermDialogMode("edit");
    setTermDialogOpen(true);
  };

  const handleViewTerm = (term: Term) => {
    setTermForDialog(term);
    setTermDialogMode("view");
    setTermDialogOpen(true);
  };

  const handleDeleteTerm = (id: string) => {
    setTermToDelete(id);
    setTermDeleteOpen(true);
  };

  const confirmDeleteTerm = async () => {
    if (!termToDelete) return;
    try {
      await deleteTerm(termToDelete);
    } finally {
      setTermToDelete(null);
      setTermDeleteOpen(false);
    }
  };

  const termPendingDelete = useMemo(
    () => scopedTerms.find((t) => t.id === termToDelete) ?? null,
    [scopedTerms, termToDelete],
  );

  const handleTermSubmit = async (data: TermFormData) => {
    const sid = selectedSessionId;
    if (termDialogMode === "add") {
      if (!sid) return;
      await addTerm({
        name: data.name,
        status: data.status,
        sessionId: sid,
      });
      return;
    }
    if (termDialogMode === "edit" && termForDialog) {
      await updateTerm(termForDialog.id, {
        name: data.name,
        status: data.status,
        ...(sid ? { sessionId: termForDialog.sessionId ?? sid } : {}),
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Sessions &amp; terms
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Choose an academic session on the left, then add or edit its terms on
          the right (e.g. First Term, Second Term).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
        <Card className="shadow-card border-primary/15 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Active period
            </CardTitle>
            <CardDescription>
              System-wide period used for billing and collections. PUT replaces
              the stored active period (same record updated).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePeriodLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activePeriodError ? (
              <p className="text-sm text-destructive">
                Could not load active period.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-end">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Start date</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !apStart && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          {apStart ? format(apStart, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-background border shadow-md"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={apStart}
                          onSelect={setApStart}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">End date</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !apEnd && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          {apEnd ? format(apEnd, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-background border shadow-md"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={apEnd}
                          onSelect={setApEnd}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Session</span>
                    <Select
                      value={apSessionId}
                      onValueChange={handleApSessionChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Term</span>
                    <Select
                      value={apTermId}
                      onValueChange={setApTermId}
                      disabled={!apSessionId || apTermsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !apSessionId
                              ? "Select a session first"
                              : apTermsLoading
                                ? "Loading…"
                                : "Select term"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {apTerms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleSaveActivePeriod}
                    disabled={savingActivePeriod}
                  >
                    {savingActivePeriod ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save active period"
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-muted/80 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Default billing period
            </CardTitle>
            <CardDescription>
              Default date range and session/term used when opening student
              billing. PUT updates the same stored record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {defaultBillingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : defaultBillingError ? (
              <p className="text-sm text-destructive">
                Could not load default billing period.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-end">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Start date</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dbpStart && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          {dbpStart ? format(dbpStart, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-background border shadow-md"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={dbpStart}
                          onSelect={setDbpStart}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">End date</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dbpEnd && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          {dbpEnd ? format(dbpEnd, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-background border shadow-md"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={dbpEnd}
                          onSelect={setDbpEnd}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Session</span>
                    <Select
                      value={dbpSessionId}
                      onValueChange={handleDbpSessionChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Term</span>
                    <Select
                      value={dbpTermId}
                      onValueChange={setDbpTermId}
                      disabled={!dbpSessionId || dbpTermsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !dbpSessionId
                              ? "Select a session first"
                              : dbpTermsLoading
                                ? "Loading…"
                                : "Select term"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {dbpTerms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleSaveDefaultBillingPeriod}
                    disabled={savingDefaultBilling}
                  >
                    {savingDefaultBilling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save default billing period"
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[520px]">
        <Card className="shadow-card lg:w-[min(100%,380px)] shrink-0 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Sessions
                </CardTitle>
                <CardDescription>Academic years / sessions</CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleAddSession}
                size="sm"
                className="shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add session
              </Button>
            </div>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search sessions…"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
            {sessionsLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-[min(420px,calc(100vh-280px))] pr-3">
                  <div className="space-y-1.5">
                    {filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "flex items-stretch rounded-lg border gap-0 overflow-hidden transition-colors",
                          "hover:bg-accent/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                          selectedSessionId === session.id
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-transparent bg-muted/40",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedSessionId(session.id)}
                          className={cn(
                            "flex-1 min-w-0 text-left px-3 py-2.5 outline-none",
                            "hover:bg-accent/50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium leading-snug">
                              {session.name}
                            </span>
                            {getStatusBadge(String(session.status))}
                          </div>
                          {session.createdAt && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Created{" "}
                              {new Date(session.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  dateStyle: "medium",
                                },
                              )}
                            </p>
                          )}
                          <div className="flex justify-end mt-1">
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 shrink-0 opacity-40",
                                selectedSessionId === session.id &&
                                  "text-primary opacity-100",
                              )}
                            />
                          </div>
                        </button>
                        <div className="flex flex-col justify-center gap-0.5 py-1.5 pr-1.5 pl-0.5 shrink-0 border-l border-border/50 bg-background/40">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="View"
                            onClick={() => {
                              setSelectedSessionId(session.id);
                              handleViewSession(session);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => {
                              setSelectedSessionId(session.id);
                              handleEditSession(session);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => {
                              setSelectedSessionId(session.id);
                              handleDeleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {filteredSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sessions match.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card flex-1 min-w-0 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarRange className="h-5 w-5" />
                  Terms
                </CardTitle>
                <CardDescription>
                  {activeSession ? (
                    <>
                      For{" "}
                      <span className="font-medium text-foreground">
                        {activeSession.name}
                      </span>
                    </>
                  ) : (
                    "Select a session to load terms."
                  )}
                </CardDescription>
              </div>
              <Button
                onClick={handleAddTerm}
                disabled={!selectedSessionId}
                size="sm"
                className="shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add term
              </Button>
            </div>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search terms…"
                value={termSearch}
                onChange={(e) => setTermSearch(e.target.value)}
                className="pl-8"
                disabled={!selectedSessionId}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 min-h-0">
            {!selectedSessionId ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                Choose a session from the list.
              </div>
            ) : termsLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-[min(420px,calc(100vh-280px))]">
                  <div className="grid gap-4 sm:grid-cols-2 pr-3">
                    {filteredTerms.map((term) => (
                      <Card
                        key={term.id}
                        className="border-muted/80 hover:border-muted transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">
                              {term.name}
                            </CardTitle>
                            {getStatusBadge(String(term.status))}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-end gap-1 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTerm(term)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTerm(term)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTerm(term.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                {filteredTerms.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    No terms for this session yet.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <SchoolSessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        mode={sessionDialogMode}
        session={sessionForDialog}
        onSubmit={handleSessionSubmit}
      />

      <TermDialog
        open={termDialogOpen}
        onOpenChange={setTermDialogOpen}
        mode={termDialogMode}
        term={termForDialog}
        onSubmit={handleTermSubmit}
      />

      <AlertDialog open={sessionDeleteOpen} onOpenChange={setSessionDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              {sessionPendingDelete ? (
                <>
                  Delete{" "}
                  <span className="font-medium text-foreground">
                    {sessionPendingDelete.name}
                  </span>
                  ? This cannot be undone. Associated terms, entitlements, and
                  collections may be affected.
                </>
              ) : (
                "This cannot be undone. Associated data may be affected."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSession}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={termDeleteOpen} onOpenChange={setTermDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete term?</AlertDialogTitle>
            <AlertDialogDescription>
              {termPendingDelete ? (
                <>
                  Delete{" "}
                  <span className="font-medium text-foreground">
                    {termPendingDelete.name}
                  </span>
                  ? This cannot be undone.
                </>
              ) : (
                "This cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTerm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
