'use client';

import { Button, Form, Input, Link } from '@heroui/react';
// import { z } from "zod";
import { useState } from 'react';
import { validationErrors } from './validations';

export default function AuthPage() {
	const [errors, setErrors] = useState({});

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);

		console.log('Submitted data:', formData);

		const result = await validationErrors(formData);

		console.log('result data:', result);

		setErrors(result.errors);
	};

	return (
		<div className='mx-auto flex h-screen w-11/12 items-center justify-around gap-10'>
			<div className='flex w-1/3 flex-col gap-6'>
				<Form
					className='flex flex-col items-start gap-2 text-black'
					validationErrors={errors}
					onSubmit={onSubmit}
				>
					<h2 className='mb-6 text-3xl font-bold'>Iniciar sesión</h2>
					<Input isRequired name='email' type='email' label='Correo' placeholder='Ingresa tu correo' />
					<Input
						isRequired
						name='password'
						type='password'
						label='Contraseña'
						placeholder='Ingresa tu contraseña'
					/>
					<div className='flex w-full items-start gap-4'>
						<Button className='w-1/2 bg-primary text-white' type='submit'>
							Ingresar
						</Button>
						<Link href='#' className='mt-3 text-sm text-black'>
							¿Olvidaste tu contraseña?
						</Link>
					</div>
				</Form>

				<div className='rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700'>
					<p className='mb-3 font-bold text-gray-900'>Usuarios de prueba</p>
					<div className='mb-2 flex items-center justify-between'>
						<div>
							<span className='rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700'>Admin</span>
							<span className='ml-2'>admin@nexstore.com</span>
						</div>
						<span className='font-mono text-xs text-gray-500'>Qwert.12345</span>
					</div>
					<div className='flex items-center justify-between'>
						<div>
							<span className='rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700'>Cliente</span>
							<span className='ml-2'>cliente@nexstore.com</span>
						</div>
						<span className='font-mono text-xs text-gray-500'>Qwert.12345</span>
					</div>
				</div>
			</div>

			<Form className='flex h-96 w-1/3 flex-col items-start text-black'>
				<h2 className='mb-6 text-3xl font-bold'>Crear una cuenta</h2>
				<Input type='email' label='Correo' placeholder='Ingresa tu correo' />
				<p className='mb-4 text-sm'>
					Se enviará un enlace para establecer una nueva contraseña a su dirección de correo electrónico.
				</p>
				<p className='mb-6 text-sm'>
					Tu información se empleará para brindarte una experiencia personalizada, administrar tu cuenta y
					cumplir con lo establecido en nuestra <span className='font-bold'>Política de Privacidad.</span>
				</p>
				<Button>Crear cuenta</Button>
			</Form>
		</div>
	);
}

// const schema = z.object({
//     email: z.string().email(),
//     password: z.string().min(8).regex(/[A-Z]/, "Must contain one uppercase letter")
//         .regex(/[a-z]/, "Must contain one lowercase letter")
//         .regex(/[0-9]/, "Must contain one number")
//         .regex(/[!@#$%^&*]/, "Must contain one special character (!@#$%^&*)"),
// });

// function validationErrors(formData: FormData) {

//     const result = schema.safeParse(Object.fromEntries(formData));

//     if (!result.success) {
//         return {
//             errors: result.error.flatten().fieldErrors,
//         };
//     }
//     return {
//         errors: {},
//     };
// }
