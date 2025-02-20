'use client';

import 'swiper/css';
import 'swiper/css/scrollbar';
import 'swiper/css/navigation';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar, Autoplay } from 'swiper/modules';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Link } from '@heroui/react';

export function Slider() {
	return (
		<div className='relative h-screen w-full'>
			<Swiper
				modules={[Navigation, Scrollbar, Autoplay]}
				loop={true}
				// autoplay={{ delay: 3000, disableOnInteraction: false }}
				navigation={{
					nextEl: '.custom-next',
					prevEl: '.custom-prev',
				}}
				scrollbar={{ hide: true }}
				className='mySwiper h-[700px] w-full'
			>
				<SwiperSlide>
					<div className='relative h-full w-full'>
						<Image
							src='/img/slider-1.png'
							alt='slide'
							width={1440}
							height={702}
							className='h-full w-full object-cover'
						/>
						<div className='absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center bg-black bg-opacity-50 p-4 text-white'>
							<h2 className='mb-4 text-5xl font-bold'>Tu outfit soñado, ahora con oferta.</h2>
							<p className='mb-6 text-lg'>
								Hasta 60% de descuento en ropa de mujer y hombre. ¡Corre antes de que se agoten!
							</p>
							<div className='flex gap-4'>
								<Button className='bg-primary text-white' endContent={<ArrowUpRight />}>
									Nuevas colecciones
								</Button>
								<Button className='' variant='bordered'>
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
							className='h-full w-full object-cover'
						/>
						<div className='absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center bg-black bg-opacity-50 p-4 text-white'>
							<h2 className='mb-4 text-5xl font-bold'> El look que deseas, al mejor precio.</h2>
							<p className='mb-6 text-lg'>
								Encuentra las tendencias más exclusivas con descuentos irresistibles. ¡Solo por tiempo
								limitado!
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
							className='h-full w-full object-cover'
						/>
						<div className='absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center bg-black bg-opacity-50 p-4 text-white'>
							<h2 className='mb-4 text-5xl font-bold'>
								La moda que te define, a precios que te encantan.
							</h2>
							<p className='mb-6 text-lg'>Moda para él, con hasta 50% de descuento. ¡No te lo pierdas!</p>
							<div className='flex gap-4'>
								<Button className='bg-primary text-white' endContent={<ArrowUpRight />}>
									Conocer más
								</Button>
							</div>
						</div>
					</div>
				</SwiperSlide>
			</Swiper>

			{/* Botones de navegación personalizados */}
			<Link className='custom-prev absolute left-10 top-1/2 z-10 -translate-y-1/2 p-3 text-white'>
				<ChevronLeft size={30} />
			</Link>
			<Link className='custom-next absolute right-10 top-1/2 z-10 -translate-y-1/2 p-3 text-white'>
				<ChevronRight size={30} />
			</Link>
			<Image className='relative -top-20 w-full' src='/Separator.svg' alt='' width={100} height={100} />
		</div>
	);
}
