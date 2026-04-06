'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	CheckoutOrderSummary,
	CheckoutStepper,
	StepAddress,
	StepCartReview,
	StepPayment,
	useCheckoutFlow,
	useCheckoutSubmit,
} from '@/features/checkout';
import { type Country } from '@/lib/api';
import { fetchCountriesClient } from '@/lib/shop-api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/features/cart';

function CheckoutFlowContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isGuest = searchParams.get('guest') === 'true';
	const { items } = useCart();
	const { user } = useAuth();

	const { activeStep, goNext, goBack, addressData, setAddressData } = useCheckoutFlow();

	const { submitAddress, validateCartStock, submitting, error, tax, total } = useCheckoutSubmit();

	const [countries, setCountries] = useState<Country[]>([]);
	const [countryId, setCountryId] = useState('');

	useEffect(() => {
		if (items.length === 0) {
			router.replace('/cart');
		}
	}, [items.length, router]);

	useEffect(() => {
		const run = async () => {
			try {
				setCountries(await fetchCountriesClient());
			} catch {
				/* ignore */
			}
		};
		void run();
	}, []);

	useEffect(() => {
		if (!user && !isGuest) {
			router.replace('/auth?redirect=/checkout');
		}
	}, [user, isGuest, router]);

	if (!user && !isGuest) return null;

	if (items.length === 0) return null;

	const handleAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!countryId) return;
		const form = new FormData(e.currentTarget);
		setAddressData({
			firstName: form.get('firstName') as string,
			lastName: form.get('lastName') as string,
			address: form.get('address') as string,
			address2: (form.get('address2') as string) || undefined,
			postalCode: form.get('postalCode') as string,
			city: form.get('city') as string,
			phone: form.get('phone') as string,
			countryId,
			guestEmail: (form.get('guestEmail') as string) || undefined,
		});
		goNext();
	};

	const handlePlaceOrder = () => {
		if (addressData) {
			submitAddress(addressData);
		}
	};

	return (
		<main className='mx-auto mt-28 w-11/12 max-w-6xl pb-16 text-black'>
			<h1 className='mb-4 text-4xl font-black'>Checkout</h1>

			<CheckoutStepper currentStep={activeStep} />

			<div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
				<div className='lg:col-span-2'>
					{activeStep === 'review' && (
						<StepCartReview
							onNext={goNext}
							onValidate={validateCartStock}
							submitting={submitting}
							error={error}
						/>
					)}

					{activeStep === 'address' && (
						<StepAddress
							countries={countries}
							countryId={countryId}
							setCountryId={setCountryId}
							onSubmit={handleAddressSubmit}
							onBack={goBack}
							submitting={false}
							error={''}
							isGuest={!user}
						/>
					)}

					{activeStep === 'payment' && (
						<StepPayment
							address={addressData}
							onBack={goBack}
							onSubmitOrder={handlePlaceOrder}
							submitting={submitting}
							error={error}
						/>
					)}
				</div>

				<div>
					<CheckoutOrderSummary tax={tax} total={total} />
				</div>
			</div>
		</main>
	);
}

export default function CheckoutPage() {
	return (
		<Suspense fallback={<div className='min-h-screen pt-28 text-center'>Cargando...</div>}>
			<CheckoutFlowContent />
		</Suspense>
	);
}
