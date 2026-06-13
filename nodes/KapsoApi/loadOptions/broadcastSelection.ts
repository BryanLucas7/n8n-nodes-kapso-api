import { IDataObject } from 'n8n-workflow';
import { metadataFromDefinition } from './templateSelection';
import { parseBroadcastTemplateDefinition } from './broadcastTemplateFetch';

export const BROADCAST_SELECTION_SEPARATOR = '|';

function encodeBool(value: boolean): 'y' | 'n' {
	return value ? 'y' : 'n';
}

/**
 * Encode `uuid|layout|headerFormat|hasBody|hasButton|hasMpm` from a broadcast entry.
 * Falls back to the bare UUID when the broadcast lacks an embedded template.
 */
export function encodeBroadcastValue(entry: IDataObject): string {
	const uuid = String(entry.id ?? '').trim();
	if (!uuid) {
		return '';
	}

	const definition = parseBroadcastTemplateDefinition(entry);
	if (!definition) {
		return uuid;
	}

	const metadata = metadataFromDefinition(definition);
	return [
		uuid,
		metadata.layout,
		metadata.headerFormat,
		encodeBool(metadata.hasBodyVariables),
		encodeBool(metadata.hasButtonParameters),
		encodeBool(metadata.hasMpmButtons),
	].join(BROADCAST_SELECTION_SEPARATOR);
}

/** Strips embedded metadata, returning the UUID portion only. */
export function extractBroadcastUuid(rawValue: string): string {
	if (!rawValue) {
		return '';
	}
	const trimmed = rawValue.trim();
	const separatorIndex = trimmed.indexOf(BROADCAST_SELECTION_SEPARATOR);
	return separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
}
