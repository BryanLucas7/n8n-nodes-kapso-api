import { IDataObject } from 'n8n-workflow';
import { findTemplateEntry } from './templateDefinition';

export const TEMPLATE_SELECTION_SEPARATOR = '|';

export type ParsedTemplateSelection = {
	name: string;
	language: string;
	id?: string;
};

export function encodeMessageTemplateValue(entry: IDataObject): string {
	const name = String(entry.name ?? '').trim();
	const language = String(entry.language ?? entry.language_code ?? '').trim();
	return `${name}${TEMPLATE_SELECTION_SEPARATOR}${language}`;
}

export function parseTemplateSelection(
	selection: string,
	legacyLanguageCode?: string,
): ParsedTemplateSelection {
	const trimmed = selection.trim();
	if (!trimmed) {
		return { name: '', language: '' };
	}

	const separatorIndex = trimmed.lastIndexOf(TEMPLATE_SELECTION_SEPARATOR);
	if (separatorIndex > 0) {
		return {
			name: trimmed.slice(0, separatorIndex),
			language: trimmed.slice(separatorIndex + 1),
		};
	}

	const legacyLanguage = legacyLanguageCode?.trim() ?? '';
	if (legacyLanguage) {
		return { name: trimmed, language: legacyLanguage };
	}

	if (/^\d+$/.test(trimmed)) {
		return { name: '', language: '', id: trimmed };
	}

	return { name: trimmed, language: '' };
}

export function findTemplateEntryBySelection(
	entries: IDataObject[],
	selection: string,
	legacyLanguageCode?: string,
): IDataObject | undefined {
	const parsed = parseTemplateSelection(selection, legacyLanguageCode);

	if (parsed.id) {
		const byId = entries.find(
			(entry) => String(entry.id ?? entry.meta_template_id ?? '') === parsed.id,
		);
		if (byId) {
			return byId;
		}
	}

	if (parsed.name && parsed.language) {
		return findTemplateEntry(entries, parsed.name, parsed.language);
	}

	if (parsed.name) {
		const matches = entries.filter((entry) => String(entry.name ?? '') === parsed.name);
		if (matches.length === 1) {
			return matches[0];
		}
	}

	return undefined;
}

export function templateIdentityFromEntry(entry: IDataObject): { name: string; language: string } {
	return {
		name: String(entry.name ?? '').trim(),
		language: String(entry.language ?? entry.language_code ?? '').trim(),
	};
}
