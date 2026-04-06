export type Collection = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	gender: 'men' | 'women' | 'kid' | 'unisex';
	image: string | null;
	isActive: boolean;
	sortOrder: number;
	_count?: {
		products: number;
	};
	createdAt: string;
	updatedAt: string;
};
