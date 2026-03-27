type ShopStyleBadgesProps = {
	isNew?: boolean;
	discount?: number;
	isSoldOut?: boolean;
};

export function ShopStyleBadges({ isNew = false, discount = 0, isSoldOut = false }: ShopStyleBadgesProps) {
	return (
		<div className='absolute top-3 left-3 z-20 flex gap-2'>
			{isNew && <span className='z-10 rounded-md bg-black px-2 py-1 text-xs text-white'>Nuevo</span>}
			{discount > 0 && (
				<span className='z-10 rounded-md bg-blue-600 px-2 py-1 text-xs text-white'>{discount}%</span>
			)}
			{isSoldOut && <span className='z-10 rounded-md bg-red-600 px-2 py-1 text-xs text-white'>Agotado</span>}
		</div>
	);
}
