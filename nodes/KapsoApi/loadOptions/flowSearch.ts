import { IDataObject, ILoadOptionsFunctions, INodeListSearchResult, INodePropertyOptions } from 'n8n-workflow';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	LIST_SEARCH_INITIAL_SIZE,
	requireLoadOptionsDependency,
} from './helpers';
import { encodeFlowSelection } from './flowSelection';
import {
	extractScreenDataSchema,
	fetchFlowVersionDetail,
	readFlowAssets,
	resolvePreferredFlowStatus,
} from './flowAssets';
import { readFlowModeFromOptions } from './flowModeHelpers';

function matchesFilter(entry: IDataObject, filter?: string): boolean {
	if (!filter?.trim()) {
		return true;
	}

	const haystack = `${entry.name ?? ''} ${entry.meta_flow_id ?? ''}`.toLowerCase();
	return haystack.includes(filter.trim().toLowerCase());
}

function flowLabel(entry: IDataObject): string {
	const name = String(entry.name ?? 'Flow');
	const metaFlowId = String(entry.meta_flow_id ?? '');
	const status = entry.status ? ` · ${String(entry.status)}` : '';
	return metaFlowId ? `${name}${status} (${metaFlowId})` : `${name}${status}`;
}

async function buildFlowSelectionValue(
	context: ILoadOptionsFunctions,
	entry: IDataObject,
): Promise<string> {
	const kapsoUuid = String(entry.id ?? '');
	const metaFlowId = String(entry.meta_flow_id ?? '');
	const status = String(entry.status ?? 'published');
	const flowMode = readFlowModeFromOptions(context);
	const preferStatus = resolvePreferredFlowStatus(flowMode) || (status === 'draft' ? 'draft' : 'published');

	let defaultScreen: string | undefined;
	let singleScreen = false;
	let flowsEncryptionConfigured = false;
	let previewUrl: string | undefined;
	let hasDataEndpoint: boolean | undefined;
	let hasInitialDataFields = false;
	try {
		const assets = await fetchFlowVersionDetail(
			context,
			kapsoUuid,
			preferStatus === 'draft' ? 'draft' : 'published',
		);
		defaultScreen = assets.defaultScreen;
		singleScreen = Boolean(assets.singleScreen);
		flowsEncryptionConfigured = Boolean(assets.flowsEncryptionConfigured);
		previewUrl = assets.previewUrl;
		hasDataEndpoint = assets.hasDataEndpoint;
		if (assets.flowJson && defaultScreen) {
			hasInitialDataFields = extractScreenDataSchema(assets.flowJson, defaultScreen).length > 0;
		}
	} catch {
		defaultScreen = undefined;
	}

	return encodeFlowSelection({
		kapsoUuid,
		metaFlowId,
		status,
		hasDataEndpoint: hasDataEndpoint ?? Boolean(entry.has_data_endpoint),
		defaultScreen,
		flowName: String(entry.name ?? ''),
		singleScreen,
		flowsEncryptionConfigured,
		previewUrl: previewUrl ?? (entry.preview_url ? String(entry.preview_url) : null),
		hasInitialDataFields,
	});
}

function looksLikeMetaFlowId(filter: string): boolean {
	const trimmed = filter.trim();
	return /^\d{5,}$/.test(trimmed);
}

async function fetchFlowListPage(
	context: ILoadOptionsFunctions,
	phoneNumberId: string,
	flowMode: string,
	page: number,
	filter?: string,
): Promise<{ entries: IDataObject[]; totalPages?: number }> {
	const response = await kapsoLoadOptionsRequest(context, {
		api: 'platform',
		method: 'GET',
		path: '/whatsapp/flows',
		query: {
			phone_number_id: phoneNumberId,
			page,
			per_page: LIST_SEARCH_INITIAL_SIZE,
			status: flowMode === 'draft' ? 'draft' : 'published',
			...(filter?.trim() && !looksLikeMetaFlowId(filter) ? { name_contains: filter.trim() } : {}),
		},
	});

	return {
		entries: extractResponseData(response),
		totalPages: (response as { meta?: { total_pages?: number } }).meta?.total_pages,
	};
}

export async function searchWhatsappFlows(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const phoneNumberId = requireLoadOptionsDependency(this, 'phoneNumberId', 'Phone Number');
	const flowMode = readFlowModeFromOptions(this);
	const page = paginationToken ? Number(paginationToken) : 1;
	const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

	if (filter?.trim() && looksLikeMetaFlowId(filter)) {
		const idFilter = filter.trim();
		let searchPage = 1;
		let totalPages: number | undefined;

		for (;;) {
			const pageResult = await fetchFlowListPage(this, phoneNumberId, flowMode, searchPage);
			totalPages = pageResult.totalPages;
			const match = pageResult.entries.find(
				(entry) => String(entry.meta_flow_id ?? '') === idFilter,
			);

			if (match) {
				return {
					results: [
						{
							name: flowLabel(match),
							value: await buildFlowSelectionValue(this, match),
						},
					],
				};
			}

			if (typeof totalPages !== 'number' || searchPage >= totalPages) {
				break;
			}

			searchPage += 1;
		}

		return { results: [] };
	}

	const pageResult = await fetchFlowListPage(this, phoneNumberId, flowMode, currentPage, filter);
	const entries = pageResult.entries.filter((entry) => matchesFilter(entry, filter));
	const nextPage =
		typeof pageResult.totalPages === 'number' && currentPage < pageResult.totalPages
			? String(currentPage + 1)
			: undefined;

	const results = await Promise.all(
		entries.map(async (entry) => ({
			name: flowLabel(entry),
			value: await buildFlowSelectionValue(this, entry),
		})),
	);

	return {
		results,
		paginationToken: nextPage,
	};
}

export async function getFlowScreens(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const assets = await readFlowAssets(this);
	return assets.screens.map((screenId) => ({
		name: screenId,
		value: screenId,
	}));
}

export async function getFlowActions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const assets = await readFlowAssets(this);
	const autoOption: INodePropertyOptions = {
		name: 'Auto (Detected From Flow)',
		value: '',
		description: 'Use Navigate or Data Exchange based on the selected Flow metadata',
	};

	if (assets.hasDataEndpoint) {
		return [
			autoOption,
			{ name: 'Data Exchange', value: 'data_exchange' },
			{ name: 'Navigate', value: 'navigate' },
		];
	}

	return [autoOption, { name: 'Navigate', value: 'navigate' }];
}
