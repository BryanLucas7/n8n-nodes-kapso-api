import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { kapsoApiRequest } from './request';
import { cleanObject } from './json';
import { KapsoListResponse, KapsoRequestArgs } from './types';

export function buildPaginationQuery(
	query: IDataObject,
	page: number,
	perPage: number,
): IDataObject {
	return cleanObject({ ...query, page, per_page: perPage });
}

function responseHasNextPage(response: KapsoListResponse, currentPage: number): boolean {
	const totalPages = response.meta?.total_pages;

	return typeof totalPages === 'number' && currentPage < totalPages;
}

type CursorListResponse = {
	data?: IDataObject[];
	paging?: {
		cursors?: {
			after?: string;
		};
	};
};

export const CURSOR_LIST_MAX_PAGES = 100;
export const RETURN_ALL_FETCH_LIMIT = 100;

export async function requestCursorListAll(
	ef: IExecuteFunctions,
	baseArgs: KapsoRequestArgs,
	limit: number,
	itemIndex: number,
): Promise<unknown> {
	const collected: IDataObject[] = [];
	let after: string | undefined;
	const seenCursors = new Set<string>();
	let pageCount = 0;

	for (;;) {
		const query = cleanObject({
			...(baseArgs.query ?? {}),
			limit,
			...(after ? { after } : {}),
		});

		const response = (await kapsoApiRequest(
			ef,
			{
				...baseArgs,
				query,
			},
			itemIndex,
		)) as CursorListResponse;

		if (Array.isArray(response.data)) {
			collected.push(...response.data);
		}

		const nextAfter = response.paging?.cursors?.after;
		if (!nextAfter) {
			break;
		}

		if (seenCursors.has(nextAfter) || pageCount >= CURSOR_LIST_MAX_PAGES) {
			break;
		}

		seenCursors.add(nextAfter);
		after = nextAfter;
		pageCount += 1;
	}

	return {
		data: collected,
		meta: {
			returned: collected.length,
			paginated: true,
		},
	};
}

export async function requestMessageListAll(
	ef: IExecuteFunctions,
	baseArgs: KapsoRequestArgs,
	limit: number,
	itemIndex: number,
): Promise<unknown> {
	return requestCursorListAll(ef, baseArgs, limit, itemIndex);
}

export async function requestPaginated(
	ef: IExecuteFunctions,
	baseArgs: KapsoRequestArgs,
	returnAll: boolean,
	perPage: number,
	itemIndex: number,
): Promise<unknown> {
	if (!returnAll) {
		return kapsoApiRequest(ef, baseArgs, itemIndex);
	}

	const collected: unknown[] = [];
	let page = 1;

	for (;;) {
		const response = (await kapsoApiRequest(
			ef,
			{
				...baseArgs,
				query: buildPaginationQuery(baseArgs.query ?? {}, page, perPage),
			},
			itemIndex,
		)) as KapsoListResponse;

		if (Array.isArray(response.data)) {
			collected.push(...response.data);
		} else {
			collected.push(response);
		}

		if (!responseHasNextPage(response, page)) {
			break;
		}

		page += 1;
	}

	return {
		data: collected,
		meta: {
			returned: collected.length,
			paginated: true,
		},
	};
}
