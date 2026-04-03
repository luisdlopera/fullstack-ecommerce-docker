'use client';

import { Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { getRoleBadgeClass } from '@/lib/format-role-label';

const showAuthDemoHints = process.env.NODE_ENV === 'development';
const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG_LOGS === 'true';

function authPageLog(event: string, payload: Record<string, unknown> = {}) {
	if (!AUTH_DEBUG) return;
	console.log(`[AUTH-FRONT] ${event}`, payload);
}

const DEMO_PASSWORD = 'Qwert.12345';

const SEED_TEST_USERS: { label: string; email: string; role: string }[] = [
	{ label: 'SUPER_ADMIN', email: 'superadmin@nexstore.com', role: 'SUPER_ADMIN' },
	{ label: 'ADMIN', email: 'admin@nexstore.com', role: 'ADMIN' },
	{ label: 'MANAGER', email: 'manager@nexstore.com', role: 'MANAGER' },
	{ label: 'SUPPORT', email: 'support@nexstore.com', role: 'SUPPORT' },
	{ label: 'CUSTOMER', email: 'cliente@nexstore.com', role: 'CUSTOMER' },
	{ label: 'CUSTOMER', email: 'maria@nexstore.com', role: 'CUSTOMER' },
	{ label: 'CUSTOMER', email: 'carlos@nexstore.com', role: 'CUSTOMER' },
];

import { Suspense } from 'react';

export default function AuthPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AuthPageContent />
		</Suspense>
	);
}

