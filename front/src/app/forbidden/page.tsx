import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-6 text-center'>
      <p className='mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500'>403</p>
      <h1 className='text-3xl font-bold text-gray-900'>No tienes acceso a este recurso</h1>
      <p className='mt-3 text-sm text-gray-600'>Tu usuario no cuenta con permisos suficientes para ver esta pantalla.</p>
      <Link href='/' className='mt-8 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800'>
        Volver al inicio
      </Link>
    </main>
  );
}
