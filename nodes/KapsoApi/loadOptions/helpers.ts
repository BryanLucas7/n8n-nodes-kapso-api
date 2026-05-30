import { IDataObject, ILoadOptionsFunctions, INodePropertyOptions, NodeApiError } from 'n8n-workflow';
import { buildKapsoRequestOptions, getKapsoCredentials } from '../transport/request';
import { KapsoListResponse, KapsoRequestArgs } from '../transport/types';
import { normalizeKapsoError } from '../transport/errors';

export const LOAD_OPTIONS_PAGE_SIZE = 100;
export const LOAD_OPTIONS_MAX_PAGES = 10;
export const LIST_SEARCH_INITIAL_SIZE = 5;

export async function kapsoLoadOptionsRequest(
	context: ILoadOptionsFunctions,
	args: KapsoRequestArgs,
): Promise<unknown> {
	const credentials = await getKapsoCredentials(context);
	const options = buildKapsoRequestOptions(credentials, args);

	try {
		return await context.helpers.request(options);
	} catch (error) {
		throw new NodeApiError(context.getNode(), normalizeKapsoError(error) as never);
	}
}

export function extractResponseData(response: unknown): IDataObject[] {
	if (!response || typeof response !== 'object') {
		return [];
	}

	const record = response as IDataObject;

	if (Array.isArray(record.data)) {
		return record.data as IDataObject[];
	}

	if (Array.isArray(response)) {
		return response as IDataObject[];
	}

	return [];
}

export async function fetchListPage(
	context: ILoadOptionsFunctions,
	baseArgs: KapsoRequestArgs,
	page: number,
	perPage: number,
): Promise<IDataObject[]> {
	const response = (await kapsoLoadOptionsRequest(context, {
		...baseArgs,
		query: {
			...(baseArgs.query ?? {}),
			page,
			per_page: perPage,
		},
	})) as KapsoListResponse;

	return extractResponseData(response);
}

export async function fetchAllListData(
	context: ILoadOptionsFunctions,
	baseArgs: KapsoRequestArgs,
): Promise<IDataObject[]> {
	const collected: IDataObject[] = [];

	for (let page = 1; page <= LOAD_OPTIONS_MAX_PAGES; page += 1) {
		const response = (await kapsoLoadOptionsRequest(context, {
			...baseArgs,
			query: {
				...(baseArgs.query ?? {}),
				page,
				per_page: LOAD_OPTIONS_PAGE_SIZE,
			},
		})) as KapsoListResponse;

		const entries = extractResponseData(response);
		collected.push(...entries);

		const totalPages = response.meta?.total_pages;
		if (typeof totalPages !== 'number' || page >= totalPages) {
			break;
		}
	}

	return collected;
}

export function toOptions(
	entries: IDataObject[],
	labelFn: (entry: IDataObject) => string,
	valueFn: (entry: IDataObject) => string,
): INodePropertyOptions[] {
	const options: INodePropertyOptions[] = [];

	for (const entry of entries) {
		const value = valueFn(entry);
		if (!value) {
			continue;
		}

		options.push({
			name: labelFn(entry),
			value,
		});
	}

	return options;
}

export function businessAccountIdFromEntry(entry: IDataObject): string {
	return String(
		entry.business_account_id ??
			entry.whatsapp_business_account_id ??
			entry.waba_id ??
			entry.businessAccountId ??
			'',
	);
}

export async function resolveBusinessAccountId(
	context: ILoadOptionsFunctions,
	phoneParameterName = 'phoneNumberId',
): Promise<string | undefined> {
	const phoneNumberId = context.getCurrentNodeParameter(phoneParameterName) as
		| string
		| undefined;
	if (!phoneNumberId) {
		return undefined;
	}

	const response = (await kapsoLoadOptionsRequest(context, {
		api: 'platform',
		method: 'GET',
		path: `/whatsapp/phone_numbers/${encodeURIComponent(phoneNumberId)}`,
	})) as IDataObject;

	const entry = (response.data as IDataObject | undefined) ?? response;
	return businessAccountIdFromEntry(entry);
}

export function templateLabel(entry: IDataObject): string {
	const name = String(entry.name ?? 'Template');
	const language = String(entry.language ?? entry.language_code ?? '');
	const status = String(entry.status ?? 'APPROVED');

	return `${name} · ${language} · ${status}`;
}
