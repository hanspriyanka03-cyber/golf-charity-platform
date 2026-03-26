import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { adminApi, charitiesApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import type { Charity } from '../../types'

interface CharityForm {
  name: string
  description: string
  image_url: string
  website: string
  is_featured: boolean
}

const emptyForm: CharityForm = {
  name: '',
  description: '',
  image_url: '',
  website: '',
  is_featured: false,
}

export default function AdminCharities() {
  const [showModal, setShowModal] = useState(false)
  const [editingCharity, setEditingCharity] = useState<Charity | null>(null)
  const [form, setForm] = useState<CharityForm>(emptyForm)
  const queryClient = useQueryClient()

  const { data: charities, isLoading } = useQuery({
    queryKey: ['admin-charities'],
    queryFn: () => charitiesApi.listCharities().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: CharityForm) => adminApi.createCharity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-charities', 'charities'] })
      toast.success('Charity created!')
      setShowModal(false)
      setForm(emptyForm)
    },
    onError: () => toast.error('Failed to create charity'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Charity> }) =>
      adminApi.updateCharity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-charities', 'charities'] })
      toast.success('Charity updated!')
      setShowModal(false)
      setEditingCharity(null)
    },
    onError: () => toast.error('Failed to update charity'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCharity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-charities', 'charities'] })
      toast.success('Charity removed')
    },
    onError: () => toast.error('Failed to remove charity'),
  })

  const openCreate = () => {
    setEditingCharity(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (charity: Charity) => {
    setEditingCharity(charity)
    setForm({
      name: charity.name,
      description: charity.description || '',
      image_url: charity.image_url || '',
      website: charity.website || '',
      is_featured: charity.is_featured,
    })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (editingCharity) {
      updateMutation.mutate({ id: editingCharity.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Charities</h1>
            <p className="text-text-secondary text-sm mt-0.5">Manage charity partners</p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus size={16} />
            Add Charity
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Charity</th>
                    <th>Featured</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charities?.map(charity => (
                    <tr key={charity.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {charity.image_url && (
                            <img
                              src={charity.image_url}
                              alt={charity.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-text-primary">{charity.name}</p>
                            <p className="text-xs text-text-muted truncate max-w-[200px]">{charity.description}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {charity.is_featured && (
                          <div className="flex items-center gap-1 text-accent text-xs">
                            <Star size={12} className="fill-accent" />
                            Featured
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge variant={charity.is_active ? 'green' : 'default'}>
                          {charity.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(charity)}>
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remove ${charity.name}?`)) deleteMutation.mutate(charity.id)
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCharity ? 'Edit Charity' : 'Add Charity'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Charity name"
          />
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">Description</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Charity description"
            />
          </div>
          <Input
            label="Image URL"
            value={form.image_url}
            onChange={e => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Website"
            value={form.website}
            onChange={e => setForm({ ...form, website: e.target.value })}
            placeholder="https://charity.org"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => setForm({ ...form, is_featured: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-text-secondary">Featured charity</span>
          </label>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button
              isLoading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit}
              disabled={!form.name}
              className="flex-1"
            >
              {editingCharity ? 'Save Changes' : 'Create Charity'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
