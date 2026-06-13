import { IDataObject } from 'n8n-workflow';
import { findTemplateEntry, parseTemplateDefinition, TemplateDefinition } from './templateDefinition';

export const TEMPLATE_SELECTION_SEPARATOR = '|';

export type ParsedTemplateSelection = {
	name: string;
	language: string;
	id?: string;
};

export type TemplateValueMetadata = {
	layout: 'standard' | 'carousel';
	headerFormat: string;
	hasBodyVariables: boolean;
	hasButtonParameters: boolean;
	hasMpmButtons: boolean;
	headerTextHasVariable: boolean;
};

function encodeBool(value: boolean): 'y' | 'n' {
	return value ? 'y' : 'n';
}

export function metadataFromDefinition(definition: TemplateDefinition): TemplateValueMetadata {
	const dynamicSlots = definition.buttonSlots.filter((slot) => slot.dynamicKind);
	const hasMpm = definition.buttonSlots.some((slot) => slot.dynamicKind === 'mpm');
	const hasNonMpmButtons = dynamicSlots.some((slot) => slot.dynamicKind !== 'mpm');

	return {
		layout: definition.componentMode === 'carousel' ? 'carousel' : 'standard',
		headerFormat: definition.headerFormat || 'none',
		hasBodyVariables: definition.bodyVariables.length > 0,
		hasButtonParameters: hasNonMpmButtons,
		hasMpmButtons: hasMpm,
		headerTextHasVariable: Boolean(definition.headerTextHasVariable),
	};
}

export function encodeMessageTemplateValue(entry: IDataObject): string {
	const name = String(entry.name ?? '').trim();
	const language = String(entry.language ?? entry.language_code ?? '').trim();

	let metadata: TemplateValueMetadata | undefined;
	try {
		const definition = parseTemplateDefinition(entry);
		metadata = metadataFromDefinition(definition);
	} catch {
		metadata = undefined;
	}

	if (!metadata) {
		return `${name}${TEMPLATE_SELECTION_SEPARATOR}${language}`;
	}

	return [
		name,
		language,
		metadata.layout,
		metadata.headerFormat,
		encodeBool(metadata.hasBodyVariables),
		encodeBool(metadata.hasButtonParameters),
		encodeBool(metadata.hasMpmButtons),
		encodeBool(metadata.headerTextHasVariable),
	].join(TEMPLATE_SELECTION_SEPARATOR);
}

export function parseTemplateSelection(
	selection: string,
	legacyLanguageCode?: string,
): ParsedTemplateSelection {
	const trimmed = selection.trim();
	if (!trimmed) {
		return { name: '', language: '' };
	}

	const parts = trimmed.split(TEMPLATE_SELECTION_SEPARATOR);
	if (parts.length >= 2 && parts[0] && parts[1]) {
		return { name: parts[0], language: parts[1] };
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
