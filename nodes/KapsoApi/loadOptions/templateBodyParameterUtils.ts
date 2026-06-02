import { TemplateBodyValueType } from './templateDefinition';

const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
	$: 'USD',
	'€': 'EUR',
	'£': 'GBP',
	'¥': 'JPY',
	R$: 'BRL',
};

export type ParsedCurrencyExample = {
	code: string;
	amount: number;
	fallback: string;
};

export function normalizeBodyVariableType(value: unknown): TemplateBodyValueType {
	const normalized = String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/-/g, '_');

	if (normalized === 'currency') {
		return 'currency';
	}

	if (normalized === 'date_time' || normalized === 'datetime') {
		return 'date_time';
	}

	return 'text';
}

function looksLikeDateTimeExample(example: string): boolean {
	if (/^\d+$/.test(example)) {
		return false;
	}

	if (
		!/[/:]|am|pm|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
			example,
		)
	) {
		return false;
	}

	return !Number.isNaN(Date.parse(example));
}

export function inferValueTypeFromExample(
	exampleValue: unknown,
	libraryType?: unknown,
): TemplateBodyValueType {
	const fromLibrary = libraryType ? normalizeBodyVariableType(libraryType) : undefined;
	if (fromLibrary && fromLibrary !== 'text') {
		return fromLibrary;
	}

	const example = String(exampleValue ?? '').trim();
	if (!example) {
		return 'text';
	}

	if (parseCurrencyExample(example)) {
		return 'currency';
	}

	if (looksLikeDateTimeExample(example)) {
		return 'date_time';
	}

	return 'text';
}

export function parseCurrencyExample(example: string): ParsedCurrencyExample | undefined {
	const trimmed = example.trim();
	if (!trimmed) {
		return undefined;
	}

	for (const [symbol, code] of Object.entries(CURRENCY_SYMBOL_TO_CODE)) {
		if (trimmed.startsWith(symbol)) {
			const amountRaw = trimmed.slice(symbol.length).replace(/,/g, '').trim();
			const amount = Number.parseFloat(amountRaw);
			if (Number.isFinite(amount)) {
				return { code, amount, fallback: trimmed };
			}
		}
	}

	const isoMatch = /^([A-Z]{3})\s*([\d.,]+)$/.exec(trimmed);
	if (isoMatch) {
		const amount = Number.parseFloat(isoMatch[2].replace(/,/g, ''));
		if (Number.isFinite(amount)) {
			return { code: isoMatch[1], amount, fallback: trimmed };
		}
	}

	const genericMatch = /([\d]+(?:[.,]\d+)?)/.exec(trimmed);
	if (genericMatch && /[$€£¥]/.test(trimmed)) {
		const amount = Number.parseFloat(genericMatch[1].replace(/,/g, ''));
		if (Number.isFinite(amount)) {
			return {
				code: 'USD',
				amount,
				fallback: trimmed,
			};
		}
	}

	return undefined;
}

export function parseDateTimeExample(example: string): { iso?: string; fallback: string } {
	const trimmed = example.trim();
	if (!trimmed) {
		return { fallback: '' };
	}

	const parsed = Date.parse(trimmed);
	if (!Number.isNaN(parsed)) {
		return { iso: new Date(parsed).toISOString(), fallback: trimmed };
	}

	return { fallback: trimmed };
}
