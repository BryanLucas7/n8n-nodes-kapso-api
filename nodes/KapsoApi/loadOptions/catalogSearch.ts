import { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	LIST_SEARCH_INITIAL_SIZE,
	requireLoadOptionsDependency,
	resolveBusinessAccountId,
} from './helpers';
import { readNodeParameterString } from './resourceLocatorHelpers';

function matchesFilter(entry: IDataObject, filter?: string): boolean {
	if (!filter?.trim()) {
		return true;
	}

	const haystack = JSON.stringify(entry).toLowerCase();
	return haystack.includes(filter.trim().toLowerCase());
}

function catalogLabel(entry: IDataObject): string {
	const name = String(entry.name ?? 'Catalog');
	const id = String(entry.id ?? '');
	return id ? `${name} (${id})` : name;
}

function productLabel(entry: IDataObject): string {
	const name = String(entry.name ?? 'Product');
	const retailerId = String(entry.retailer_id ?? entry.retailerId ?? '');
	return retailerId ? `${name} · ${retailerId}` : name;
}

function productValue(entry: IDataObject): string {
	return String(entry.retailer_id ?? entry.retailerId ?? '');
}

async function resolveWabaId(context: ILoadOptionsFunctions): Promise<string> {
	requireLoadOptionsDependency(context, 'phoneNumberId', 'Phone Number');
	const wabaId = await resolveBusinessAccountId(context, 'phoneNumberId');
	if (!wabaId) {
		throw new Error('Could not resolve the WhatsApp Business Account for the selected phone number.');
	}
	return wabaId;
}

export async function searchCatalogs(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	await resolveWabaId(this);

	const wabaId = await resolveBusinessAccountId(this, 'phoneNumberId');
	const response = await kapsoLoadOptionsRequest(this, {
		api: 'whatsapp',
		method: 'GET',
		path: `/${encodeURIComponent(wabaId!)}/product_catalogs`,
		query: {
			limit: LIST_SEARCH_INITIAL_SIZE,
			...(paginationToken ? { after: paginationToken } : {}),
		},
	});

	const entries = extractResponseData(response).filter((entry) => matchesFilter(entry, filter));
	const after = (response as { paging?: { cursors?: { after?: string } } }).paging?.cursors?.after;

	return {
		results: entries.map((entry) => ({
			name: catalogLabel(entry),
			value: String(entry.id ?? ''),
		})),
		paginationToken: after,
	};
}

export async function searchCatalogProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const catalogId = readNodeParameterString(this, 'catalogId');
	if (!catalogId) {
		requireLoadOptionsDependency(this, 'catalogId', 'Catalog');
	}

	const response = await kapsoLoadOptionsRequest(this, {
		api: 'whatsapp',
		method: 'GET',
		path: `/${encodeURIComponent(catalogId)}/products`,
		query: {
			fields: 'retailer_id,name',
			limit: LIST_SEARCH_INITIAL_SIZE,
			...(paginationToken ? { after: paginationToken } : {}),
		},
	});

	const entries = extractResponseData(response).filter((entry) => {
		if (!productValue(entry)) {
			return false;
		}

		return matchesFilter(entry, filter);
	});
	const after = (response as { paging?: { cursors?: { after?: string } } }).paging?.cursors?.after;

	return {
		results: entries.map((entry) => ({
			name: productLabel(entry),
			value: productValue(entry),
		})),
		paginationToken: after,
	};
}
