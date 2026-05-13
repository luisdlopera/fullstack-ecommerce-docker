'use client';

import { useState } from 'react';
import { Checkbox, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { FormModal } from '@/features/admin';
import { GENDER_OPTIONS, SIZE_OPTIONS } from '@/config/constants';
import type { AdminProduct } from '@/features/admin';

type ProductFormModalProps = {
  product: AdminProduct;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
};

export function ProductFormModal({ product, onClose, onSubmit, isSubmitting }: ProductFormModalProps) {
  const [gender, setGender] = useState(product.gender ?? 'unisex');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(product.sizes ?? ['S', 'M', 'L']);
  const [featured, setFeatured] = useState(product.featured ?? false);
  const [isActive, setIsActive] = useState(product.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const data: Record<string, unknown> = {
      title: fd.get('title'),
      description: fd.get('description'),
      slug: fd.get('slug'),
      sku: fd.get('sku') || undefined,
      price: Number(fd.get('price')),
      comparePrice: fd.get('comparePrice') ? Number(fd.get('comparePrice')) : undefined,
      inStock: Number(fd.get('inStock')),
      gender,
      tags: (fd.get('tags') as string)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      sizes: selectedSizes,
      featured,
      isActive,
    };

    onSubmit(data);
  };

  return (
    <FormModal open title='Editar producto' onClose={onClose} onSubmit={handleSubmit} loading={isSubmitting} size='lg'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-2'>
          <Input
            label='Título *'
            name='title'
            defaultValue={product.title}
            required
            variant='flat'
            radius='lg'
            size='sm'
          />
        </div>
        <div className='sm:col-span-2'>
          <Textarea
            label='Descripción *'
            name='description'
            defaultValue={product.description}
            required
            rows={3}
            variant='flat'
            radius='lg'
            size='sm'
          />
        </div>
        <Input
          label='Slug *'
          name='slug'
          defaultValue={product.slug}
          required
          variant='flat'
          radius='lg'
          size='sm'
        />
        <Input
          label='SKU'
          name='sku'
          defaultValue={product.sku ?? ''}
          variant='flat'
          radius='lg'
          size='sm'
        />
        <Input
          label='Precio *'
          name='price'
          type='number'
          step='0.01'
          min='0'
          defaultValue={String(product.price ?? 0)}
          required
          variant='flat'
          radius='lg'
          size='sm'
        />
        <Input
          label='Precio comparativo'
          name='comparePrice'
          type='number'
          step='0.01'
          min='0'
          defaultValue={product.comparePrice != null ? String(product.comparePrice) : ''}
          variant='flat'
          radius='lg'
          size='sm'
        />
        <Input
          label='Stock *'
          name='inStock'
          type='number'
          min='0'
          defaultValue={String(product.inStock ?? 0)}
          required
          variant='flat'
          radius='lg'
          size='sm'
        />
        <div className='sm:col-span-2'>
          <Select
            label='Género'
            size='sm'
            variant='flat'
            selectedKeys={new Set([gender])}
            onSelectionChange={(keys) => {
              const k = Array.from(keys as Set<string>)[0];
              if (k) setGender(String(k));
            }}
          >
            {GENDER_OPTIONS.map((g) => (
              <SelectItem key={g.value} textValue={g.label}>
                {g.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className='sm:col-span-2'>
          <Input
            label='Tags'
            name='tags'
            defaultValue={product.tags.join(', ') ?? ''}
            placeholder='tag1, tag2'
            variant='flat'
            radius='lg'
            size='sm'
          />
        </div>
        <div className='sm:col-span-2'>
          <p className='mb-2 text-sm font-medium text-gray-700'>Tallas</p>
          <div className='flex flex-wrap gap-3'>
            {SIZE_OPTIONS.map((s) => (
              <Checkbox
                key={s}
                size='sm'
                isSelected={selectedSizes.includes(s)}
                onValueChange={(checked) => {
                  setSelectedSizes((prev) => (checked ? [...prev, s] : prev.filter((x) => x !== s)));
                }}
              >
                {s}
              </Checkbox>
            ))}
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-6 sm:col-span-2'>
          <Checkbox size='sm' isSelected={featured} onValueChange={setFeatured}>
            Destacado
          </Checkbox>
          <Checkbox size='sm' isSelected={isActive} onValueChange={setIsActive}>
            Activo
          </Checkbox>
        </div>
      </div>
    </FormModal>
  );
}
