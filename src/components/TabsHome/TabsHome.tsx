'use client';

import { Tab, Tabs } from '@heroui/react';

export function TabsHome() {
	return (
		<>
			<section className='mx-auto mt-96 flex w-11/12 flex-col'>
				<Tabs aria-label='Options' className='flex w-full justify-center'>
					<Tab key='new' title='Nuevas colecciones' className='w-60 p-7 text-xl'>
						Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
						id est laborum.
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
