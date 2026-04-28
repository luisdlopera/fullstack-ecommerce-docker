'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { categoriesApi, productsApi } from '@/features/admin';
import type { AdminCategory, AdminProduct } from '@/features/admin';

export function useAdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'products', page, search, categoryFilter, statusFilter, stockFilter],
    queryFn: () =>
      productsApi.list({
        page,
        limit: 20,
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        isActive: statusFilter ? statusFilter === 'true' : undefined,
        inStock: stockFilter ? stockFilter === 'true' : undefined,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin', 'categories-list'],
    queryFn: () => categoriesApi.list(),
  });

  const categoryOptions = (() => {
    const seen = new Set<string>();
    return (categories ?? [])
      .filter((c: AdminCategory) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      })
      .map((c: AdminCategory) => ({ value: c.id, label: c.name }));
  })();

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setStockFilter('');
    setPage(1);
  };

  return {
    // Data
    products: data?.data ?? [],
    paginationMeta: data?.meta,
    categories,
    categoryOptions,

    // Loading states
    isLoading,
    error,

    // Filters
    filters: {
      search,
      category: categoryFilter,
      status: statusFilter,
      stock: stockFilter,
    },
    setters: {
      setSearch: (v: string) => {
        setSearch(v);
        setPage(1);
      },
      setCategoryFilter: (v: string) => {
        setCategoryFilter(v);
        setPage(1);
      },
      setStatusFilter: (v: string) => {
        setStatusFilter(v);
        setPage(1);
      },
      setStockFilter: (v: string) => {
        setStockFilter(v);
        setPage(1);
      },
      setPage,
      resetFilters,
      refetch,
    },

    // Selection
    selectedKeys,
    setSelectedKeys,

    // Modals
    modals: {
      editProduct,
      setEditProduct,
      deleteTarget,
      setDeleteTarget,
    },
  };
}
