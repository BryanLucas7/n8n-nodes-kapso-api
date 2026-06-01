import { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { kapsoApiRequest } from '../transport/request';
import { findTemplateEntry, parseTemplateDefinition, TemplateDefinition } from './templateDefinition';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	resolveBusinessAccountId,
} from './helpers';

type TemplateSelectionContext = ILoadOptionsFunctions | IExecuteFunctions;

function readNodeParameter(
	context: TemplateSelectionContext,
	parameterName: string,
	itemIndex = 0,
): string {
	if ('getCurrentNodeParameter' in context) {
		return String(context.getCurrentNodeParameter(parameterName) ?? '').trim();
	}

	return String(context.getNodeParameter(parameterName, itemIndex) ?? '').trim();
}

export async function fetchApprovedTemplateEntriesForPhone(
	context: TemplateSelectionContext,
	phoneParameterName: string,
	itemIndex = 0,
): Promise<IDataObject[]> {
	const phoneNumberId = readNodeParameter(context, phoneParameterName, itemIndex);
	if (!phoneNumberId) {
		return [];
	}

	if ('helpers' in context && 'request' in context.helpers) {
		const wabaId = await resolveBusinessAccountId(context as ILoadOptionsFunctions, phoneParameterName);
		if (!wabaId) {
			return [];
		}

		const response = await kapsoLoadOptionsRequest(context as ILoadOptionsFunctions, {
			api: 'whatsapp',
			method: 'GET',
			path: `/${encodeURIComponent(wabaId)}/message_templates`,
			query: {
				status: 'APPROVED',
				limit: 100,
			},
		});

		return extractResponseData(response);
	}

	const wabaId = await resolveBusinessAccountIdForExecute(context as IExecuteFunctions, phoneNumberId, itemIndex);
	if (!wabaId) {
		return [];
	}

	const response = await kapsoApiRequest(
		context as IExecuteFunctions,
		{
			api: 'whatsapp',
			method: 'GET',
			path: `/${encodeURIComponent(wabaId)}/message_templates`,
			query: {
				status: 'APPROVED',
				limit: 100,
			},
		},
		itemIndex,
	);

	return extractResponseData(response);
}

async function resolveBusinessAccountIdForExecute(
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
	)) as IDataObject;

	const entry = (response.data as IDataObject | undefined) ?? response;
	return String(
		entry.business_account_id ??
			entry.whatsapp_business_account_id ??
			entry.waba_id ??
			entry.businessAccountId ??
			'',
	).trim() || undefined;
}

export async function fetchSelectedTemplateDefinition(
	context: TemplateSelectionContext,
	phoneParameterName = 'phoneNumberId',
	itemIndex = 0,
): Promise<TemplateDefinition | undefined> {
	const templateName = readNodeParameter(context, 'templateName', itemIndex);
	const languageCode = readNodeParameter(context, 'languageCode', itemIndex);

	if (!templateName || !languageCode) {
		return undefined;
	}

	const entries = await fetchApprovedTemplateEntriesForPhone(context, phoneParameterName, itemIndex);
	const entry = findTemplateEntry(entries, templateName, languageCode);

	return entry ? parseTemplateDefinition(entry) : undefined;
}
