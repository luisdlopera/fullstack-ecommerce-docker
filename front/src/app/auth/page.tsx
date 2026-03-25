'use client';

import { Button, Form, Input } from '@heroui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
	const { login, register, user } = useAuth();
	const router = useRouter();

	const [loginError, setLoginError] = useState('');
	const [loginLoading, setLoginLoading] = useState(false);

	const [registerError, setRegisterError] = useState('');
	const [registerLoading, setRegisterLoading] = useState(false);

	if (user) {
		router.replace('/account');
		return null;
	}

	const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoginError('');
		setLoginLoading(true);
		const fd = new FormData(e.currentTarget);
		const email = fd.get('email') as string;
		const password = fd.get('password') as string;

		try {
			await login(email, password);
			router.push('/');
		} catch (err) {
			setLoginError(err instanceof Error ? err.message : 'Error al iniciar sesión');
		} finally {
			setLoginLoading(false);
		}
	};

	const onRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setRegisterError('');
		setRegisterLoading(true);
		const fd = new FormData(e.currentTarget);
		const name = fd.get('name') as string;
		const email = fd.get('email') as string;
		const password = fd.get('password') as string;

		try {
			await register(name, email, password);
			router.push('/');
		} catch (err) {
			setRegisterError(err instanceof Error ? err.message : 'Error al registrarse');
		} finally {
			setRegisterLoading(false);
		}
	};

	return (
		<div className='mx-auto flex min-h-screen w-11/12 items-center justify-around gap-10 pt-20'>
			<div className='flex w-1/3 flex-col gap-6'>
				<Form className='flex flex-col items-start gap-2 text-black' onSubmit={onLogin}>
					<h2 className='mb-6 text-3xl font-bold'>Iniciar sesión</h2>
					<Input isRequired name='email' type='email' label='Correo' placeholder='Ingresa tu correo' />
					<Input
						isRequired
						name='password'
						type='password'
						label='Contraseña'
						placeholder='Ingresa tu contraseña'
						minLength={6}
					/>
					{loginError && <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{loginError}</p>}
					<Button className='w-full bg-primary text-white' type='submit' isLoading={loginLoading}>
						Ingresar
					</Button>
				</Form>

				<div className='rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700'>
					<p className='mb-3 font-bold text-gray-900'>Usuarios de prueba</p>
					<div className='mb-2 flex items-center justify-between'>
						<div>
							<span className='rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700'>
								Admin
							</span>
							<span className='ml-2'>admin@nexstore.com</span>
						</div>
						<span className='font-mono text-xs text-gray-500'>Qwert.12345</span>
					</div>
					<div className='flex items-center justify-between'>
						<div>
							<span className='rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700'>
								Cliente
							</span>
							<span className='ml-2'>cliente@nexstore.com</span>
						</div>
						<span className='font-mono text-xs text-gray-500'>Qwert.12345</span>
					</div>
				</div>
			</div>

			<Form className='flex w-1/3 flex-col items-start gap-2 text-black' onSubmit={onRegister}>
				<h2 className='mb-6 text-3xl font-bold'>Crear una cuenta</h2>
				<Input isRequired name='name' label='Nombre' placeholder='Tu nombre' minLength={2} />
				<Input isRequired name='email' type='email' label='Correo' placeholder='Ingresa tu correo' />
				<Input
					isRequired
					name='password'
					type='password'
					label='Contraseña'
					placeholder='Mínimo 6 caracteres'
					minLength={6}
				/>
				{registerError && <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{registerError}</p>}
				<p className='mb-2 text-sm text-gray-600'>
					Tu información se empleará para brindarte una experiencia personalizada, administrar tu cuenta y
					cumplir con lo establecido en nuestra <span className='font-bold'>Política de Privacidad.</span>
				</p>
				<Button className='w-full bg-primary text-white' type='submit' isLoading={registerLoading}>
					Crear cuenta
				</Button>
			</Form>
		</div>
	);
}
