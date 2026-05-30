import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	resolveBusinessAccountId,
	templateLabel,
	toOptions,
} from './helpers';

async function fetchApprovedTemplates(context: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const wabaId = await resolveBusinessAccountId(context);
	if (!wabaId) {
		return [];
	}

	const response = await kapsoLoadOptionsRequest(context, {
		api: 'whatsapp',
		method: 'GET',
		path: `/${encodeURIComponent(wabaId)}/message_templates`,
		query: {
			status: 'APPROVED',
			limit: 100,
		},
	});

	const entries = extractResponseData(response);

	return toOptions(
		entries,
		templateLabel,
		(entry) => String(entry.name ?? ''),
	);
}

export async function getMessageTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return fetchApprovedTemplates(this);
}
