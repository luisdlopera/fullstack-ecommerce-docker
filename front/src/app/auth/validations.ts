import { z } from 'zod';

const schema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters'),
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
