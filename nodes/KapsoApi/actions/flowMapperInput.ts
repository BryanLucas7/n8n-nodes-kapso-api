import { ApplicationError, IDataObject, IExecuteFunctions, ResourceMapperValue } from 'n8n-workflow';
import { parseJsonValue } from '../transport/json';
import {
	extractScreenDataSchema,
	fetchFlowVersionDetail,
	resolveKapsoFlowIdForExecute,
} from '../loadOptions/flowAssets';
import { readFlowModeFromExecuteParameters } from '../loadOptions/flowModeHelpers';
import { parseFlowSelection } from '../loadOptions/flowSelection';
import { readExecuteNodeParameterString } from '../loadOptions/resourceLocatorHelpers';

function readResourceMapperValue(
	ef: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
): Record<string, unknown> {
	const mapper = ef.getNodeParameter(parameterName, itemIndex, {
		mappingMode: 'defineBelow',
		value: null,
	}) as ResourceMapperValue;

	return (mapper.value ?? {}) as Record<string, unknown>;
}

function coerceFlowDataValue(value: unknown): unknown {
	if (value === null || value === undefined || value === '') {
		return undefined;
	}

	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
			try {
				return parseJsonValue(trimmed, 'Flow Initial Data');
			} catch {
				return value;
			}
		}
		return value;
	}

	return value;
}

export function readFlowInitialData(
	ef: IExecuteFunctions,
	itemIndex: number,
): IDataObject | undefined {
	const mapperValue = readResourceMapperValue(ef, 'flowInitialDataMapper', itemIndex);
	const result: IDataObject = {};

	for (const [key, rawValue] of Object.entries(mapperValue)) {
		const coerced = coerceFlowDataValue(rawValue);
		if (coerced !== undefined) {
			result[key] = coerced;
		}
	}

	if (Object.keys(result).length === 0) {
		return undefined;
	}

	return result;
}

export async function validateFlowInitialDataAtExecute(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | undefined> {
	const initialData = readFlowInitialData(ef, itemIndex);
	if (!initialData) {
		return undefined;
	}

	const flowRaw = readExecuteNodeParameterString(ef, 'flowId', itemIndex);
	const selection = parseFlowSelection(flowRaw);
	const kapsoFlowId = await resolveKapsoFlowIdForExecute(ef, selection, itemIndex);
	if (!kapsoFlowId) {
		return initialData;
	}

	const flowOptions = ef.getNodeParameter('flowOptions', itemIndex, {}) as { flowMode?: string };
	const flowMode = readFlowModeFromExecuteParameters(ef.getNodeParameter('flowMode', itemIndex), flowOptions);
	const preferStatus =
		flowMode === 'draft'
			? 'draft'
			: flowMode === 'published'
				? 'published'
				: selection.status === 'draft'
					? 'draft'
					: 'published';
	const assets = await fetchFlowVersionDetail(ef, kapsoFlowId, preferStatus, itemIndex);
	const screenId =
		readExecuteNodeParameterString(ef, 'flowScreen', itemIndex) ||
		selection.defaultScreen ||
		assets.defaultScreen;
	const allowedKeys = new Set(extractScreenDataSchema(assets.flowJson, screenId).map((field) => field.key));

	for (const key of Object.keys(initialData)) {
		if (!allowedKeys.has(key)) {
			throw new ApplicationError(
				`Unexpected Flow Initial Data field "${key}" for screen "${screenId ?? 'default'}". Refresh the mapper after changing Flow or screen.`,
			);
		}
	}

	return initialData;
}

export function assertFlowInitialDataMapperReady(
	ef: IExecuteFunctions,
	itemIndex: number,
): void {
	try {
		readFlowInitialData(ef, itemIndex);
	} catch (error) {
		throw new ApplicationError(
			error instanceof Error ? error.message : 'Invalid Flow Initial Data mapping.',
		);
	}
}
