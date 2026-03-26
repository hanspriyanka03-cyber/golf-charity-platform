import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, ChevronDown, ChevronUp, Pencil, Target } from 'lucide-react'
import { adminApi } from '../../lib/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatDate } from '../../lib/utils'
import type { User } from '../../types'

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, statusFilter],
    queryFn: () => adminApi.listUsers({ search, subscription_status: statusFilter || undefined }).then(r => r.data),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated')
      setEditingUser(null)
    },
    onError: () => toast.error('Failed to update user'),
  })

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage platform users and subscriptions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field max-w-[180px]"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
            <option value="lapsed">Lapsed</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Subscription</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-background shrink-0">
                            {(user.full_name || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary text-sm">{user.full_name || '—'}</p>
                            <p className="text-xs text-text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={user.role === 'admin' ? 'gold' : 'default'}>{user.role}</Badge>
                      </td>
                      <td>
                        <Badge variant="status" status={user.subscription_status}>
                          {user.subscription_status}
                        </Badge>
                      </td>
                      <td className="text-text-muted text-sm">
                        {user.created_at ? formatDate(user.created_at) : '—'}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!users || users.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center text-text-muted py-8">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit user modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        {editingUser && (
          <div className="space-y-4">
            <div className="bg-surface-2 rounded-xl p-3 text-sm text-text-muted">
              <p>ID: {editingUser.id}</p>
              <p>Email: {editingUser.email}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Role</label>
                <select
                  className="input-field"
                  defaultValue={editingUser.role}
                  id="edit-role"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Subscription Status</label>
                <select
                  className="input-field"
                  defaultValue={editingUser.subscription_status}
                  id="edit-sub-status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="lapsed">Lapsed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Active</label>
                <select
                  className="input-field"
                  defaultValue={editingUser.is_active ? 'true' : 'false'}
                  id="edit-active"
                >
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setEditingUser(null)} className="flex-1">Cancel</Button>
              <Button
                isLoading={updateUserMutation.isPending}
                onClick={() => {
                  const role = (document.getElementById('edit-role') as HTMLSelectElement).value
                  const subStatus = (document.getElementById('edit-sub-status') as HTMLSelectElement).value
                  const isActive = (document.getElementById('edit-active') as HTMLSelectElement).value === 'true'
                  updateUserMutation.mutate({
                    id: editingUser.id,
                    data: { role: role as User['role'], subscription_status: subStatus as User['subscription_status'], is_active: isActive },
                  })
                }}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
