import { z } from 'zod';

export const createUserSchema = z.object({
	name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
	email: z.string().email('Email inválido'),
	password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
	phone: z.string().optional(),
	role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'USER']).optional(),
});

export const updateUserSchema = z.object({
	name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
	email: z.string().email('Email inválido').optional(),
	phone: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const productSchema = z.object({
	title: z.string().min(1, 'El título es obligatorio'),
	description: z.string().min(1, 'La descripción es obligatoria'),
	slug: z.string().min(1, 'El slug es obligatorio'),
	sku: z.string().optional(),
	price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
	comparePrice: z.number().min(0).optional(),
	inStock: z.number().int().min(0, 'El stock no puede ser negativo'),
	gender: z.enum(['men', 'women', 'kid', 'unisex']),
	categoryId: z.string().min(1, 'La categoría es obligatoria'),
	tags: z.array(z.string()).default([]),
	sizes: z.array(z.string()).min(1, 'Selecciona al menos una talla'),
	featured: z.boolean().optional(),
	isActive: z.boolean().optional(),
	images: z.array(z.string()).optional(),
});

export const categorySchema = z.object({
	name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
	slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
	description: z.string().optional(),
	image: z.string().optional(),
	parentId: z.string().optional(),
	sortOrder: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
});

export const countrySchema = z.object({
	id: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
	name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
	isoCode: z.string().optional(),
	currency: z.string().optional(),
	isActive: z.boolean().optional(),
	allowsShipping: z.boolean().optional(),
	allowsPurchase: z.boolean().optional(),
	shippingBaseCost: z.number().min(0).optional(),
	etaDays: z.number().int().min(0).optional(),
	priority: z.number().int().min(0).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CountryInput = z.infer<typeof countrySchema>;
