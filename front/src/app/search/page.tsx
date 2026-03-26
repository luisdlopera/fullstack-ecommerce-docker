'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Spinner } from '@heroui/react';
import { Search } from 'lucide-react';
import { ProductGrid } from '@/components/shared/ProductGrid';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(currentQuery);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <main className='mx-auto mt-28 w-11/12 max-w-7xl pb-16 text-black'>
      <h1 className='mb-6 text-3xl font-bold'>Buscar productos</h1>
      <form onSubmit={onSubmit} className='mb-8 flex gap-3'>
        <Input
          value={query}
          onValueChange={setQuery}
          placeholder='Busca por nombre de producto'
          startContent={<Search size={18} />}
          className='max-w-xl'
        />
        <Button type='submit' color='primary' className='font-semibold'>
          Buscar
        </Button>
      </form>

      <ProductGrid title={currentQuery ? `Resultados para "${currentQuery}"` : 'Todos los productos'} query={currentQuery || undefined} />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className='flex min-h-screen items-center justify-center'><Spinner size='lg' /></div>}>
      <SearchContent />
    </Suspense>
  );
}
