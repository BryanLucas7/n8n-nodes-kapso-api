const FLOW_SELECTION_SEPARATOR = '|';

export type ParsedFlowSelection = {
	metaFlowId: string;
	kapsoUuid?: string;
	status?: 'draft' | 'published';
	jsonVersion?: string;
	hasDataEndpoint?: boolean;
	defaultScreen?: string;
	flowName?: string;
	singleScreen?: boolean;
	flowsEncryptionConfigured?: boolean;
	previewUrl?: string;
};

function sanitizeFlowSelectionPart(value: string): string {
	return value.replace(/\|/g, ' ').trim();
}

export function encodeFlowSelection(entry: {
	kapsoUuid: string;
	metaFlowId: string;
	status: string;
	jsonVersion?: string | null;
	hasDataEndpoint?: boolean;
	defaultScreen?: string;
	flowName?: string;
	singleScreen?: boolean;
	flowsEncryptionConfigured?: boolean;
	previewUrl?: string | null;
}): string {
	const parts = [
		entry.kapsoUuid,
		entry.metaFlowId,
		entry.status,
		entry.jsonVersion ?? '',
		entry.hasDataEndpoint ? '1' : '0',
		sanitizeFlowSelectionPart(entry.defaultScreen ?? ''),
		sanitizeFlowSelectionPart(entry.flowName ?? ''),
		entry.singleScreen ? '1' : '0',
		entry.flowsEncryptionConfigured ? '1' : '0',
		entry.previewUrl ? encodeURIComponent(String(entry.previewUrl)) : '',
	];
	return parts.join(FLOW_SELECTION_SEPARATOR);
}

export function parseFlowSelection(raw: string): ParsedFlowSelection {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { metaFlowId: '' };
	}

	const parts = trimmed.split(FLOW_SELECTION_SEPARATOR);
	if (parts.length >= 6 && parts[1]) {
		let previewUrl: string | undefined;
		if (parts[9]) {
			try {
				previewUrl = decodeURIComponent(parts[9]);
			} catch {
				previewUrl = parts[9];
			}
		}

		return {
			kapsoUuid: parts[0] || undefined,
			metaFlowId: parts[1],
			status: parts[2] === 'draft' ? 'draft' : parts[2] === 'published' ? 'published' : undefined,
			jsonVersion: parts[3] || undefined,
			hasDataEndpoint: parts[4] === '1',
			defaultScreen: parts[5] || undefined,
			flowName: parts[6] || undefined,
			singleScreen: parts.length >= 8 ? parts[7] === '1' : undefined,
			flowsEncryptionConfigured: parts.length >= 9 ? parts[8] === '1' : undefined,
			previewUrl,
		};
	}

	return { metaFlowId: trimmed };
}

export function resolveFlowMode(
	userMode: string,
	selection: ParsedFlowSelection,
): 'draft' | 'published' | undefined {
	if (userMode === 'draft') {
		return 'draft';
	}

	if (userMode === 'published') {
		return 'published';
	}

	if (selection.status === 'draft') {
		return 'draft';
	}

	return undefined;
}

export function resolveFlowAction(
	userAction: string,
	selection: ParsedFlowSelection,
): 'navigate' | 'data_exchange' {
	if (userAction === 'navigate' || userAction === 'data_exchange') {
		return userAction;
	}

	return selection.hasDataEndpoint ? 'data_exchange' : 'navigate';
}

export function resolveFlowMessageVersion(userVersion: string, _selection?: ParsedFlowSelection): string {
	const trimmed = userVersion.trim();
	return trimmed || '3';
}

/** Kapso defaults flow_token to flow_id when omitted — keeps response collection working. */
export function resolveFlowToken(userToken: string, metaFlowId: string): string {
	const trimmed = userToken.trim();
	return trimmed || metaFlowId;
}

/** Default CTA label from the flow name when the user leaves the field empty. */
export function resolveFlowCta(userCta: string, flowName?: string, maxLength = 20): string {
	const trimmed = userCta.trim();
	if (trimmed) {
		return trimmed;
	}

	const fromName = (flowName ?? 'Open').trim();
	return (fromName || 'Open').slice(0, maxLength);
}
