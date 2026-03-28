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

export function Slider() {
	return (
		<div className='relative w-full'>
			<div className='relative h-[700px] w-full'>
				<Swiper
					modules={[Navigation, Scrollbar, Autoplay]}
					loop={true}
					simulateTouch
					// autoplay={{ delay: 3000, disableOnInteraction: false }}
					navigation={{
						nextEl: '.custom-next',
						prevEl: '.custom-prev',
					}}
					scrollbar={{ hide: true }}
					className='mySwiper h-full w-full'
				>
					<SwiperSlide>
						<div className='relative h-full w-full'>
							<Image
								src='/img/slider-1.png'
								alt='slide'
								width={1440}
								height={702}
								draggable={false}
								className='h-full w-full object-cover'
							/>
							<div className='bg-opacity-50 absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center bg-black p-4 text-white'>
								<h2 className='mb-4 text-5xl font-bold'>Tu outfit soñado, ahora con oferta.</h2>
								<p className='mb-6 text-lg'>
									Hasta 60% de descuento en ropa de mujer y hombre. ¡Corre antes de que se agoten!
								</p>
								<div className='flex gap-4'>
									<Button className='bg-primary text-white' endContent={<ArrowUpRight />}>
										Nuevas colecciones
									</Button>
									<Button
										className='border-white text-white data-[hover=true]:bg-white/15 data-[hover=true]:text-white'
										variant='bordered'
									>
										Accesorios
									</Button>
								</div>
							</div>
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='relative h-full w-full'>
							<Image
								src='/img/slider-2.png'
								alt='slide'
								width={1440}
								height={702}
								draggable={false}
								className='h-full w-full object-cover'
							/>
							<div className='bg-opacity-50 absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center bg-black p-4 text-white'>
								<h2 className='mb-4 text-5xl font-bold'> El look que deseas, al mejor precio.</h2>
								<p className='mb-6 text-lg'>
									Encuentra las tendencias más exclusivas con descuentos irresistibles. ¡Solo por
									tiempo limitado!
								</p>
								<div className='flex gap-4'>
									<Button className='bg-primary text-white' endContent={<ArrowUpRight />}>
										Conocer outfits
									</Button>
								</div>
							</div>
						</div>
					</SwiperSlide>
					<SwiperSlide>
						<div className='relative h-full w-full'>
							<Image
								src='/img/slider-3.png'
								alt='slide'
								width={1440}
								height={702}
								draggable={false}
								className='h-full w-full object-cover'
							/>
							<div className='bg-opacity-50 absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center bg-black p-4 text-white'>
								<h2 className='mb-4 text-5xl font-bold'>
									La moda que te define, a precios que te encantan.
								</h2>
								<p className='mb-6 text-lg'>
									Moda para él, con hasta 50% de descuento. ¡No te lo pierdas!
								</p>
								<div className='flex gap-4'>
									<Button className='bg-primary text-white' endContent={<ArrowUpRight />}>
										Conocer más
									</Button>
								</div>
							</div>
						</div>
					</SwiperSlide>
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
