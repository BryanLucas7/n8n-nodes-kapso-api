import { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	LOAD_OPTIONS_MAX_PAGES,
	requireLoadOptionsDependency,
} from './helpers';
import { kapsoApiRequest } from '../transport/request';
import { parseFlowSelection, type ParsedFlowSelection } from './flowSelection';
import { readFlowModeFromOptions, readFlowModeFromExecuteParameters } from './flowModeHelpers';
import { readExecuteNodeParameterString, readNodeParameterString } from './resourceLocatorHelpers';

export type FlowDataSchemaField = {
	key: string;
	type: string;
	example?: unknown;
};

export function extractScreenIds(flowJson: unknown): string[] {
	if (!flowJson || typeof flowJson !== 'object') {
		return [];
	}

	const screens = (flowJson as { screens?: unknown[] }).screens;
	if (!Array.isArray(screens)) {
		return [];
	}

	return screens
		.map((screen) =>
			screen && typeof screen === 'object' ? String((screen as { id?: string }).id ?? '').trim() : '',
		)
		.filter(Boolean);
}

export function extractDefaultScreen(flowJson: unknown): string | undefined {
	const screenIds = extractScreenIds(flowJson);
	if (screenIds.length === 0) {
		return undefined;
	}

	if (!flowJson || typeof flowJson !== 'object') {
		return screenIds[0];
	}

	const routingModel = (flowJson as { routing_model?: Record<string, unknown> }).routing_model;
	if (routingModel && typeof routingModel === 'object') {
		const entry = Object.keys(routingModel).find((key) => screenIds.includes(key));
		if (entry) {
			return entry;
		}
	}

	return screenIds[0];
}

function readScreenData(
	flowJson: unknown,
	screenId?: string,
): Record<string, unknown> | undefined {
	if (!flowJson || typeof flowJson !== 'object' || !screenId) {
		return undefined;
	}

	const screens = (flowJson as { screens?: unknown[] }).screens;
	if (!Array.isArray(screens)) {
		return undefined;
	}

	const screen = screens.find(
		(entry) => entry && typeof entry === 'object' && String((entry as { id?: string }).id ?? '') === screenId,
	);

	if (!screen || typeof screen !== 'object') {
		return undefined;
	}

	const data = (screen as { data?: unknown }).data;
	return data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined;
}

export function extractScreenDataSchema(
	flowJson: unknown,
	screenId?: string,
): FlowDataSchemaField[] {
	const resolvedScreenId = screenId?.trim() || extractDefaultScreen(flowJson);
	const data = readScreenData(flowJson, resolvedScreenId);
	if (!data) {
		return [];
	}

	return Object.entries(data).map(([key, schema]) => {
		if (!schema || typeof schema !== 'object') {
			return {
				key,
				type: 'string',
			};
		}

		const typedSchema = schema as { type?: string; __example__?: unknown };
		return {
			key,
			type: String(typedSchema.type ?? 'string'),
			example: typedSchema.__example__,
		};
	});
}

function pickFlowVersion(
	versions: IDataObject[],
	preferStatus: 'draft' | 'published' | '',
): IDataObject | undefined {
	if (versions.length === 0) {
		return undefined;
	}

	const preferred =
		preferStatus === 'draft'
			? versions.find((entry) => entry.status === 'draft')
			: preferStatus === 'published'
				? versions.find((entry) => entry.status === 'published')
				: versions.find((entry) => entry.status === 'published') ?? versions[0];

	return preferred ?? versions[0];
}

