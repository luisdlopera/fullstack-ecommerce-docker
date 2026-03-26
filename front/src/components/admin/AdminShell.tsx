'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/types/admin';

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdminRole(user.role))) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user || !isAdminRole(user.role)) {
    return (
      <main className='flex min-h-screen items-center justify-center'>
        <Spinner size='lg' />
      </main>
    );
  }

  return (
    <main className='mx-auto mt-28 w-11/12 max-w-7xl pb-16 text-black'>
      <h1 className='mb-6 text-3xl font-bold'>{title}</h1>
      <nav className='mb-8 flex flex-wrap gap-3 text-sm'>
        <Link href='/admin' className='rounded-lg border px-3 py-2 hover:bg-gray-100'>
          Dashboard
        </Link>
        <Link href='/admin/users' className='rounded-lg border px-3 py-2 hover:bg-gray-100'>
          Usuarios
        </Link>
        <Link href='/admin/orders' className='rounded-lg border px-3 py-2 hover:bg-gray-100'>
          Órdenes
        </Link>
        <Link href='/admin/products' className='rounded-lg border px-3 py-2 hover:bg-gray-100'>
          Productos
        </Link>
        <Link href='/admin/categories' className='rounded-lg border px-3 py-2 hover:bg-gray-100'>
          Categorías
        </Link>
        <Link href='/admin/countries' className='rounded-lg border px-3 py-2 hover:bg-gray-100'>
          Países
        </Link>
      </nav>
      {children}
    </main>
  );
}
