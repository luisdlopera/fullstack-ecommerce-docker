'use client';

import { Input, type InputProps } from '@heroui/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type PasswordInputProps = Omit<InputProps, 'type' | 'endContent'>;

export function PasswordInput(props: PasswordInputProps) {
	const [visible, setVisible] = useState(false);

	return (
		<Input
			{...props}
			type={visible ? 'text' : 'password'}
			endContent={
				<button
					type='button'
					onClick={() => setVisible((value) => !value)}
					className='text-gray-500 transition hover:text-gray-700'
					aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
				>
					{visible ? <EyeOff size={16} /> : <Eye size={16} />}
				</button>
			}
		/>
	);
}
