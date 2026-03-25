import { z } from 'zod';

const schema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(8)
		.regex(/[A-Z]/, 'Must contain one uppercase letter')
		.regex(/[a-z]/, 'Must contain one lowercase letter')
		.regex(/[0-9]/, 'Must contain one number')
		.regex(/[!@#$%^&*]/, 'Must contain one special character (!@#$%^&*)'),
});

export function validationErrors(formData: FormData) {
	const result = schema.safeParse(Object.fromEntries(formData));

	if (!result.success) {
		return {
			errors: result.error.flatten().fieldErrors,
		};
	}
	return {
		errors: {},
	};
}
