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
        <div className="relative w-full h-screen">
            <Swiper
                modules={[Navigation, Scrollbar, Autoplay]}
                loop={true}
                // autoplay={{ delay: 3000, disableOnInteraction: false }} 
                navigation={{
                    nextEl: ".custom-next",
                    prevEl: ".custom-prev",
                }}
                scrollbar={{ hide: true }}
                className="mySwiper h-[700px] w-full"
            >
                <SwiperSlide>
                    <div className="relative w-full h-full">
                        <Image
                            src='/img/slider-1.png'
                            alt='slide'
                            width={1440}
                            height={702}
                            className='w-full h-full object-cover'
                        />
                        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-black bg-opacity-50 text-white p-4">
                            <h2 className="text-5xl font-bold mb-4">Tu outfit soñado, ahora con oferta.</h2>
                            <p className="text-lg mb-6">Hasta 60% de descuento en ropa de mujer y hombre. ¡Corre antes de que se agoten!</p>
                            <div className='flex gap-4'>
                                <Button className="bg-primary text-white" endContent={<ArrowUpRight />}>Nuevas colecciones</Button>
                                <Button className="" variant='bordered'>Accesorios</Button>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="relative w-full h-full">
                        <Image
                            src='/img/slider-2.png'
                            alt='slide'
                            width={1440}
                            height={702}
                            className='w-full h-full object-cover'
                        />
                        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-black bg-opacity-50 text-white p-4">
                            <h2 className="text-5xl font-bold mb-4">Tu outfit soñado, ahora con oferta.</h2>
                            <p className="text-lg mb-6">Hasta 60% de descuento en ropa de mujer y hombre. ¡Corre antes de que se agoten!</p>
                            <div className='flex gap-4'>
                                <Button className="bg-primary text-white" endContent={<ArrowUpRight />}>Nuevas colecciones</Button>
                                <Button className="" variant='bordered'>Accesorios</Button>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="relative w-full h-full">
                        <Image
                            src='/img/slider-3.png'
                            alt='slide'
                            width={1440}
                            height={702}
                            className='w-full h-full object-cover'
                        />
                        <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-black bg-opacity-50 text-white p-4">
                            <h2 className="text-5xl font-bold mb-4">Tu outfit soñado, ahora con oferta.</h2>
                            <p className="text-lg mb-6">Hasta 60% de descuento en ropa de mujer y hombre. ¡Corre antes de que se agoten!</p>
                            <div className='flex gap-4'>
                                <Button className="bg-primary text-white" endContent={<ArrowUpRight />}>Nuevas colecciones</Button>
                                <Button className="" variant='bordered'>Accesorios</Button>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
            </Swiper>

            {/* Botones de navegación personalizados */}
            <Link className="custom-prev absolute left-10 top-1/2 -translate-y-1/2 p-3 z-10 text-white">
                <ChevronLeft size={30} />
            </Link>
            <Link className="custom-next absolute right-10 top-1/2 -translate-y-1/2 p-3 z-10 text-white">
                <ChevronRight size={30} />
            </Link>
        </div>
    );
}
