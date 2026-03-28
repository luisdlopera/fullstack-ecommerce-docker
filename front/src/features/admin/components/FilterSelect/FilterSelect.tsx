'use client';

import { Select, SelectItem } from '@heroui/react';

const EMPTY_KEY = '__filter_empty__';

type FilterSelectProps = {
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
	className?: string;
	/** When false, no empty row; value must match an option key (use for in-table selects). */
	allowEmpty?: boolean;
	'aria-label'?: string;
};

function toKey(v: string, allowEmpty: boolean) {
	if (!allowEmpty) return v;
	return v === '' ? EMPTY_KEY : v;
}

function fromKey(k: string, allowEmpty: boolean) {
	if (!allowEmpty) return k;
	return k === EMPTY_KEY ? '' : k;
}

export function FilterSelect({
	value,
	onChange,
	options,
	placeholder = 'Filtrar',
	className,
	allowEmpty = true,
	'aria-label': ariaLabel,
}: FilterSelectProps) {
	const keys = new Set<string>([toKey(value, allowEmpty)]);
	const items = [
		...(allowEmpty ? [{ key: EMPTY_KEY, label: placeholder }] : []),
		...options.map((opt) => ({ key: toKey(opt.value, false), label: opt.label })),
	];

	return (
		<Select
			size='sm'
			variant='bordered'
			radius='lg'
			className={`min-w-40 max-w-65 ${className ?? ''}`}
			aria-label={ariaLabel ?? placeholder}
			items={items}
			selectedKeys={keys}
			onSelectionChange={(sel) => {
				const k = Array.from(sel as Set<string>)[0];
				if (k === undefined) return;
				onChange(fromKey(String(k), allowEmpty));
			}}
		>
			{(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
		</Select>
	);
}
