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
			<Form
				className='flex h-96 w-1/3 flex-col items-start text-black'
				// validationBehavior="native"
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
