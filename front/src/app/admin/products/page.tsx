'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  AdminPageHeader,
  ConfirmDialog,
  DataTable,
  ErrorState,
  PERMISSIONS,
  productsApi,
  StatusBadge,
  type AdminProduct,
  type Column,
} from '@/features/admin';
import { GENDER_OPTIONS, SIZE_OPTIONS } from '@/config/constants';
import { useAdminProducts } from './hooks';
import { ProductFilters } from './components';
import { ProductFormModal } from './components/ProductFormModal';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(v);
}

export default function AdminProductsPage() {
  const { hasPermission } = usePermissions();
  const canWrite =
    hasPermission(PERMISSIONS.PRODUCTS_CREATE) ||
    hasPermission(PERMISSIONS.PRODUCTS_UPDATE) ||
    hasPermission(PERMISSIONS.INVENTORY_ADJUST);
  const canDelete = hasPermission(PERMISSIONS.PRODUCTS_DELETE);

  const queryClient = useQueryClient();

  const {
    products,
    paginationMeta,
    categoryOptions,
    isLoading,
    error,
    filters,
    setters,
    selectedKeys,
    setSelectedKeys,
    modals,
  } = useAdminProducts();

  const { setEditProduct, setDeleteTarget } = modals;

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => productsApi.update(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado');
      setEditProduct(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      toast.success('Producto eliminado');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => productsApi.updateStatus(id, isActive),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns: Column<AdminProduct>[] = [
    {
      key: 'product',
      header: 'Producto',
      render: (p) => (
        <div className='flex items-center gap-3'>
          {p.ProductImage?.[0]?.url ? (
            <Image
              src={p.ProductImage[0].url}
              alt={p.title}
              width={40}
              height={40}
              className='h-10 w-10 rounded-lg object-cover'
              unoptimized
            />
          ) : (
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
              <ImageIcon size={16} className='text-gray-400' />
            </div>
          )}
          <div>
            <p className='font-medium text-gray-900'>{p.title}</p>
            <p className='text-xs text-gray-500'>{p.sku ?? p.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (p) => <span className='text-sm'>{p.category.name}</span>,
    },
    {
      key: 'price',
      header: 'Precio',
      render: (p) => (
        <div>
          <span className='font-semibold'>{formatCurrency(p.price)}</span>
          {p.comparePrice && (
            <span className='ml-1 text-xs text-gray-400 line-through'>{formatCurrency(p.comparePrice)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => (
        <StatusBadge
          value={p.inStock > 0 ? `${p.inStock} uds` : 'Agotado'}
          variant={p.inStock > 10 ? 'green' : p.inStock > 0 ? 'yellow' : 'red'}
        />
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (p) =>
        canWrite ? (
          <button type='button' onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}>
            <StatusBadge value={p.isActive ? 'Activo' : 'Inactivo'} variant={p.isActive ? 'green' : 'gray'} />
          </button>
        ) : (
          <StatusBadge value={p.isActive ? 'Activo' : 'Inactivo'} variant={p.isActive ? 'green' : 'gray'} />
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className='flex justify-end gap-2'>
          {canWrite && (
            <Link
              href={`/admin/products/${p.id}/edit`}
              className='rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100'
            >
              Editar
            </Link>
          )}
          {canDelete && (
            <button
              type='button'
              onClick={() => setDeleteTarget(p)}
              className='rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50'
            >
              Eliminar
            </button>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <>
        <AdminPageHeader title='Productos' />
        <ErrorState message={(error as Error).message} onRetry={() => setters.refetch()} />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title='Productos'
        description='Administra el catálogo de productos'
        actions={
          canWrite ? (
            <Link
              href='/admin/products/create'
              className='flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800'
            >
              <Plus size={16} /> Nuevo producto
            </Link>
          ) : undefined
        }
      />

      <ProductFilters
        search={filters.search}
        onSearchChange={setters.setSearch}
        categoryFilter={filters.category}
        onCategoryChange={setters.setCategoryFilter}
        statusFilter={filters.status}
        onStatusChange={setters.setStatusFilter}
        stockFilter={filters.stock}
        onStockChange={setters.setStockFilter}
        categoryOptions={categoryOptions}
      />

      <DataTable
        columns={columns}
        data={products}
        paginationMeta={paginationMeta}
        onPaginationChange={(p) => setters.setPage(p.page)}
        isLoading={isLoading}
        emptyMessage='No se encontraron productos'
        selectable
        rowKey={(p) => p.id}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      />

      {canWrite && modals.editProduct && (
        <ProductFormModal
          product={modals.editProduct}
          onClose={() => setEditProduct(null)}
          onSubmit={(data) => updateMutation.mutate({ id: modals.editProduct!.id, data })}
          isSubmitting={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!modals.deleteTarget && canDelete}
        title='Eliminar producto'
        description={`¿Eliminar "${modals.deleteTarget?.title}"? Se desactivará del catálogo.`}
        confirmLabel='Eliminar'
        loading={deleteMutation.isPending}
        onConfirm={() => modals.deleteTarget && deleteMutation.mutate(modals.deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
