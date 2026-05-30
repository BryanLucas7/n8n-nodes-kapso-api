import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { kapsoApiRequest } from './request';
import { cleanObject } from './json';
import { KapsoListResponse, KapsoRequestArgs } from './types';

export function buildPaginationQuery(
	query: IDataObject,
	returnAll: boolean,
	page: number,
	perPage: number,
): IDataObject {
	if (returnAll) {
		return cleanObject({ ...query, page, per_page: perPage });
	}

	return cleanObject({ ...query, page, per_page: perPage });
}

function responseHasNextPage(response: KapsoListResponse, currentPage: number): boolean {
	const totalPages = response.meta?.total_pages;

	return typeof totalPages === 'number' && currentPage < totalPages;
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
				query: buildPaginationQuery(baseArgs.query ?? {}, true, page, perPage),
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
