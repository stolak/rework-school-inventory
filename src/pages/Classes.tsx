import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClasses, type SchoolClass } from "@/hooks/useClasses";
import { useSubClasses, type SubClass } from "@/hooks/useSubClasses";
import { ClassDialog } from "@/components/dialogs/ClassDialog";
import { SubClassDialog } from "@/components/dialogs/SubClassDialog";
import type { SubClassFormData } from "@/components/forms/SubClassForm";
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

export default function Classes() {
  const { classes, addClass, updateClass, deleteClass, isLoading: classesLoading } = useClasses({
    page: 1,
    limit: 100,
  });

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId(null);
      return;
    }
    if (!selectedClassId || !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const activeClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  const {
    subClasses,
    addSubClass,
    updateSubClass,
    deleteSubClass,
    isLoading: subClassesLoading,
  } = useSubClasses({
    page: 1,
    limit: 100,
    classId: selectedClassId ?? undefined,
    queryEnabled: !!selectedClassId,
  });

  const [classSearch, setClassSearch] = useState("");
  const [subSearch, setSubSearch] = useState("");

  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [classDialogMode, setClassDialogMode] = useState<"add" | "edit" | "view">("add");
  const [classForDialog, setClassForDialog] = useState<SchoolClass | undefined>();
  const [classDeleteOpen, setClassDeleteOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subDialogMode, setSubDialogMode] = useState<"add" | "edit" | "view">("add");
  const [selectedSubClass, setSelectedSubClass] = useState<SubClass | undefined>();
  const [subDeleteOpen, setSubDeleteOpen] = useState(false);
  const [subClassToDelete, setSubClassToDelete] = useState<string | null>(null);

  const filteredClasses = useMemo(
    () =>
      classes.filter(
        (c) =>
          c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
          String(c.status).toLowerCase().includes(classSearch.toLowerCase())
      ),
    [classes, classSearch]
  );

  const filteredSubClasses = useMemo(() => {
    if (!selectedClassId) return [];
    const needle = subSearch.toLowerCase().trim();
    if (!needle) return subClasses;
    return subClasses.filter((s) => s.name.toLowerCase().includes(needle));
  }, [subClasses, selectedClassId, subSearch]);

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
    } as const;

    return (
      <Badge
        variant="secondary"
        className={variants[status as keyof typeof variants] ?? "bg-muted text-muted-foreground"}
      >
        {status}
      </Badge>
    );
  };

  const handleAddClass = () => {
    setClassDialogMode("add");
    setClassForDialog(undefined);
    setClassDialogOpen(true);
  };

  const handleEditClass = (schoolClass: SchoolClass) => {
    setClassDialogMode("edit");
    setClassForDialog(schoolClass);
    setClassDialogOpen(true);
  };

  const handleViewClass = (schoolClass: SchoolClass) => {
    setClassDialogMode("view");
    setClassForDialog(schoolClass);
    setClassDialogOpen(true);
  };

  const handleDeleteClass = (id: string) => {
    setClassToDelete(id);
    setClassDeleteOpen(true);
  };

  const confirmDeleteClass = () => {
    if (!classToDelete) return;
    try {
      deleteClass(classToDelete);
    } finally {
      setClassToDelete(null);
      setClassDeleteOpen(false);
    }
  };

  const classPendingDelete = useMemo(
    () => classes.find((c) => c.id === classToDelete) ?? null,
    [classes, classToDelete]
  );

  const handleClassSubmit = (data: unknown) => {
    if (classDialogMode === "add") {
      addClass(data as { name: string; status: "Active" | "Inactive" });
    } else if (classDialogMode === "edit" && classForDialog) {
      updateClass(classForDialog.id, data as Partial<SchoolClass>);
    }
  };

  const handleAddSub = () => {
    setSelectedSubClass(undefined);
    setSubDialogMode("add");
    setSubDialogOpen(true);
  };

  const handleEditSub = (sc: SubClass) => {
    setSelectedSubClass(sc);
    setSubDialogMode("edit");
    setSubDialogOpen(true);
  };

  const handleViewSub = (sc: SubClass) => {
    setSelectedSubClass(sc);
    setSubDialogMode("view");
    setSubDialogOpen(true);
  };

  const handleDeleteSub = (id: string) => {
    setSubClassToDelete(id);
    setSubDeleteOpen(true);
  };

  const confirmDeleteSub = async () => {
    if (!subClassToDelete) return;
    try {
      await deleteSubClass(subClassToDelete);
    } finally {
      setSubDeleteOpen(false);
      setSubClassToDelete(null);
    }
  };

  const subPendingDelete = useMemo(
    () => subClasses.find((s) => s.id === subClassToDelete) ?? null,
    [subClasses, subClassToDelete]
  );

  const handleSubSubmit = async (data: SubClassFormData) => {
    if (subDialogMode === "add") {
      await addSubClass({
        name: data.name,
        classId: data.classId,
        status: data.status,
      });
    } else if (subDialogMode === "edit" && selectedSubClass) {
      await updateSubClass(selectedSubClass.id, {
        name: data.name,
        classId: data.classId,
        status: data.status,
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          Classes &amp; sub-classes
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Select a class on the left, then manage its sub-classes (e.g. A, B, C) on the right.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[520px]">
        <Card className="shadow-card lg:w-[min(100%,400px)] shrink-0 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Classes
                </CardTitle>
                <CardDescription>School classes and distribution summary</CardDescription>
              </div>
              <Button
                type="button"
                className="bg-gradient-primary shrink-0"
                size="sm"
                onClick={handleAddClass}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add class
              </Button>
            </div>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search classes…"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
            {classesLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-[min(420px,calc(100vh-280px))] pr-3">
                  <div className="space-y-1.5">
                    {filteredClasses.map((schoolClass) => {
                      const p = schoolClass.distributionProgress ?? 0;
                      return (
                        <div
                          key={schoolClass.id}
                          className={cn(
                            "flex items-stretch rounded-lg border gap-0 overflow-hidden transition-colors",
                            "hover:bg-accent/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                            selectedClassId === schoolClass.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-transparent bg-muted/40"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedClassId(schoolClass.id)}
                            className={cn(
                              "flex-1 min-w-0 text-left px-3 py-2.5 outline-none",
                              "hover:bg-accent/50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium leading-snug">{schoolClass.name}</span>
                              {getStatusBadge(String(schoolClass.status))}
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Distribution</span>
                                <span className="font-medium text-foreground">{p}%</span>
                              </div>
                              <Progress value={p} className="h-1.5" />
                              <p className="text-[11px] text-muted-foreground">
                                {schoolClass.distributedItems ?? 0} of {schoolClass.totalItems ?? 0}{" "}
                                items
                              </p>
                            </div>
                            <div className="flex items-center justify-end mt-1">
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 shrink-0 opacity-40",
                                  selectedClassId === schoolClass.id && "text-primary opacity-100"
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
                              title="View details"
                              onClick={() => {
                                setSelectedClassId(schoolClass.id);
                                handleViewClass(schoolClass);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Edit class"
                              onClick={() => {
                                setSelectedClassId(schoolClass.id);
                                handleEditClass(schoolClass);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete class"
                              onClick={() => {
                                setSelectedClassId(schoolClass.id);
                                handleDeleteClass(schoolClass.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {filteredClasses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No classes match.</p>
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
                  <Layers className="h-5 w-5" />
                  Sub-classes
                </CardTitle>
                <CardDescription>
                  {activeClass ? (
                    <>
                      For <span className="font-medium text-foreground">{activeClass.name}</span>
                    </>
                  ) : (
                    "Select a class to load sub-classes."
                  )}
                </CardDescription>
              </div>
              <Button
                onClick={handleAddSub}
                disabled={!selectedClassId}
                size="sm"
                className="bg-gradient-primary shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add sub-class
              </Button>
            </div>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-4 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search sub-classes…"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="pl-8"
                disabled={!selectedClassId}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 min-h-0">
            {!selectedClassId ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                Choose a class from the list.
              </div>
            ) : subClassesLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <ScrollArea className="h-[min(420px,calc(100vh-280px))]">
                  <div className="grid gap-4 sm:grid-cols-2 pr-3">
                    {filteredSubClasses.map((sc) => (
                      <Card
                        key={sc.id}
                        className="border-muted/80 hover:border-muted transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{sc.name}</CardTitle>
                            {getStatusBadge(String(sc.status))}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-end gap-1 pt-1">
                            <Button size="sm" variant="outline" onClick={() => handleViewSub(sc)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditSub(sc)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSub(sc.id)}
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
                {filteredSubClasses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    No sub-classes for this class yet.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ClassDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        mode={classDialogMode}
        classItem={classForDialog}
        onSubmit={handleClassSubmit}
      />

      <SubClassDialog
        open={subDialogOpen}
        onOpenChange={setSubDialogOpen}
        mode={subDialogMode}
        subClass={selectedSubClass}
        defaultClassId={selectedClassId ?? undefined}
        onSubmit={handleSubSubmit}
      />

      <AlertDialog open={classDeleteOpen} onOpenChange={setClassDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              {classPendingDelete ? (
                <>
                  Delete <span className="font-medium text-foreground">{classPendingDelete.name}</span>
                  ? This cannot be undone. Associated students and entitlements may be affected.
                </>
              ) : (
                "This cannot be undone. Associated students and entitlements may be affected."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClass}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={subDeleteOpen} onOpenChange={setSubDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-class?</AlertDialogTitle>
            <AlertDialogDescription>
              {subPendingDelete ? (
                <>
                  Delete <span className="font-medium text-foreground">{subPendingDelete.name}</span>
                  ? This cannot be undone.
                </>
              ) : (
                "This cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSub}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
