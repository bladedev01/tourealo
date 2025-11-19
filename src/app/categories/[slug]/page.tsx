import React from "react";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <h1>Categoría: {params.slug}</h1>
      {/* Aquí iría el listado de tours/atracciones de la categoría */}
    </div>
  );
}
