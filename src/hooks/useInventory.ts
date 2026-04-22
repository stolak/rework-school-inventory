import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api'
import { toast } from 'sonner'

export interface InventoryItem {
  id: string
  sku?: string
  name: string
  category_id?: string
  sub_category_id?: string
  brand_id?: string
  uom_id?: string
  barcode?: string
  cost_price: number
  selling_price: number
  low_stock_threshold: number
  current_stock: number
  created_by?: string
  created_at?: string
  updated_at?: string
  // Relations
  categories?: { id: string; name: string }
  sub_categories?: { id: string; name: string }
  brands?: { id: string; name: string }
  uoms?: { id: string; name: string; symbol?: string }
}

export function useInventory() {
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.list,
  })

  const addMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Inventory item added successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Inventory item updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Inventory item deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`)
    },
  })

  return {
    items,
    isLoading,
    addItem: (data: any) => addMutation.mutate(data),
    updateItem: (id: string, data: any) => updateMutation.mutate({ id, data }),
    deleteItem: (id: string) => deleteMutation.mutate(id),
  }
}