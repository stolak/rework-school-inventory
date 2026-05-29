import { Users, Plus, Search, GraduationCap, Edit, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useStudents } from "@/hooks/useStudents"
import { StudentDialog } from "@/components/dialogs/StudentDialog"
import { useEffect, useMemo, useState } from "react"
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
import { Combobox } from "@/components/ui/combobox"
import { useClasses } from "@/hooks/useClasses"
import { useSubClasses } from "@/hooks/useSubClasses"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Student } from "@/hooks/useStudents"
import { TablePaginationBar } from "@/components/ui/table-pagination-bar"

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("")
  const [classId, setClassId] = useState("all")
  const [subClassId, setSubClassId] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { classes } = useClasses({ page: 1, limit: 100 })
  const { subClasses } = useSubClasses({ page: 1, limit: 500 })

  useEffect(() => {
    setPage(1)
  }, [classId, subClassId, statusFilter, limit])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const listQuery = useMemo(
    () => ({
      page,
      limit,
      classId: classId === "all" ? undefined : classId,
      subClassId: subClassId === "all" ? undefined : subClassId,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [classId, subClassId, statusFilter, page, limit]
  )

  const { students, pagination, addStudent, updateStudent, deleteStudent, isLoading } =
    useStudents(listQuery)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)

  const availableSubClasses = useMemo(() => {
    if (classId === "all") return subClasses
    return subClasses.filter((sc) => sc.classId === classId)
  }, [subClasses, classId])

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students
    const q = searchTerm.toLowerCase()
    return students.filter((s) => {
      return (
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.admissionNumber || "").toLowerCase().includes(q) ||
        (s.className || "").toLowerCase().includes(q) ||
        (s.subClassName || "").toLowerCase().includes(q)
      )
    })
  }, [students, searchTerm])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-success/10 text-success",
      Inactive: "bg-warning/10 text-warning",
      Graduated: "bg-primary/10 text-primary",
    }

    return (
      <Badge variant="secondary" className={variants[status] ?? "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  const handleAdd = () => {
    setDialogMode('add')
    setSelectedStudent(null)
    setDialogOpen(true)
  }

  const handleEdit = (student: Student) => {
    setDialogMode('edit')
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handleView = (student: Student) => {
    setDialogMode('view')
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await deleteStudent(studentToDelete);
        setStudentToDelete(null);
        setDeleteDialogOpen(false);
      } catch (err) {
        // Error is already handled in the hook
        setStudentToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === 'add') {
      try {
        const { status: _omitStatus, ...createPayload } = data
        await addStudent(createPayload)
      } catch (err) {
        // Error is already handled in the hook
      }
    } else if (dialogMode === 'edit' && selectedStudent) {
      try {
        await updateStudent(selectedStudent.id, data)
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            Student Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage student records and track inventory distributions
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      {/* Search (client-side) + Backend filters (classId, subClassId, status) */}
      <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-[240px]">
          <Combobox
            value={classId === "all" ? "" : classId}
            onValueChange={(v) => {
              const next = v || "all"
              setClassId(next)
              setSubClassId("all")
            }}
            options={[
              { value: "", label: "All classes" },
              ...classes.map((c) => ({ value: c.id, label: c.name })),
            ]}
            placeholder="Class"
            searchPlaceholder="Search classes..."
          />
        </div>

        <div className="w-full sm:w-[240px]">
          <Combobox
            value={subClassId === "all" ? "" : subClassId}
            onValueChange={(v) => setSubClassId(v || "all")}
            options={[
              { value: "", label: "All sub classes" },
              ...availableSubClasses.map((sc) => ({
                value: sc.id,
                label: `${sc.name}${sc.class?.name ? ` — ${sc.class.name}` : ""}`,
              })),
            ]}
            placeholder="Sub Class"
            searchPlaceholder="Search sub classes..."
            disabled={classId === "all"}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-md">
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Graduated">Graduated</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 w-full xl:w-auto xl:ml-auto">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No students found.</div>
      ) : viewMode === "grid" ? (
        <div className="space-y-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
          <Card key={student.id} className="shadow-card hover:shadow-elevated transition-all duration-300">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 bg-gradient-primary">
                  <AvatarFallback className="text-primary-foreground font-medium">
                    {getInitials(student.firstName, student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {student.admissionNumber}
                      </p>
                    </div>
                    {getStatusBadge(student.status)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{student.className || 'No Class'}</span>
                </div>
                {student.subClassName && (
                  <p className="text-xs text-muted-foreground pl-6">
                    Sub Class: <span className="font-medium text-foreground">{student.subClassName}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Guardian</p>
                <p className="font-medium">{student.guardianName}</p>
                <p className="text-sm text-muted-foreground">{student.guardianContact}</p>
                {student.guardianEmail && (
                  <p className="text-sm text-muted-foreground">{student.guardianEmail}</p>
                )}
              </div>

              {student.studentEmail && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Student Email</p>
                  <p className="text-sm font-medium">{student.studentEmail}</p>
                </div>
              )}

              

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleView(student)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(student)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(student.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
        {pagination ? (
          <div className="rounded-md border bg-background overflow-hidden mt-4">
            <TablePaginationBar
              pagination={pagination}
              totalLabel="Total students"
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit)
                setPage(1)
              }}
            />
          </div>
        ) : null}
        </div>
      ) : (
        <div className="rounded-md border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Sub Class</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 bg-gradient-primary shrink-0">
                          <AvatarFallback className="text-primary-foreground text-xs font-medium">
                            {getInitials(student.firstName, student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {student.firstName} {student.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{student.admissionNumber}</TableCell>
                    <TableCell>{student.className || "—"}</TableCell>
                    <TableCell>{student.subClassName || "—"}</TableCell>
                    <TableCell>{student.guardianName}</TableCell>
                    <TableCell>{student.guardianContact}</TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {student.guardianEmail || student.studentEmail || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pagination ? (
            <TablePaginationBar
              pagination={pagination}
              totalLabel="Total students"
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit)
                setPage(1)
              }}
            />
          ) : null}
        </div>
      )}

     

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        student={selectedStudent}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student and all associated data.
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