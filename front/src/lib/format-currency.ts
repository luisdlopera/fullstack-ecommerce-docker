/** Moneda de tienda (CO): un solo formateador para listados, PDP y checkout. */
export function formatCOP(amount: number): string {
	return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
