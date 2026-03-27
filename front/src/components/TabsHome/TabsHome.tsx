'use client';

import { Tab, Tabs } from '@heroui/react';
import { ProductCard, featuredProductToCardModel } from '@/features/product';
import type { FeaturedProduct } from '@/lib/api';

type TabsHomeProps = {
	products: FeaturedProduct[];
};

export function TabsHome({ products }: TabsHomeProps) {
	const getGenderProducts = (gender: string) => products.filter((p) => p.gender === gender);

	const menProducts = getGenderProducts('men');
	const womenProducts = getGenderProducts('women');
	const kidProducts = getGenderProducts('kid');

	const renderGrid = (list: FeaturedProduct[]) => {
		if (list.length === 0) {
			return <p className='py-10 text-center text-gray-500'>No hay productos en esta categoría.</p>;
		}
		return (
			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
				{list.map((product) => (
					<ProductCard
						key={product.id}
						variant='shop'
						model={featuredProductToCardModel(product)}
						showActions
					/>
				))}
			</div>
		);
	};

	return (
		<section className='relative z-10 mx-auto mt-2 flex w-11/12 flex-col'>
			<Tabs
				aria-label='Options'
				className='flex w-full flex-col justify-center'
				classNames={{
					base: 'flex w-full flex-col gap-3',
					tabList: 'z-10 w-full shrink-0 flex-nowrap justify-center',
				}}
			>
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
