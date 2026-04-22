import { useState } from "react"
import { Plus, Search, Eye, Edit, Trash2, Calendar, Users, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSessions, Session } from "@/hooks/useSessions"
import { SessionDialog } from "@/components/dialogs/SessionDialog"
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
  const { sessions, addSession, updateSession, deleteSession, isLoading } = useSessions()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedSession, setSelectedSession] = useState<Session | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.session.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedSession(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (session: Session) => {
    setDialogMode('edit')
    setSelectedSession(session)
    setDialogOpen(true)
  }

  const handleView = (session: Session) => {
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
      toast({
        title: "Adding...",
        description: "Please wait while we add the session",
      });
      try {
        await addSession(data);
        toast({
          title: "Success",
          description: "Session added successfully",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to add session",
          variant: "destructive",
        });
      }
    } else if (dialogMode === 'edit' && selectedSession) {
      toast({
        title: "Updating...",
        description: "Please wait while we update the session",
      });
      try {
        await updateSession(selectedSession.id, data);
        toast({
          title: "Success",
          description: "Session updated successfully",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update session",
          variant: "destructive",
        });
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      'active': 'default',
      'inactive': 'secondary',
      'archived': 'outline',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sessions & Terms</h1>
          <p className="text-muted-foreground">Manage academic sessions and terms</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{session.name}</CardTitle>
                {getStatusBadge(session.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{formatDateRange(session.start_date, session.end_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Academic Session</p>
                  <p className="font-medium">{session.session}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <BookOpen className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold text-primary">{session.totalClasses}</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold text-primary">{session.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
              </div>

              <div className="flex justify-end space-x-1 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(session)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(session)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(session.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No sessions found</p>
        </div>
      )}

      <SessionDialog
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