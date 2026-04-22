import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ClassTeacher } from "@/hooks/useClassTeachers";
import { useClasses } from "@/hooks/useClasses";

const classTeacherSchema = z.object({
  class_id: z.string().optional(),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Teacher name is required"),
  role: z.enum(["class_teacher", "assistant_teacher", "subject_teacher"]),
  status: z.enum(["active", "inactive", "archived"]),
});

type ClassTeacherFormData = z.infer<typeof classTeacherSchema>;

interface ClassTeacherFormProps {
  initialData?: Partial<ClassTeacher>;
  mode?: 'add' | 'edit';
  onSubmit: (data: ClassTeacherFormData) => void;
  onCancel: () => void;
}

export function ClassTeacherForm({ initialData, mode, onSubmit, onCancel }: ClassTeacherFormProps) {
  const { classes } = useClasses();
  const [classOpen, setClassOpen] = useState(false);

  const form = useForm<ClassTeacherFormData>({
    resolver: zodResolver(classTeacherSchema),
    defaultValues: {
      class_id: initialData?.class_id || "none",
      email: initialData?.email || "",
      name: initialData?.name || "",
      role: initialData?.role || "class_teacher",
      status: initialData?.status || "active",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class (Optional)</FormLabel>
              <Popover open={classOpen} onOpenChange={setClassOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={classOpen}
                      className="w-full justify-between"
                    >
                      {field.value === "none" || !field.value
                        ? "No class assigned"
                        : classes.find((classItem) => classItem.id === field.value)?.name}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search classes..." />
                    <CommandList>
                      <CommandEmpty>No class found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            form.setValue("class_id", "none");
                            setClassOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === "none" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          No class assigned
                        </CommandItem>
                        {classes.map((classItem) => (
                          <CommandItem
                            key={classItem.id}
                            value={classItem.id}
                            onSelect={() => {
                              form.setValue("class_id", classItem.id);
                              setClassOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === classItem.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {classItem.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter teacher name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter teacher email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="class_teacher">Class Teacher</SelectItem>
                  <SelectItem value="assistant_teacher">Assistant Teacher</SelectItem>
                  <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === 'edit' && (
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
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
            {initialData ? "Update Teacher" : "Add Teacher"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
