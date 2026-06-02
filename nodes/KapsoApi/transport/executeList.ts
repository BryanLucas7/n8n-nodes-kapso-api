import { IExecuteFunctions } from 'n8n-workflow';
import { resourcesWithCursorPagination, resourcesWithPagination } from '../actions/operations';
import { kapsoApiRequest } from './request';
import { KapsoRequestArgs } from './types';
import {
	requestCursorListAll,
	requestPaginated,
	RETURN_ALL_FETCH_LIMIT,
} from './pagination';

type ExecuteListOptions = {
	returnAll: boolean;
	page: number;
	perPage: number;
};

export async function executeListOperation(
	ef: IExecuteFunctions,
	opKey: string,
	requestArgs: KapsoRequestArgs,
	itemIndex: number,
	options: ExecuteListOptions,
): Promise<unknown> {
	const { returnAll, page, perPage } = options;

	if (resourcesWithCursorPagination.includes(opKey)) {
		const listQuery = {
			...(requestArgs.query ?? {}),
			limit: perPage,
		};

		return returnAll
			? await requestCursorListAll(
					ef,
					{
						...requestArgs,
						query: listQuery,
					},
					perPage,
					itemIndex,
				)
			: await kapsoApiRequest(
					ef,
					{
						...requestArgs,
						query: listQuery,
					},
					itemIndex,
				);
	}

	if (resourcesWithPagination.includes(opKey)) {
		return requestPaginated(
			ef,
			{
				...requestArgs,
				query: {
					...(requestArgs.query ?? {}),
					page,
					per_page: perPage,
				},
			},
			returnAll,
			perPage,
			itemIndex,
		);
	}

	return kapsoApiRequest(ef, requestArgs, itemIndex);
}

export { RETURN_ALL_FETCH_LIMIT };
