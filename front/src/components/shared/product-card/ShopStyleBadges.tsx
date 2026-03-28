type ShopStyleBadgesProps = {
	isNew?: boolean;
	discount?: number;
	isSoldOut?: boolean;
	/** PDP / catálogo: etiqueta libre (ej. “Destacado”) */
	highlightBadge?: string;
	/** PDP / catálogo: texto de oferta (ej. “-20%”) */
	discountBadge?: string;
};

export function ShopStyleBadges({
	isNew = false,
	discount = 0,
	isSoldOut = false,
	highlightBadge,
	discountBadge,
}: ShopStyleBadgesProps) {
	return (
		<div className='absolute top-3 left-3 z-20 flex flex-wrap gap-2'>
			{highlightBadge && (
				<span className='z-10 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white'>
					{highlightBadge}
				</span>
			)}
			{discountBadge && (
				<span className='z-10 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white'>
					{discountBadge}
				</span>
			)}
			{isNew && <span className='z-10 rounded-md bg-black px-2 py-1 text-xs text-white'>Nuevo</span>}
			{discount > 0 && (
				<span className='z-10 rounded-md bg-blue-600 px-2 py-1 text-xs text-white'>{discount}%</span>
			)}
			{isSoldOut && <span className='z-10 rounded-md bg-red-600 px-2 py-1 text-xs text-white'>Agotado</span>}
		</div>
	);
}
