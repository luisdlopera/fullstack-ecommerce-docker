'use client'

import { Button } from '@heroui/react'
import { AlertCircle } from 'lucide-react'

export default function GlobalErrorPage({
    error,
    reset
}: {
    error: Error & { digest?: string },
    reset: () => void
}) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="mx-auto mb-4 text-destructive" size={64} />
                <h1 className="text-4xl font-bold mb-2">Algo salió mal</h1>
                <p className="mb-4 text-muted-foreground">
                    Ocurrió un error inesperado en la aplicación.
                </p>
                <div className="flex justify-center gap-4">
                    <Button onPress={() => reset()}>
                        Intentar de Nuevo
                    </Button>
                    <Button onPress={() => window.location.href = '/'}>
                        Ir al Inicio
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 text-sm text-destructive">
                        Error Details: {error.message}
                    </div>
                )}
            </div>
        </div>
    )
}