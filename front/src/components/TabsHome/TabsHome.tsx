'use client';

import { Tab, Tabs } from '@heroui/react';
import { ProductCard } from '../shared/ProductCard';
import { FeaturedProduct } from '@/lib/api';

type TabsHomeProps = {
	products: FeaturedProduct[];
};

export function TabsHome({ products }: TabsHomeProps) {
	return (
		<>
			<section className='mx-auto flex w-11/12 flex-col'>
				<Tabs aria-label='Options' className='flex w-full justify-center'>
					<Tab key='new' title='Nuevas colecciones' className='p-7 text-xl'>
						<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
							{products.map((product) => (
								<ProductCard
									key={product.id}
									name={product.title}
									price={product.price}
									image={product.images[0] || '/img/shirt/shirt-black-1.png'}
									image2={product.images[1] || product.images[0] || '/img/shirt/shirt-black-2.png'}
									isNew={true}
								/>
							))}
						</div>
					</Tab>
					<Tab key='woman' title='Mujeres' className='w-60 p-7 text-xl'>
						Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
						id est laborum.
					</Tab>
					<Tab key='men' title='Hombres' className='w-60 p-7 text-xl'>
						Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
						id est laborum.
					</Tab>
					<Tab key='kid' title='Niños' className='w-60 p-7 text-xl'>
						Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
						id est laborum.
					</Tab>
				</Tabs>
			</section>
		</>
	);
}