function AuthPageContent() {
	const { login, register, resendVerification, user } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [loginError, setLoginError] = useState('');
	const [loginLoading, setLoginLoading] = useState(false);

	const [registerError, setRegisterError] = useState('');
	const [registerMessage, setRegisterMessage] = useState('');
	const [registerLoading, setRegisterLoading] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);
	const [lastRegisteredEmail, setLastRegisteredEmail] = useState('');
	const [demoUsersOpen, setDemoUsersOpen] = useState(false);
	const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
	const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const copyEmail = async (email: string) => {
		try {
			await navigator.clipboard.writeText(email);
			setCopiedEmail(email);
			if (copyResetRef.current) clearTimeout(copyResetRef.current);
			copyResetRef.current = setTimeout(() => setCopiedEmail(null), 2000);
		} catch {
			/* ignore */
		}
	};

	useEffect(() => {
		return () => {
			if (copyResetRef.current) clearTimeout(copyResetRef.current);
		};
	}, []);

	useEffect(() => {
		if (user) {
			authPageLog('user already logged in', { redirect: '/account' });
			router.replace('/account');
		}
	}, [user, router]);

	if (user) {
		return null;
	}

	const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoginError('');
		setLoginLoading(true);
		const fd = new FormData(e.currentTarget);
		const email = fd.get('email') as string;
		const password = fd.get('password') as string;
		const redirectParam = searchParams.get('redirect') ?? searchParams.get('next');
		authPageLog('login submit', {
			email: email?.trim(),
			passwordLength: password?.length ?? 0,
			redirectParam,
			pathname: window.location.pathname,
			hostname: window.location.hostname,
		});

		try {
			await login(email, password);
			const redirectTo = redirectParam || '/';
			console.log('[AUTH-REDIRECT] landing decision', {
				redirectTo,
				redirectParam,
				hostname: window.location.hostname,
				pathname: window.location.pathname,
			});
			router.push(redirectTo);
		} catch (err) {
			setLoginError(err instanceof Error ? err.message : 'Error al iniciar sesión');
			console.log('[AUTH-FRONT] login error', {
				message: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setLoginLoading(false);
		}
	};

	const onRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setRegisterError('');
		setRegisterMessage('');
		setRegisterLoading(true);
		const fd = new FormData(e.currentTarget);
		const name = fd.get('name') as string;
		const email = fd.get('email') as string;
		const password = fd.get('password') as string;

		try {
			const message = await register(name, email, password);
			setLastRegisteredEmail(email.trim());
			setRegisterMessage(message);
			e.currentTarget.reset();
		} catch (err) {
			setRegisterError(err instanceof Error ? err.message : 'Error al registrarse');
		} finally {
			setRegisterLoading(false);
		}
	};

	const onResendVerification = async () => {
		if (!lastRegisteredEmail) return;
		setRegisterError('');
		setResendLoading(true);
		try {
			const message = await resendVerification(lastRegisteredEmail);
			setRegisterMessage(message);
		} catch (err) {
			setRegisterError(err instanceof Error ? err.message : 'No fue posible reenviar la verificación');
		} finally {
			setResendLoading(false);
		}
	};

	return (
		<>
			<div className='mx-auto flex min-h-screen w-[90%] max-w-480 items-center justify-around gap-10 pt-20'>
				<div className='flex w-1/3 flex-col gap-6'>
					<Form className='flex flex-col items-start gap-2 text-black' onSubmit={onLogin}>
						<h2 className='mb-6 text-3xl font-bold'>Iniciar sesión</h2>
						<Input isRequired name='email' type='email' label='Correo' placeholder='Ingresa tu correo' />
						<PasswordInput
							isRequired
							name='password'
							label='Contraseña'
							placeholder='Ingresa tu contraseña'
							minLength={10}
						/>
						<Link href='/auth/forgot-password' className='mt-1 text-sm text-gray-600 hover:underline'>
							¿Olvidaste tu contraseña?
						</Link>
						<Link href='/auth/resend-verification' className='text-sm text-gray-600 hover:underline'>
							¿No te llegó el correo de verificación?
						</Link>
						{loginError && <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{loginError}</p>}
						<Button className='bg-primary w-full text-white' type='submit' isLoading={loginLoading}>
							Ingresar
						</Button>
					</Form>

					{showAuthDemoHints && (
						<Button
							type='button'
							variant='bordered'
							className='w-full border-gray-300 text-gray-700'
							onPress={() => setDemoUsersOpen(true)}
						>
							Mostrar usuarios de prueba
						</Button>
					)}
				</div>

				<Form className='flex w-1/3 flex-col items-start gap-2 text-black' onSubmit={onRegister}>
					<h2 className='mb-6 text-3xl font-bold'>Crear una cuenta</h2>
					<Input isRequired name='name' label='Nombre' placeholder='Tu nombre' minLength={2} />
					<Input isRequired name='email' type='email' label='Correo' placeholder='Ingresa tu correo' />
					<PasswordInput
						isRequired
						name='password'
						label='Contraseña'
						placeholder='Mínimo 10 caracteres'
						minLength={10}
					/>
					{registerMessage && <p className='rounded-lg bg-green-50 p-3 text-sm text-green-700'>{registerMessage}</p>}
					{registerError && <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{registerError}</p>}
					{lastRegisteredEmail ? (
						<Button
							type='button'
							variant='flat'
							className='w-full'
							onPress={() => void onResendVerification()}
							isLoading={resendLoading}
						>
							Reenviar correo de verificación
						</Button>
					) : null}
					<p className='mb-2 text-sm text-gray-600'>
						Tu información se empleará para brindarte una experiencia personalizada, administrar tu cuenta y
						cumplir con lo establecido en nuestra <span className='font-bold'>Política de Privacidad.</span>
					</p>
					<Button className='bg-primary w-full text-white' type='submit' isLoading={registerLoading}>
						Crear cuenta
					</Button>
				</Form>
			</div>

			{showAuthDemoHints && (
				<Modal isOpen={demoUsersOpen} onOpenChange={setDemoUsersOpen} size='lg' scrollBehavior='inside'>
					<ModalContent>
						{(onClose) => (
							<>
								<ModalHeader className='flex flex-col gap-1'>
									<span>Usuarios de prueba (solo desarrollo)</span>
									<span className='text-sm font-normal text-gray-500'>
										Contraseña para todos:{' '}
										<span className='font-mono font-medium text-gray-800'>{DEMO_PASSWORD}</span>
									</span>
								</ModalHeader>
								<ModalBody className='text-sm text-gray-700'>
									<div className='space-y-2'>
										{SEED_TEST_USERS.map((u) => (
											<div
												key={u.email}
												className='flex items-center justify-between gap-2 border-b border-gray-100 py-2 last:border-0'
											>
												<div className='min-w-0 flex-1'>
													<span
														className={`rounded px-1.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass(u.role)}`}
													>
														{u.label}
													</span>
													<span className='ml-2 break-all'>{u.email}</span>
												</div>
												<Button
													type='button'
													size='sm'
													variant='flat'
													className='inline-flex min-w-0 shrink-0 items-center gap-1 px-2'
													aria-label={`Copiar ${u.email}`}
													onPress={() => void copyEmail(u.email)}
												>
													{copiedEmail === u.email ? (
														<>
															<Check className='h-4 w-4 text-green-600' aria-hidden />
															<span className='ml-1 hidden sm:inline'>Copiado</span>
														</>
													) : (
														<>
															<Copy className='h-4 w-4' aria-hidden />
															<span className='ml-1 hidden sm:inline'>Copiar</span>
														</>
													)}
												</Button>
											</div>
										))}
									</div>
								</ModalBody>
								<ModalFooter>
									<Button color='primary' className='bg-primary text-white' onPress={onClose}>
										Cerrar
									</Button>
								</ModalFooter>
							</>
						)}
					</ModalContent>
				</Modal>
			)}
		</>
	);
}
