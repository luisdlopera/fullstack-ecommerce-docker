import { Button, Form, Input, Link } from "@heroui/react";

export default function AuthPage() {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="grid grid-cols-2 gap-10 w-3/4">
                {/* Iniciar sesión */}
                <Form className="flex flex-col items-start text-black">
                    <h2 className="text-3xl font-bold mb-6">Iniciar sesión</h2>
                    <Input
                        type="email"
                        label="Correo"
                        placeholder="Ingresa tu correo"
                    />
                    <Input
                        type="password"
                        label="Contraseña"
                        placeholder="Ingresa tu contraseña"
                    />
                    <div className="flex items-start w-full gap-4">
                        <Button className="w-1/2 bg-blue-600 text-white p-3 rounded-lg font-semibold">Ingresar</Button>
                        <Link href="#" className="mt-3 text-sm text-black">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </Form>

                {/* Crear cuenta */}
                <Form className="flex flex-col items-start text-black">
                    <h2 className="text-3xl font-bold mb-6">Crear una cuenta</h2>
                    <Input
                        type="email"
                        label="Correo"
                        placeholder="Ingresa tu correo"
                    />
                    <p className="text-sm mb-4">
                        Se enviará un enlace para establecer una nueva contraseña a su dirección de correo electrónico.
                    </p>
                    <p className="text-sm mb-6">
                        Tu información se empleará para brindarte una experiencia personalizada, administrar tu cuenta y
                        cumplir con lo establecido en nuestra <span className="font-bold">Política de Privacidad.</span>
                    </p>
                    <Button>
                        Crear cuenta
                    </Button>
                </Form>
            </div>
        </div>
    );
}