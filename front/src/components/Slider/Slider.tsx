'use client';

import 'swiper/css';
import 'swiper/css/scrollbar';
import 'swiper/css/navigation';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar, Autoplay } from 'swiper/modules';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { LAYOUT_MAIN_INNER_WIDTH } from '@/components/layout/layout-classes';
import { Button, Link } from '@heroui/react';
import { homeSliderImages, sliderContent } from '@/config/home-slider';
import { getAssetUrl } from '@/lib/assets';
import { useSyncExternalStore } from 'react';

function getServerSnapshot() {
	return false;
}

function getSnapshot() {
	return true;
}

function subscribe() {
	return () => {};
}

export function Slider() {
	const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	if (!isMounted) {
		return (
			<div className='relative w-full' suppressHydrationWarning>
				<div className='relative h-[700px] w-full bg-gray-200'>
					<div className='flex h-full items-center justify-center'>
						<div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent' />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='relative w-full'>
			<div className='relative h-[700px] w-full'>
				<Swiper
					modules={[Navigation, Scrollbar, Autoplay]}
					loop={true}
					slidesPerView={1}
					simulateTouch
					navigation={{
						nextEl: '.custom-next',
						prevEl: '.custom-prev',
					}}
					scrollbar={{ hide: true }}
					className='mySwiper h-full w-full'
				>
					{homeSliderImages.map((imagePath, index) => {
						const content = sliderContent[index];
						return (
							<SwiperSlide key={index}>
								<div className='relative h-full w-full'>
									<Image
										src={getAssetUrl(imagePath)}
										alt={`slide-${index + 1}`}
										fill
										sizes='100vw'
										draggable={false}
										className='object-cover'
										priority={index === 0}
										unoptimized
									/>
									<div className='absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center bg-black/50 p-4 text-white'>
										<h2 className='mb-4 text-5xl font-bold'>{content.title}</h2>
										<p className='mb-6 text-lg'>{content.description}</p>
										<div className='flex gap-4'>
											{content.buttons.map((btn, btnIndex) => (
												<Button
													key={btnIndex}
													className={
														btn.variant === 'solid'
															? 'bg-primary text-white'
															: 'border-white text-white data-[hover=true]:bg-white/15 data-[hover=true]:text-white'
													}
													variant={btn.variant}
													endContent={btn.variant === 'solid' ? <ArrowUpRight /> : undefined}
												>
													{btn.label}
												</Button>
											))}
										</div>
									</div>
								</div>
							</SwiperSlide>
						);
					})}
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
