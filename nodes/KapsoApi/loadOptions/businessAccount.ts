import { ApplicationError, IExecuteFunctions, ILoadOptionsFunctions, NodeOperationError } from 'n8n-workflow';
import { kapsoApiRequest } from '../transport/request';
import { businessAccountIdFromEntry, kapsoLoadOptionsRequest } from './helpers';

export async function resolveBusinessAccountIdForExecute(
	context: IExecuteFunctions,
	phoneNumberId: string,
	itemIndex: number,
): Promise<string | undefined> {
	const response = (await kapsoApiRequest(
		context,
		{
			api: 'platform',
			method: 'GET',
			path: `/whatsapp/phone_numbers/${encodeURIComponent(phoneNumberId)}`,
		},
		itemIndex,
	)) as Record<string, unknown>;

	const entry = (response.data as Record<string, unknown> | undefined) ?? response;
	return businessAccountIdFromEntry(entry as never) || undefined;
}

export async function requireBusinessAccountIdForLoadOptions(
	context: ILoadOptionsFunctions,
	phoneParameterName = 'phoneNumberId',
): Promise<string> {
	const phoneNumberId = context.getCurrentNodeParameter(phoneParameterName) as string | undefined;
	if (!phoneNumberId?.trim()) {
		throw new NodeOperationError(context.getNode(), 'Select Phone Number first to resolve the WABA.', {
			level: 'warning',
		});
	}

	const response = (await kapsoLoadOptionsRequest(context, {
		api: 'platform',
		method: 'GET',
		path: `/whatsapp/phone_numbers/${encodeURIComponent(phoneNumberId.trim())}`,
	})) as Record<string, unknown>;

	const entry = (response.data as Record<string, unknown> | undefined) ?? response;
	const wabaId = businessAccountIdFromEntry(entry as never);

	if (!wabaId) {
		throw new NodeOperationError(
			context.getNode(),
			'Could not resolve WABA from the selected phone number. Check the phone number in Kapso Dashboard.',
			{ level: 'warning' },
		);
	}

	return wabaId;
}

export async function requireBusinessAccountIdForExecute(
	context: IExecuteFunctions,
	phoneNumberId: string,
	itemIndex: number,
): Promise<string> {
	const wabaId = await resolveBusinessAccountIdForExecute(context, phoneNumberId, itemIndex);

	if (!wabaId) {
		throw new ApplicationError(
			'Could not resolve WABA from the selected phone number. Check the phone number in Kapso Dashboard.',
		);
	}

	return wabaId;
}
