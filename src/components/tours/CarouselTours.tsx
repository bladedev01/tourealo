"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { ReactNode } from "react";

interface Props {
  tours: any[];
  renderItem?: (tour: any) => ReactNode;
  className?: string;
}

export default function CarouselTours({ tours, renderItem, className }: Props) {
  const [swiper, setSwiper] = useState<any | null>(null);

  if (!tours || tours.length === 0) return null;

  return (
    <div className={className ?? "relative"}>
      <div className="absolute left-3 top-1/2 z-30 -translate-y-1/2">
        <button
          aria-label="Anterior"
          onClick={() => swiper?.slidePrev()}
          className="bg-white/95 dark:bg-slate-900/80 rounded-full shadow-lg border border-slate-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 flex items-center justify-center"
          style={{ width: 48, height: 48 }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <Swiper
        onSwiper={(s) => setSwiper(s)}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
        centeredSlides={false}
        className="py-2"
      >
        {tours.map((tour) => (
          <SwiperSlide key={tour.id} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
            {renderItem ? renderItem(tour) : null}
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute right-3 top-1/2 z-30 -translate-y-1/2">
        <button
          aria-label="Siguiente"
          onClick={() => swiper?.slideNext()}
          className="bg-white/95 dark:bg-slate-900/80 rounded-full shadow-lg border border-slate-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 flex items-center justify-center"
          style={{ width: 48, height: 48 }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
