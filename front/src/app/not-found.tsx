'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@heroui/react';

export default function NotFoundPage() {
	return (
		<div className='bg-background flex min-h-screen flex-col items-center justify-center p-4'>
			<div className='max-w-md text-center'>
				<div className='mb-6 flex justify-center'>
					<AlertTriangle className='text-destructive h-24 w-24' />
				</div>
				<h1 className='text-foreground mb-4 text-4xl font-bold'>404 - Página No Encontrada</h1>
				<p className='text-muted-foreground mb-6'>
					Lo sentimos, la página que estás buscando no existe o ha sido movida.
				</p>
				<div className='flex justify-center gap-4'>
					<Button>
						<Link href='/'>Volver al Inicio</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
