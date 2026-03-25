import { Slider } from '@/components/Slider/Slider';
import { TabsHome } from '@/components/TabsHome';
import { FeaturedProduct, getFeaturedProducts } from '@/lib/api';

export default async function Home() {
	let products: FeaturedProduct[] = [];

	try {
		products = await getFeaturedProducts(8);
	} catch {
		products = [
			{
				id: 'fallback-1',
				title: 'Camiseta Basica Negra',
				price: 85,
				slug: 'camiseta-basica-negra',
				images: ['/img/shirt/shirt-black-1.png', '/img/shirt/shirt-black-2.png'],
			},
		];
	}

	return (
		<>
			<Slider />
			<TabsHome products={products} />
		</>
	);
}
