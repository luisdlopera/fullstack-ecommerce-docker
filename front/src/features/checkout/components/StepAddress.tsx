'use client';

import { Autocomplete, AutocompleteItem, Button, Input } from '@heroui/react';
import { type Country } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export function StepAddress({
	countries,
	countryId,
	setCountryId,
	onSubmit,
	onBack,
	submitting,
	error,
	isGuest,
}: {
	countries: Country[];
	countryId: string;
	setCountryId: (id: string) => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onBack: () => void;
	submitting: boolean;
	error: string;
	isGuest?: boolean;
}) {
	return (
		<div className='flex flex-col gap-6 animate-appearance-in'>
			<div className='mb-2 flex items-center justify-between'>
				<Button variant='light' onPress={onBack} startContent={<ArrowLeft size={16} />} className='font-bold -ml-2 text-gray-500'>
					Volver
				</Button>
			</div>

			<div className='mb-2'>
				<h2 className='text-2xl font-black text-gray-900'>Información de Envío</h2>
				<p className='text-gray-500 mt-1'>¿A dónde enviaremos tu pedido? Llena todos los campos con cuidado.</p>
			</div>

			<form onSubmit={onSubmit} className='flex flex-col gap-6 w-full max-w-2xl'>
				<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
					<Input isRequired name='firstName' label='Nombre' placeholder='Tu nombre' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />
					<Input isRequired name='lastName' label='Apellido' placeholder='Tu apellido' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />
				</div>
				{isGuest && (
					<Input type='email' isRequired name='guestEmail' label='Correo Electrónico' placeholder='tu@email.com' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />
				)}
				<Input isRequired name='address' label='Dirección de entrega' placeholder='Calle y número' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />
				<Input name='address2' label='Apto, local, etc (opcional)' placeholder='Apartamento, suite...' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />
				<div className='grid grid-cols-1 gap-5 sm:grid-cols-3'>
					<Input isRequired name='city' label='Ciudad' placeholder='Ciudad' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />
					<Input isRequired name='postalCode' label='Código postal' placeholder='000000' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />
					<Autocomplete
						isRequired
						label='País'
						placeholder='Elegir país'
						size='lg'
						selectedKey={countryId || null}
						onSelectionChange={(key) => setCountryId(key ? String(key) : '')}
						inputProps={{ classNames: { inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' } }}
					>
						{countries.map((country) => (
							<AutocompleteItem key={country.id}>{country.name}</AutocompleteItem>
						))}
					</Autocomplete>
				</div>
				<Input isRequired name='phone' label='Teléfono de contacto' placeholder='+57 300 000 0000' size='lg' classNames={{ inputWrapper: 'bg-white shadow-sm ring-1 ring-gray-200' }} />

				{error && (
					<div className='rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm'>
						<div className='flex text-red-600 font-medium text-sm'>
							🧨 {error}
						</div>
					</div>
				)}

				<div className='mt-8 border-t pt-8 pb-4 border-gray-100'>
					<Button
						type='submit'
						color='primary'
						size='lg'
						className='w-full font-black tracking-wide h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg'
						isLoading={submitting}
					>
						Guardar y Continuar al pago
					</Button>
				</div>
			</form>
		</div>
	);
}
