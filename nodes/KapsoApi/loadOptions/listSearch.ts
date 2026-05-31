import { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	LIST_SEARCH_INITIAL_SIZE,
} from './helpers';

function parsePageToken(paginationToken?: string): number {
	if (!paginationToken) {
		return 1;
	}

	const page = Number(paginationToken);
	return Number.isFinite(page) && page > 0 ? page : 1;
}

function nextPageToken(currentPage: number, totalPages?: number): string | undefined {
	if (typeof totalPages !== 'number' || currentPage >= totalPages) {
		return undefined;
	}

	return String(currentPage + 1);
}

function matchesFilter(entry: IDataObject, filter?: string): boolean {
	if (!filter?.trim()) {
		return true;
	}

	const haystack = JSON.stringify(entry).toLowerCase();
	return haystack.includes(filter.trim().toLowerCase());
}

function digitsOnly(value: string): string {
	return value.replace(/\D/g, '');
}

function looksLikePhoneFilter(filter: string): boolean {
	const compact = filter.replace(/\s/g, '');
	const digits = digitsOnly(compact);

	return digits.length >= 3 && digits.length >= compact.replace(/^\+/, '').length * 0.7;
}

function buildContactSearchQuery(filter?: string): IDataObject {
	if (!filter?.trim()) {
		return {};
	}

	const trimmed = filter.trim();

	if (looksLikePhoneFilter(trimmed)) {
		return { wa_id_contains: digitsOnly(trimmed) };
	}

	return { profile_name_contains: trimmed };
}

function buildConversationSearchQuery(filter?: string): IDataObject {
	if (!filter?.trim()) {
		return {};
	}

	const trimmed = filter.trim();

	if (looksLikePhoneFilter(trimmed)) {
		return { phone_number: digitsOnly(trimmed) };
	}

	return { phone_number: trimmed };
}

function conversationLabel(entry: IDataObject): string {
	const id = String(entry.id ?? '');
	const phone = String(entry.phone_number ?? entry.contact_phone_number ?? entry.phone ?? '');
	const status = entry.status ? ` · ${String(entry.status)}` : '';

	if (phone) {
		return `${phone}${status} (${id})`;
	}

	return id;
}

function contactLabel(entry: IDataObject): string {
	const id = String(entry.id ?? entry.uuid ?? entry.contact_id ?? '');
	const name = String(entry.name ?? entry.display_name ?? entry.full_name ?? 'Contact');
	const phone = String(entry.phone_number ?? entry.phone ?? entry.wa_id ?? '');

	if (phone) {
		return `${name} · ${phone} (${id})`;
	}

	return `${name} (${id})`;
}

function broadcastLabel(entry: IDataObject): string {
	const id = String(entry.id ?? '');
	const name = String(entry.name ?? entry.title ?? 'Broadcast');
	const status = entry.status ? ` · ${String(entry.status)}` : '';

	return `${name}${status} (${id})`;
}

function contactValue(entry: IDataObject): string {
	const id = entry.id ?? entry.uuid ?? entry.contact_id;

	return id ? String(id) : '';
}

async function searchCursorResource(
	context: ILoadOptionsFunctions,
	path: string,
	labelFn: (entry: IDataObject) => string,
	valueFn: (entry: IDataObject) => string,
	filter?: string,
	paginationToken?: string,
	query: IDataObject = {},
	filterQuery: IDataObject = {},
): Promise<INodeListSearchResult> {
	const usesServerFilter = Object.keys(filterQuery).length > 0;
	const response = await kapsoLoadOptionsRequest(context, {
		api: 'platform',
		method: 'GET',
		path,
		query: {
			...query,
			...filterQuery,
			limit: LIST_SEARCH_INITIAL_SIZE,
			...(paginationToken ? { after: paginationToken } : {}),
		},
	});

	const entries = extractResponseData(response).filter((entry) => {
		if (!valueFn(entry)) {
			return false;
		}

		return usesServerFilter ? true : matchesFilter(entry, filter);
	});
	const after = (response as { paging?: { cursors?: { after?: string } } }).paging?.cursors?.after;

	return {
		results: entries.map((entry) => ({
			name: labelFn(entry),
			value: valueFn(entry),
		})),
		paginationToken: after,
	};
}

async function searchPaginatedResource(
	context: ILoadOptionsFunctions,
	path: string,
	labelFn: (entry: IDataObject) => string,
	valueFn: (entry: IDataObject) => string,
	filter?: string,
	paginationToken?: string,
	query: IDataObject = {},
): Promise<INodeListSearchResult> {
	const page = parsePageToken(paginationToken);
	const response = await kapsoLoadOptionsRequest(context, {
		api: 'platform',
		method: 'GET',
		path,
		query: {
			...query,
			page,
			per_page: LIST_SEARCH_INITIAL_SIZE,
		},
	});

	const entries = extractResponseData(response).filter((entry) => matchesFilter(entry, filter));
	const totalPages = (response as { meta?: { total_pages?: number } }).meta?.total_pages;

	return {
		results: entries.map((entry) => ({
			name: labelFn(entry),
			value: valueFn(entry),
		})),
		paginationToken: nextPageToken(page, totalPages),
	};
}

export async function searchConversations(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const phoneNumberId = this.getCurrentNodeParameter('phoneNumberId') as string | undefined;
	const query: IDataObject = {};

	if (phoneNumberId) {
		query.phone_number_id = phoneNumberId;
	}

	return searchCursorResource(
		this,
		'/whatsapp/conversations',
		conversationLabel,
		(entry) => String(entry.id ?? ''),
		filter,
		paginationToken,
		query,
		buildConversationSearchQuery(filter),
	);
}

export async function searchContacts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return searchCursorResource(
		this,
		'/whatsapp/contacts',
		contactLabel,
		contactValue,
		filter,
		paginationToken,
		{},
		buildContactSearchQuery(filter),
	);
}

export async function searchBroadcasts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return searchPaginatedResource(
		this,
		'/whatsapp/broadcasts',
		broadcastLabel,
		(entry) => String(entry.id ?? ''),
		filter,
		paginationToken,
	);
}
