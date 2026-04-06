'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos
const WARNING_BEFORE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutos antes
const CHECK_INTERVAL_MS = 30 * 1000; // Revisar cada 30 segundos

interface UseSessionTimeoutOptions {
	onWarning: () => void;
	onExpired: () => void;
	isAuthenticated: boolean;
}

interface SessionTimeoutState {
	timeRemaining: number;
	isWarningShown: boolean;
	reset: () => void;
}

export function useSessionTimeout({
	onWarning,
	onExpired,
	isAuthenticated,
}: UseSessionTimeoutOptions): SessionTimeoutState {
	const [lastActivity, setLastActivity] = useState<number>(() => {
		// Lazy initialization - solo se ejecuta una vez
		if (typeof window !== 'undefined') {
			return Date.now();
		}
		return 0;
	});
	const [timeRemaining, setTimeRemaining] = useState<number>(ACCESS_TOKEN_TTL_MS);
	const [isWarningShown, setIsWarningShown] = useState(false);
	const warningShownRef = useRef(false);

	// Reset session timer on activity
	const reset = useCallback(() => {
		setLastActivity(Date.now());
		setTimeRemaining(ACCESS_TOKEN_TTL_MS);
		setIsWarningShown(false);
		warningShownRef.current = false;
	}, []);

	// Track user activity
	useEffect(() => {
		if (!isAuthenticated) return;

		const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
		const handleActivity = () => {
			setLastActivity(Date.now());
		};

		events.forEach((event) => {
			document.addEventListener(event, handleActivity, { passive: true });
		});

		return () => {
			events.forEach((event) => {
				document.removeEventListener(event, handleActivity);
			});
		};
	}, [isAuthenticated]);

	// Check session expiration
	useEffect(() => {
		if (!isAuthenticated || lastActivity === 0) return;

		const interval = setInterval(() => {
			const now = Date.now();
			const elapsed = now - lastActivity;
			const remaining = Math.max(0, ACCESS_TOKEN_TTL_MS - elapsed);
			setTimeRemaining(remaining);

			// Show warning when 2 minutes left
			if (remaining <= WARNING_BEFORE_EXPIRY_MS && remaining > 0 && !warningShownRef.current) {
				warningShownRef.current = true;
				setIsWarningShown(true);
				onWarning();
			}

			// Expired
			if (remaining === 0) {
				onExpired();
			}
		}, CHECK_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [isAuthenticated, lastActivity, onWarning, onExpired]);

	return {
		timeRemaining,
		isWarningShown,
		reset,
	};
}
