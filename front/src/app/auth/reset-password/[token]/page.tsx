'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, use } from 'react';
import { Button, Form } from '@heroui/react';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Check, X } from 'lucide-react';

interface PasswordValidation {
	minLength: boolean;
	hasUppercase: boolean;
	hasLowercase: boolean;
	hasNumber: boolean;
	hasSymbol: boolean;
}

function validatePassword(password: string): PasswordValidation {
	return {
		minLength: password.length >= 10,
		hasUppercase: /[A-Z]/.test(password),
		hasLowercase: /[a-z]/.test(password),
		hasNumber: /\d/.test(password),
		hasSymbol: /[^A-Za-z\d]/.test(password),
	};
}

function getValidationErrors(validation: PasswordValidation): string[] {
	const errors: string[] = [];
	if (!validation.minLength) errors.push('Mínimo 10 caracteres');
	if (!validation.hasLowercase) errors.push('Una minúscula (a-z)');
	if (!validation.hasUppercase) errors.push('Una mayúscula (A-Z)');
	if (!validation.hasNumber) errors.push('Un número (0-9)');
	if (!validation.hasSymbol) errors.push('Un símbolo especial (!@#$%^&*)');
	return errors;
}

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);
	const router = useRouter();
	const { resetPassword } = useAuth();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });

	const validation = useMemo(() => validatePassword(newPassword), [newPassword]);
	const validationErrors = useMemo(() => getValidationErrors(validation), [validation]);
	const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
	const isFormValid = validationErrors.length === 0 && passwordsMatch && newPassword.length > 0;

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setMessage('');
		setError('');

		if (validationErrors.length > 0) {
			setLoading(false);
			setError(`La contraseña no cumple los requisitos: ${validationErrors.join(', ')}`);
			return;
		}

		if (newPassword !== confirmPassword) {
			setLoading(false);
			setError('Las contraseñas no coinciden.');
			return;
		}

		try {
			await resetPassword(token, newPassword);
			setMessage('Contraseña restablecida. Ahora puedes iniciar sesión.');
			setTimeout(() => router.push('/auth'), 1200);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'No fue posible restablecer la contraseña.';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
		<div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
			{met ? <Check className='h-4 w-4' /> : <X className='h-4 w-4' />}
			<span>{label}</span>
		</div>
	);

	return (
		<main className='mx-auto mt-28 flex min-h-[calc(100vh-200px)] w-full max-w-md flex-col px-4 text-black'>
			<Form className='flex flex-col gap-3' onSubmit={handleSubmit}>
				<h1 className='text-3xl font-bold'>Restablecer contraseña</h1>
				<p className='text-sm text-gray-600'>Crea una nueva contraseña segura para tu cuenta.</p>

				<PasswordInput
					isRequired
					name='newPassword'
					label='Nueva contraseña'
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
				/>

				{(touched.newPassword || newPassword.length > 0) && (
					<div className='space-y-1 rounded-lg bg-gray-50 p-3'>
						<p className='text-xs font-semibold text-gray-600 uppercase'>Requisitos de contraseña:</p>
						<RequirementItem met={validation.minLength} label='Mínimo 10 caracteres' />
						<RequirementItem met={validation.hasLowercase} label='Una minúscula (a-z)' />
						<RequirementItem met={validation.hasUppercase} label='Una mayúscula (A-Z)' />
						<RequirementItem met={validation.hasNumber} label='Un número (0-9)' />
						<RequirementItem met={validation.hasSymbol} label='Un símbolo especial (!@#$%^&*)' />
					</div>
				)}

				<PasswordInput
					isRequired
					name='confirmPassword'
					label='Confirmar contraseña'
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
				/>

				{touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch && (
					<p className='text-sm text-red-600'>Las contraseñas no coinciden</p>
				)}
				{passwordsMatch && confirmPassword.length > 0 && (
					<div className='flex items-center gap-2 text-sm text-green-600'>
						<Check className='h-4 w-4' />
						<span>Las contraseñas coinciden</span>
					</div>
				)}

				{message ? <p className='rounded-lg bg-green-50 p-3 text-sm text-green-700'>{message}</p> : null}
				{error ? <p className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>{error}</p> : null}

				<Button
					type='submit'
					color='primary'
					isLoading={loading}
					isDisabled={!isFormValid && (newPassword.length > 0 || confirmPassword.length > 0)}
				>
					Guardar nueva contraseña
				</Button>

				<Link href='/auth' className='text-sm text-gray-600 hover:underline'>
					Volver al login
				</Link>
			</Form>
		</main>
	);
}
