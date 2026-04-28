import { useMemo, useState } from "react"
import { Plus, Search, Eye, Edit, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useSchoolSessions, type SchoolSession } from "@/hooks/useSchoolSessions"
import { SchoolSessionDialog } from "@/components/dialogs/SchoolSessionDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Sessions() {
  const { sessions, addSession, updateSession, deleteSession, isLoading } = useSchoolSessions({
    page: 1,
    limit: 20,
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedSession, setSelectedSession] = useState<SchoolSession | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return sessions
    const q = searchTerm.toLowerCase()
    return sessions.filter((s) => s.name.toLowerCase().includes(q))
  }, [sessions, searchTerm])

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedSession(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (session: SchoolSession) => {
    setDialogMode('edit')
    setSelectedSession(session)
    setDialogOpen(true)
  }

  const handleView = (session: SchoolSession) => {
    setDialogMode('view')
    setSelectedSession(session)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setSessionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      try {
        await deleteSession(sessionToDelete);
        setSessionToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setSessionToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      await addSession(data)
    } else if (dialogMode === 'edit' && selectedSession) {
      await updateSession(selectedSession.id, data)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
    };
    return (
      <Badge variant="secondary" className={variants[status] ?? "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Sessions
          </h1>
          <p className="text-muted-foreground">Manage academic sessions</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Session
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                  <TableCell>
                    {session.createdAt ? new Date(session.createdAt).toLocaleString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(session)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(session)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(session.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No sessions found</p>
        </div>
      )}

      <SchoolSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        session={selectedSession}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              session/term and all associated data including entitlements and collections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}