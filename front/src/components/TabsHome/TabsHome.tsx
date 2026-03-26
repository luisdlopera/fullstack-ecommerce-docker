'use client';

import { Tab, Tabs } from '@heroui/react';
import { ShopProductCard } from '../shared/ProductCard';
import { FeaturedProduct } from '@/lib/api';
import { isNewFromTags } from '@/lib/product-flags';

type TabsHomeProps = {
	products: FeaturedProduct[];
};

export function TabsHome({ products }: TabsHomeProps) {
	const getGenderProducts = (gender: string) =>
		products.filter((p) => {
			const tags = (p as unknown as { gender?: string }).gender;
			return tags === gender;
		});

	const menProducts = getGenderProducts('men');
	const womenProducts = getGenderProducts('women');
	const kidProducts = getGenderProducts('kid');

	const renderGrid = (list: FeaturedProduct[]) => {
		if (list.length === 0) {
			return <p className='py-10 text-center text-gray-500'>No hay productos en esta categoría.</p>;
		}
		return (
			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
				{list.map((product) => {
					const imgs = product.images ?? [];
					return (
					<ShopProductCard
						key={product.id}
						id={product.id}
						name={product.title}
						price={product.price}
						image={imgs[0] || '/img/shirt/shirt-black-1.png'}
						image2={imgs[1] || imgs[0] || '/img/shirt/shirt-black-2.png'}
						slug={product.slug}
						isNew={isNewFromTags(product.tags)}
					/>
					);
				})}
			</div>
		);
	};

	return (
		<section className='mx-auto flex w-11/12 flex-col'>
			<Tabs aria-label='Options' className='flex w-full justify-center'>
				<Tab key='new' title='Nuevas colecciones' className='p-7 text-xl'>
					{renderGrid(products)}
				</Tab>
				<Tab key='woman' title='Mujeres' className='w-60 p-7 text-xl'>
					{renderGrid(womenProducts.length > 0 ? womenProducts : products)}
				</Tab>
				<Tab key='men' title='Hombres' className='w-60 p-7 text-xl'>
					{renderGrid(menProducts.length > 0 ? menProducts : products)}
				</Tab>
				<Tab key='kid' title='Niños' className='w-60 p-7 text-xl'>
					{renderGrid(kidProducts.length > 0 ? kidProducts : products)}
				</Tab>
			</Tabs>
		</section>
	);
}
