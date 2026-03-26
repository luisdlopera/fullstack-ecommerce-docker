'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { SearchInput } from '@/components/admin/SearchInput';
import { FilterSelect } from '@/components/admin/FilterSelect';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FormModal } from '@/components/admin/FormModal';
import { ErrorState } from '@/components/admin/ErrorState';
import { usersApi } from '@/services/admin-api';
import type { AdminUser, Role } from '@/types/admin';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'USER', label: 'User' }
];

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' }
];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      usersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter ? statusFilter === 'true' : undefined
      })
  });

  const createMutation = useMutation({
    mutationFn: (formData: Record<string, unknown>) => usersApi.create(formData),
    onSuccess: () => {
      toast.success('Usuario creado');
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => usersApi.update(id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => usersApi.updateStatus(id, isActive),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success('Rol actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (u) => (
        <div>
          <p className='font-medium text-gray-900'>{u.name}</p>
          <p className='text-xs text-gray-500'>{u.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Rol',
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
          className='rounded border border-gray-200 bg-transparent px-2 py-1 text-xs font-medium'
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      render: (u) => (
        <button onClick={() => toggleStatusMutation.mutate({ id: u.id, isActive: !u.isActive })}>
          <StatusBadge value={u.isActive ? 'Activo' : 'Inactivo'} variant={u.isActive ? 'green' : 'red'} />
        </button>
      )
    },
    {
      key: 'orders',
      header: 'Órdenes',
      render: (u) => <span>{u._count?.Order ?? 0}</span>
    },
    {
      key: 'createdAt',
      header: 'Registro',
      render: (u) => <span className='text-xs'>{formatDate(u.createdAt)}</span>
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className='flex justify-end gap-2'>
          <button
            onClick={() => setEditUser(u)}
            className='rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100'
          >
            Editar
          </button>
          <button
            onClick={() => setDeleteTarget(u)}
            className='rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50'
          >
            Eliminar
          </button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <>
        <AdminPageHeader title='Usuarios' />
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title='Usuarios'
        description='Administra los usuarios registrados en la plataforma'
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className='flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800'
          >
            <Plus size={16} /> Nuevo usuario
          </button>
        }
      />

      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder='Buscar por nombre, email o ID...' />
        <FilterSelect value={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }} options={ROLE_OPTIONS} placeholder='Todos los roles' />
        <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={STATUS_OPTIONS} placeholder='Todos los estados' />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage='No se encontraron usuarios'
      />

      <UserFormModal
        open={createOpen}
        title='Crear usuario'
        loading={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(formData) => createMutation.mutate(formData)}
      />

      {editUser && (
        <UserFormModal
          open
          title='Editar usuario'
          initialData={editUser}
          loading={updateMutation.isPending}
          onClose={() => setEditUser(null)}
          onSubmit={(formData) => updateMutation.mutate({ id: editUser.id, data: formData })}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title='Eliminar usuario'
        description={`¿Estás seguro de eliminar a "${deleteTarget?.name}"? Esta acción desactivará la cuenta.`}
        confirmLabel='Eliminar'
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function UserFormModal({
  open,
  title,
  initialData,
  loading,
  onClose,
  onSubmit
}: {
  open: boolean;
  title: string;
  initialData?: AdminUser;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const data: Record<string, unknown> = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone') || undefined
    };
    if (!initialData) {
      data.password = fd.get('password');
      data.role = fd.get('role');
    }
    onSubmit(data);
  };

  return (
    <FormModal open={open} title={title} onClose={onClose} onSubmit={handleSubmit} loading={loading}>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>Nombre *</label>
          <input name='name' defaultValue={initialData?.name ?? ''} required className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black' />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>Email *</label>
          <input name='email' type='email' defaultValue={initialData?.email ?? ''} required className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black' />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>Teléfono</label>
          <input name='phone' defaultValue={initialData?.phone ?? ''} className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black' />
        </div>
        {!initialData && (
          <>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>Contraseña *</label>
              <input name='password' type='password' required minLength={6} className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black' />
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>Rol</label>
              <select name='role' defaultValue='USER' className='h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-black'>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </>
        )}
      </div>
    </FormModal>
  );
}
