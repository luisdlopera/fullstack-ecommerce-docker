'use client';

import { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/scrollbar';
import 'swiper/css/navigation';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar, Autoplay } from 'swiper/modules';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { LAYOUT_MAIN_INNER_WIDTH } from '@/components/layout/layout-classes';
import { Button, Link, Spinner } from '@heroui/react';

interface HomeBanner {
	id: number;
	title: string;
	subtitle: string | null;
	ctaText: string | null;
	ctaLink: string | null;
	secondaryText: string | null;
	secondaryLink: string | null;
	imageUrl: string;
	altText: string | null;
	sortOrder: number;
}

function useHomeBanners() {
	const [banners, setBanners] = useState<HomeBanner[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchBanners() {
			try {
				const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/products/banners`;

				const response = await fetch(apiUrl);
				if (!response.ok) throw new Error('Failed to fetch banners');
				const data = await response.json();

				setBanners(data);
			} catch (err) {
				console.error('[Slider] Error fetching banners:', err);
				setError(err instanceof Error ? err.message : 'Error loading banners');
			} finally {
				setLoading(false);
			}
		}

		fetchBanners();
	}, []);

	return { banners, loading, error };
}

export function Slider() {
	const { banners, loading, error } = useHomeBanners();

	if (loading) {
		return (
			<div className='relative flex h-[702px] w-full items-center justify-center bg-gray-100'>
				<Spinner size='lg' />
			</div>
		);
	}

	if (error || banners.length === 0) {
		return null;
	}

	return (
		<div className='relative w-full'>
			<div className='relative h-[702px] w-full'>
				<Swiper
					modules={[Navigation, Scrollbar, Autoplay]}
					loop={banners.length > 1}
					simulateTouch
					autoplay={{ delay: 5000, disableOnInteraction: false }}
					navigation={{
						nextEl: '.custom-next',
						prevEl: '.custom-prev',
					}}
					scrollbar={{ hide: true }}
					className='mySwiper h-full w-full'
				>
					{banners.map((banner) => (
						<SwiperSlide key={banner.id}>
							<div className='relative h-full w-full'>
								<Image
									src={banner.imageUrl}
									alt={banner.altText || banner.title}
									fill
									draggable={false}
									className='z-0 object-cover'
									priority={banner.sortOrder === 0}
									sizes='100vw'
								/>
								<div className='absolute top-0 left-0 z-10 flex h-full w-full flex-col items-center justify-center bg-black/50 p-4 text-white'>
									<h2 className='mb-4 max-w-3xl text-center text-4xl font-bold md:text-5xl'>
										{banner.title}
									</h2>
									{banner.subtitle && (
										<p className='mb-6 max-w-2xl text-center text-lg'>{banner.subtitle}</p>
									)}
									<div className='flex flex-wrap gap-4'>
										{banner.ctaText && banner.ctaLink && (
											<Button
												className='bg-primary text-white'
												endContent={<ArrowUpRight />}
												as={Link}
												href={banner.ctaLink}
											>
												{banner.ctaText}
											</Button>
										)}
										{banner.secondaryText && banner.secondaryLink && (
											<Button
												className='border-white text-white data-[hover=true]:bg-white/15 data-[hover=true]:text-white'
												variant='bordered'
												as={Link}
												href={banner.secondaryLink}
											>
												{banner.secondaryText}
											</Button>
										)}
									</div>
								</div>
							</div>
						</SwiperSlide>
					))}
				</Swiper>

				<div
					className={`pointer-events-none absolute inset-0 z-10 flex h-full items-center justify-between ${LAYOUT_MAIN_INNER_WIDTH}`}
				>
					<Link className='custom-prev pointer-events-auto p-3 text-white'>
						<ChevronLeft size={30} />
					</Link>
					<Link className='custom-next pointer-events-auto p-3 text-white'>
						<ChevronRight size={30} />
					</Link>
				</div>
			</div>
			<Image className='relative -top-32 w-full' src='/Separator.svg' alt='' width={100} height={100} />
		</div>
	);
}
