import { Header } from '@/components/shared/Header';
import { Slider } from '@/components/Slider/Slider';
import { TabsHome } from '@/components/TabsHome';

export default function Home() {
	return (
		<>
			<Header />
			<Slider />
			<TabsHome />
		</>
	);
}