export async function fetchFlowVersionDetail(
	context: ILoadOptionsFunctions | IExecuteFunctions,
	kapsoFlowId: string,
	preferStatus: 'draft' | 'published' | '',
	itemIndex = 0,
): Promise<{
	screens: string[];
	defaultScreen?: string;
	jsonVersion?: string;
	hasDataEndpoint?: boolean;
	flowsEncryptionConfigured?: boolean;
	previewUrl?: string;
	singleScreen?: boolean;
	screenCount?: number;
	flowJson?: unknown;
}> {
	const versionsResponse =
		'helpers' in context && 'request' in context.helpers
			? await kapsoLoadOptionsRequest(context as ILoadOptionsFunctions, {
					api: 'platform',
					method: 'GET',
					path: `/whatsapp/flows/${encodeURIComponent(kapsoFlowId)}/versions`,
					query: {
						page: 1,
						per_page: 20,
					},
				})
			: await kapsoApiRequest(
					context as IExecuteFunctions,
					{
						api: 'platform',
						method: 'GET',
						path: `/whatsapp/flows/${encodeURIComponent(kapsoFlowId)}/versions`,
						query: {
							page: 1,
							per_page: 20,
						},
					},
					itemIndex,
				);

	const versions = extractResponseData(versionsResponse);
	const version = pickFlowVersion(versions, preferStatus);
	if (!version?.id) {
		return { screens: [] };
	}

	const detailResponse =
		'helpers' in context && 'request' in context.helpers
			? await kapsoLoadOptionsRequest(context as ILoadOptionsFunctions, {
					api: 'platform',
					method: 'GET',
					path: `/whatsapp/flows/${encodeURIComponent(kapsoFlowId)}/versions/${encodeURIComponent(String(version.id))}`,
				})
			: await kapsoApiRequest(
					context as IExecuteFunctions,
					{
						api: 'platform',
						method: 'GET',
						path: `/whatsapp/flows/${encodeURIComponent(kapsoFlowId)}/versions/${encodeURIComponent(String(version.id))}`,
					},
					itemIndex,
				);

	const detail = ((detailResponse as IDataObject).data as IDataObject | undefined) ?? (detailResponse as IDataObject);
	const flowJson = detail.flow_json;
	const flowResponse =
		'helpers' in context && 'request' in context.helpers
			? await kapsoLoadOptionsRequest(context as ILoadOptionsFunctions, {
					api: 'platform',
					method: 'GET',
					path: `/whatsapp/flows/${encodeURIComponent(kapsoFlowId)}`,
				})
			: await kapsoApiRequest(
					context as IExecuteFunctions,
					{
						api: 'platform',
						method: 'GET',
						path: `/whatsapp/flows/${encodeURIComponent(kapsoFlowId)}`,
					},
					itemIndex,
				);
	const flowEntry = ((flowResponse as IDataObject).data as IDataObject | undefined) ?? (flowResponse as IDataObject);
	const screens = extractScreenIds(flowJson);

	return {
		screens,
		defaultScreen: extractDefaultScreen(flowJson),
		jsonVersion: String(flowEntry.json_version ?? detail.version_label ?? '').trim() || undefined,
		hasDataEndpoint: Boolean(flowEntry.has_data_endpoint),
		flowsEncryptionConfigured: Boolean(flowEntry.flows_encryption_configured),
		previewUrl: flowEntry.preview_url ? String(flowEntry.preview_url) : undefined,
		singleScreen: screens.length <= 1,
		screenCount: screens.length,
		flowJson,
	};
}

export async function resolveKapsoFlowId(
	context: ILoadOptionsFunctions,
	selection: ReturnType<typeof parseFlowSelection>,
): Promise<string | undefined> {
	if (selection.kapsoUuid) {
		return selection.kapsoUuid;
	}

	if (!selection.metaFlowId) {
		return undefined;
	}

	const phoneNumberId = readNodeParameterString(context, 'phoneNumberId');
	const response = await kapsoLoadOptionsRequest(context, {
		api: 'platform',
		method: 'GET',
		path: '/whatsapp/flows',
		query: {
			page: 1,
			per_page: 100,
			...(phoneNumberId ? { phone_number_id: phoneNumberId } : {}),
		},
	});

	const match = extractResponseData(response).find(
		(entry) => String(entry.meta_flow_id ?? '') === selection.metaFlowId,
	);

	return match?.id ? String(match.id) : undefined;
}

