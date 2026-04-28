import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Student } from "@/hooks/useStudents"
import { useClasses } from "@/hooks/useClasses"

const studentSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  classId: z.string().min(1, "Class is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianContact: z.string().min(1, "Guardian contact is required"),
  guardianEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  studentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive", "Graduated"]).optional(),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
})

type StudentFormData = z.infer<typeof studentSchema>

interface StudentFormProps {
  initialData?: Partial<Student>
  onSubmit: (data: StudentFormData) => void
  onCancel: () => void
}

function toDateInputValue(iso?: string) {
  if (!iso) return ""
  return iso.includes("T") ? iso.slice(0, 10) : iso.slice(0, 10)
}

export function StudentForm({ initialData, onSubmit, onCancel }: StudentFormProps) {
  const { classes } = useClasses({ page: 1, limit: 100 })

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNumber: initialData?.admissionNumber || "",
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      classId: initialData?.classId || "",
      guardianName: initialData?.guardianName || "",
      guardianContact: initialData?.guardianContact || "",
      guardianEmail: initialData?.guardianEmail || "",
      studentEmail: initialData?.studentEmail || "",
      status: (initialData?.status as StudentFormData["status"]) || "Active",
      gender: initialData?.gender || "male",
      dateOfBirth: toDateInputValue(initialData?.dateOfBirth),
      address: initialData?.address || "",
    },
  })

  const isEdit = Boolean(initialData?.id)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="admissionNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admission Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter admission number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter middle name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="guardianName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter guardian name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardianContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Enter guardian contact" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="guardianEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter guardian email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter student email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter student address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-primary">
            {initialData?.id ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
