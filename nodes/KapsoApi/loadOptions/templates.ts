import { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	resolveBusinessAccountId,
	templateLabel,
	toOptions,
} from './helpers';

function templateIdValue(entry: IDataObject): string {
	return String(entry.id ?? entry.meta_template_id ?? '');
}

function broadcastTemplateLabel(entry: IDataObject): string {
	const id = templateIdValue(entry);
	const base = templateLabel(entry);
	return id ? `${base} (${id})` : base;
}

async function fetchApprovedTemplates(
	context: ILoadOptionsFunctions,
	phoneParameterName: string,
	valueFn: (entry: IDataObject) => string,
	labelFn: (entry: IDataObject) => string,
): Promise<INodePropertyOptions[]> {
	const wabaId = await resolveBusinessAccountId(context, phoneParameterName);
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

	return toOptions(entries, labelFn, valueFn);
}

export async function getMessageTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return fetchApprovedTemplates(
		this,
		'phoneNumberId',
		(entry) => String(entry.name ?? ''),
		templateLabel,
	);
}

export async function getBroadcastTemplates(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return fetchApprovedTemplates(this, 'broadcastPhoneNumberId', templateIdValue, broadcastTemplateLabel);
}
