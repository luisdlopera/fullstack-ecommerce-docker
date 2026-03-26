import type { CollectionSlug } from './types';

const COPY: Record<
  CollectionSlug,
  {
    title: string;
    description: string;
  }
> = {
  men: {
    title: 'Men Collection',
    description: 'Piezas esenciales con silueta contemporánea y acabados premium para el día a día.',
  },
  women: {
    title: 'Woman Collection',
    description: 'Curaduría femenina con textura, color y versatilidad para cada momento.',
  },
  kids: {
    title: 'Kids Collection',
    description: 'Comodidad y resistencia para que jueguen, exploren y brillen sin límites.',
  },
  new: {
    title: 'Nueva Colección: Estilo que Inspira.',
    description: 'Lanzamientos recientes seleccionados: tendencia, calidad y actitud NEXSTORE.',
  },
};

type CollectionHeaderProps = { collection: CollectionSlug };

export function CollectionHeader({ collection }: CollectionHeaderProps) {
  const { title, description } = COPY[collection];
  return (
    <header className='mb-8'>
      <h1 className='text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl'>{title}</h1>
      <p className='mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base'>{description}</p>
    </header>
  );
}