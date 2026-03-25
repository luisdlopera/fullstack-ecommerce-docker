'use client';

import { Button } from '@heroui/react';
import { AlertCircle } from 'lucide-react';

export default function GlobalErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<div className='text-center'>
				<AlertCircle className='text-destructive mx-auto mb-4' size={64} />
				<h1 className='mb-2 text-4xl font-bold'>Algo salió mal</h1>
				<p className='text-muted-foreground mb-4'>Ocurrió un error inesperado en la aplicación.</p>
				<div className='flex justify-center gap-4'>
					<Button onPress={() => reset()}>Intentar de Nuevo</Button>
					<Button onPress={() => (window.location.href = '/')}>Ir al Inicio</Button>
				</div>
				{process.env.NODE_ENV === 'development' && (
					<div className='text-destructive mt-4 text-sm'>Error Details: {error.message}</div>
				)}
			</div>
		</div>
	);
}
