import { ILoadOptionsFunctions } from 'n8n-workflow';

function readLegacyFlowMode(context: ILoadOptionsFunctions): string {
	const flowOptions = context.getCurrentNodeParameter('flowOptions');

	if (flowOptions && typeof flowOptions === 'object' && 'flowMode' in flowOptions) {
		return String((flowOptions as { flowMode?: string }).flowMode ?? '').trim();
	}

	return '';
}

export function readFlowModeFromOptions(context: ILoadOptionsFunctions): string {
	const flowMode = context.getCurrentNodeParameter('flowMode');
	if (typeof flowMode === 'string' && flowMode.trim()) {
		return flowMode.trim();
	}

	return readLegacyFlowMode(context);
}

export function readFlowModeFromExecuteParameters(
	flowMode: unknown,
	flowOptions: unknown,
): string {
	if (typeof flowMode === 'string' && flowMode.trim()) {
		return flowMode.trim();
	}

	if (flowOptions && typeof flowOptions === 'object' && 'flowMode' in flowOptions) {
		return String((flowOptions as { flowMode?: string }).flowMode ?? '').trim();
	}

	return '';
}