export async function resolveKapsoFlowIdForExecute(
	context: IExecuteFunctions,
	selection: ReturnType<typeof parseFlowSelection>,
	itemIndex: number,
): Promise<string | undefined> {
	if (selection.kapsoUuid) {
		return selection.kapsoUuid;
	}

	if (!selection.metaFlowId) {
		return undefined;
	}

	const phoneNumberId = readExecuteNodeParameterString(context, 'phoneNumberId', itemIndex);
	const collected: IDataObject[] = [];

	for (let page = 1; page <= LOAD_OPTIONS_MAX_PAGES; page += 1) {
		const response = (await kapsoApiRequest(
			context,
			{
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/flows',
				query: {
					page,
					per_page: 100,
					...(phoneNumberId ? { phone_number_id: phoneNumberId } : {}),
				},
			},
			itemIndex,
		)) as { meta?: { total_pages?: number } };

		collected.push(...extractResponseData(response));

		const totalPages = response.meta?.total_pages;
		if (typeof totalPages !== 'number' || page >= totalPages) {
			break;
		}
	}

	const match = collected.find(
		(entry) => String(entry.meta_flow_id ?? '') === selection.metaFlowId,
	);

	return match?.id ? String(match.id) : undefined;
}

export async function enrichFlowSelectionForExecute(
	context: IExecuteFunctions,
	itemIndex: number,
	selection: ParsedFlowSelection,
): Promise<ParsedFlowSelection> {
	const needsAssets =
		selection.hasDataEndpoint === undefined ||
		!selection.defaultScreen ||
		!selection.flowName;

	if (!needsAssets) {
		return selection;
	}

	const kapsoFlowId = await resolveKapsoFlowIdForExecute(context, selection, itemIndex);
	if (!kapsoFlowId) {
		return selection;
	}

	const flowOptions = context.getNodeParameter('flowOptions', itemIndex, {}) as { flowMode?: string };
	const flowMode = readFlowModeFromExecuteParameters(
		context.getNodeParameter('flowMode', itemIndex),
		flowOptions,
	);
	const preferStatus =
		flowMode === 'draft'
			? 'draft'
			: flowMode === 'published'
				? 'published'
				: selection.status === 'draft'
					? 'draft'
					: 'published';
	const assets = await fetchFlowVersionDetail(context, kapsoFlowId, preferStatus, itemIndex);

	return {
		...selection,
		hasDataEndpoint: selection.hasDataEndpoint ?? assets.hasDataEndpoint,
		defaultScreen: selection.defaultScreen || assets.defaultScreen,
		flowName: selection.flowName || undefined,
		singleScreen: selection.singleScreen ?? assets.singleScreen,
		flowsEncryptionConfigured:
			selection.flowsEncryptionConfigured ?? assets.flowsEncryptionConfigured,
	};
}

export function resolvePreferredFlowStatus(flowMode: string): 'draft' | 'published' {
	if (flowMode === 'draft') {
		return 'draft';
	}

	return 'published';
}

export async function readFlowAssets(context: ILoadOptionsFunctions) {
	const flowRaw = readNodeParameterString(context, 'flowId');
	const selection = parseFlowSelection(flowRaw);
	const kapsoFlowId = await resolveKapsoFlowId(context, selection);

	if (!kapsoFlowId) {
		requireLoadOptionsDependency(context, 'flowId', 'Flow');
	}

	const flowMode = readFlowModeFromOptions(context);
	const preferStatus =
		flowMode === 'draft'
			? 'draft'
			: flowMode === 'published'
				? 'published'
				: selection.status === 'draft'
					? 'draft'
					: 'published';

	return fetchFlowVersionDetail(context, kapsoFlowId!, preferStatus);
}

export function resolveInitialDataScreenId(
	context: ILoadOptionsFunctions,
	assets: Awaited<ReturnType<typeof readFlowAssets>>,
): string | undefined {
	const selectedScreen = readNodeParameterString(context, 'flowScreen');
	if (selectedScreen) {
		return selectedScreen;
	}

	const selection = parseFlowSelection(readNodeParameterString(context, 'flowId'));
	return selection.defaultScreen || assets.defaultScreen;
}
