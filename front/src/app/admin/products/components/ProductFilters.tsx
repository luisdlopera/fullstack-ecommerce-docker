'use client';

import { FilterSelect, SearchInput } from '@/features/admin';

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

const STOCK_OPTIONS = [
  { value: 'true', label: 'Con stock' },
  { value: 'false', label: 'Sin stock' },
];

type ProductFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  stockFilter: string;
  onStockChange: (value: string) => void;
  categoryOptions: { value: string; label: string }[];
};

export function ProductFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  stockFilter,
  onStockChange,
  categoryOptions,
}: ProductFiltersProps) {
  return (
    <div className='mb-4 flex flex-wrap items-center gap-3'>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder='Buscar por nombre, SKU o ID...'
      />
      <FilterSelect
        value={categoryFilter}
        onChange={onCategoryChange}
        options={categoryOptions}
        placeholder='Todas las categorías'
      />
      <FilterSelect
        value={statusFilter}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        placeholder='Estado'
      />
      <FilterSelect
        value={stockFilter}
        onChange={onStockChange}
        options={STOCK_OPTIONS}
        placeholder='Stock'
      />
    </div>
  );
}
