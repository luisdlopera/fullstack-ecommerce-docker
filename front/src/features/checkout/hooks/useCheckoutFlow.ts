'use client';

import { useState, useCallback } from 'react';
import { CheckoutAddressPayload } from './useCheckoutSubmit';

export type CheckoutStep = 'review' | 'address' | 'payment';

export function useCheckoutFlow() {
	const [activeStep, setActiveStep] = useState<CheckoutStep>('review');
	const [addressData, setAddressData] = useState<CheckoutAddressPayload | null>(null);
	const [isValidating, setIsValidating] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const goNext = useCallback(() => {
		if (activeStep === 'review') {
			setActiveStep('address');
			window.scrollTo(0, 0);
		} else if (activeStep === 'address') {
			setActiveStep('payment');
			window.scrollTo(0, 0);
		}
	}, [activeStep]);

	const goBack = useCallback(() => {
		if (activeStep === 'payment') {
			setActiveStep('address');
			window.scrollTo(0, 0);
		} else if (activeStep === 'address') {
			setActiveStep('review');
			window.scrollTo(0, 0);
		}
	}, [activeStep]);

	return {
		activeStep,
		goNext,
		goBack,
		addressData,
		setAddressData,
		isValidating,
		setIsValidating,
		validationError,
		setValidationError,
		setActiveStep,
	};
}
