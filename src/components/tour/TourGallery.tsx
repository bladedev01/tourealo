

"use client";
import React, { useState } from "react";

interface TourGalleryProps {
  images: string[];
}

const TourGallery: React.FC<TourGalleryProps> = ({ images }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  if (!images || images.length === 0) return null;

  // Layout 6-4-2-2
  return (
    <div className="flex flex-row gap-1 mb-1 items-stretch">
      {/* Imagen principal (6) */}
      <div className="flex-[6] flex items-center justify-center relative">
        <img
          src={images[0]}
          alt="Principal"
          className="w-full h-[340px] object-cover rounded-2xl shadow-lg cursor-pointer"
          style={{ maxWidth: '100%', maxHeight: '340px' }}
          onClick={() => { setModalOpen(true); setModalIndex(0); }}
        />
      </div>
      {/* Imagen secundaria (4) */}
      <div className="flex-[4] flex items-center justify-center">
        {images[1] && (
          <img
            src={images[1]}
            alt="Secundaria"
            className="w-full h-[340px] object-cover rounded-xl shadow cursor-pointer"
            style={{ maxWidth: '100%', maxHeight: '340px' }}
            onClick={() => { setModalOpen(true); setModalIndex(1); }}
          />
        )}
      </div>
      {/* Dos imágenes pequeñas (2 y 2, una arriba y una abajo) */}
      <div className="flex flex-col gap-1 flex-[2] justify-between h-[340px]">
        {images[2] && (
          <img
            src={images[2]}
            alt="Mini 1"
            className="w-full h-[166px] object-cover rounded-lg shadow cursor-pointer"
            style={{ maxWidth: '100%', maxHeight: '166px' }}
            onClick={() => { setModalOpen(true); setModalIndex(2); }}
          />
        )}
        {images[3] && (
          <div className="relative w-full h-[166px]">
            <img
              src={images[3]}
              alt="Mini 2"
              className="w-full h-full object-cover rounded-lg shadow cursor-pointer"
              style={{ maxWidth: '100%', maxHeight: '166px' }}
              onClick={() => { setModalOpen(true); setModalIndex(3); }}
            />
            {/* Botón Ver más sobre la última imagen pequeña */}
            {images.length > 4 && (
              <button
                className="absolute bottom-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full shadow-lg text-xs font-semibold hover:bg-emerald-700 transition"
                onClick={() => { setModalOpen(true); setModalIndex(3); }}
              >
                Ver más
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de galería */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-60 animate-fadeIn">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-5xl w-full flex flex-col items-center border border-emerald-100 animate-modalPop">
            <button
              className="absolute top-4 right-4 bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-emerald-700 transition"
              onClick={() => setModalOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="flex items-center justify-between w-full mb-2">
              <button
                className="w-12 h-12 rounded-full bg-white/80 text-emerald-700 text-3xl font-bold shadow hover:bg-emerald-100 transition flex items-center justify-center disabled:opacity-40"
                onClick={() => setModalIndex((prev) => prev > 0 ? prev - 1 : prev)}
                disabled={modalIndex === 0}
                aria-label="Anterior"
                style={{marginRight:8}}
              >
                ‹
              </button>
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={images[modalIndex]}
                  alt={`Modal ${modalIndex+1}`}
                  className="w-full max-h-[400px] object-contain rounded-2xl"
                  style={{ maxWidth: '900px', background: '#f8fafc' }}
                />
              </div>
              <button
                className="w-12 h-12 rounded-full bg-white/80 text-emerald-700 text-3xl font-bold shadow hover:bg-emerald-100 transition flex items-center justify-center disabled:opacity-40"
                onClick={() => setModalIndex((prev) => prev < images.length - 1 ? prev + 1 : prev)}
                disabled={modalIndex === images.length - 1}
                aria-label="Siguiente"
                style={{marginLeft:8}}
              >
                ›
              </button>
            </div>
            {/* Dots de posición */}
            <div className="flex justify-center items-center gap-2 mt-4 mb-2">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${idx === modalIndex ? 'bg-emerald-600 shadow-lg' : 'bg-gray-300'}`}
                  style={{boxShadow: idx === modalIndex ? '0 0 0 2px #10b981' : undefined}}
                />
              ))}
            </div>
            <div className="mt-2 text-center text-gray-500 text-xs">
              {modalIndex + 1} / {images.length}
            </div>
          </div>
          <style>{`
            .animate-fadeIn { animation: fadeIn 0.3s; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-modalPop { animation: modalPop 0.25s; }
            @keyframes modalPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default TourGallery;
