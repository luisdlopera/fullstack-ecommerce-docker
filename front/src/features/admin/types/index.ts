export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'USER';

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT'];

export function isAdminRole(role: string): boolean {
	return ADMIN_ROLES.includes(role as Role);
}

export type PaginatedResponse<T> = {
	data: T[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: Role;
	isActive: boolean;
	phone: string | null;
	image: string | null;
	emailVerified: string | null;
	lastLoginAt: string | null;
	createdAt: string;
	updatedAt?: string;
	address?: {
		id: string;
		firstName: string;
		lastName: string;
		address: string;
		city: string;
		country: { id: string; name: string };
	} | null;
	_count?: { Order: number };
};

export type AdminProduct = {
	id: string;
	title: string;
	description: string;
	sku: string | null;
	inStock: number;
	price: number;
	comparePrice: number | null;
	sizes: string[];
	slug: string;
	tags: string[];
	gender: string;
	featured: boolean;
	isActive: boolean;
	categoryId: string;
	category: { id: string; name: string };
	ProductImage: { id: number; url: string; sortOrder: number }[];
	createdAt: string;
	updatedAt: string;
};

export type AdminOrder = {
	id: string;
	subTotal: number;
	tax: number;
	total: number;
	itemsInOrder: number;
	isPaid: boolean;
	paidAt: string | null;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
	internalNotes: string | null;
	createdAt: string;
	updatedAt: string;
	transactionId: string | null;
	user: { id: string; name: string; email: string; phone?: string | null };
	OrderItem: {
		id: string;
		quantity: number;
		price: number;
		size: string;
		product?: AdminProduct;
	}[];
	OrderAddress: {
		id: string;
		firstName: string;
		lastName: string;
		address: string;
		address2: string | null;
		postalCode: string;
		city: string;
		phone: string;
		country: { id: string; name: string };
	} | null;
};

export type AdminCategory = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	image: string | null;
	isActive: boolean;
	sortOrder: number;
	parentId: string | null;
	parent: { id: string; name: string } | null;
	children?: { id: string; name: string; slug: string }[];
	_count?: { Product: number; children?: number };
	createdAt: string;
};

export type AdminCountry = {
	id: string;
	name: string;
	isoCode: string | null;
	currency: string;
	isActive: boolean;
	allowsShipping: boolean;
	allowsPurchase: boolean;
	shippingBaseCost: number;
	etaDays: number;
	priority: number;
	createdAt: string;
};

export type DashboardSummary = {
	totalSales: number;
	totalOrders: number;
	totalUsers: number;
	activeProducts: number;
	avgTicket: number;
	pendingOrders: number;
	periodRevenue: number;
	periodOrders: number;
	outOfStock: number;
};

export type SalesChartPoint = {
	date: string;
	revenue: number;
	orders: number;
};

export type TopProduct = {
	product: AdminProduct;
	totalSold: number;
};
