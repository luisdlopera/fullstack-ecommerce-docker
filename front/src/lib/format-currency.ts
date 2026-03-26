/** Formato tipo tienda CO (ej. $85.000) */
export function formatCOP(amount: number): string {
	return `$${amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}
