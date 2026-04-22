import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supplierApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export interface Supplier {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  website?: string
  notes?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export const useSuppliers = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: supplierApi.list,
  })

  const addMutation = useMutation({
    mutationFn: supplierApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Success',
        description: 'Supplier added successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add supplier',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      supplierApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Success',
        description: 'Supplier updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update supplier',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: supplierApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete supplier',
        variant: 'destructive',
      })
    },
  })

  return {
    suppliers,
    isLoading,
    error,
    addSupplier: addMutation.mutate,
    updateSupplier: (id: string, data: Partial<Supplier>) =>
      updateMutation.mutate({ id, data }),
    deleteSupplier: deleteMutation.mutate,
  }
}