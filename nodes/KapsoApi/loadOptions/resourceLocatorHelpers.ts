import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

export function readNodeParameterString(
	context: ILoadOptionsFunctions,
	parameterName: string,
): string {
	const raw = context.getCurrentNodeParameter(parameterName);

	if (raw && typeof raw === 'object' && 'value' in raw) {
		return String((raw as { value?: string }).value ?? '').trim();
	}

	return String(raw ?? '').trim();
}

export function readExecuteNodeParameterString(
	context: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
): string {
	const raw = context.getNodeParameter(parameterName, itemIndex, '');

	if (raw && typeof raw === 'object' && 'value' in raw) {
		return String((raw as { value?: string }).value ?? '').trim();
	}

	return String(raw ?? '').trim();
}
