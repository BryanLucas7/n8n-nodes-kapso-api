import { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	extractResponseData,
	kapsoLoadOptionsRequest,
	requireLoadOptionsDependency,
	resolveBusinessAccountId,
	templateLabel,
	toOptions,
} from './helpers';
import { encodeMessageTemplateValue } from './templateSelection';

function templateIdValue(entry: IDataObject): string {
	return String(entry.id ?? entry.meta_template_id ?? '');
}

function broadcastTemplateLabel(entry: IDataObject): string {
	const id = templateIdValue(entry);
	const base = templateLabel(entry);
	return id ? `${base} (${id})` : base;
}

async function fetchApprovedTemplateEntries(
	context: ILoadOptionsFunctions,
	phoneParameterName: string,
): Promise<IDataObject[]> {
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

	return extractResponseData(response);
}

async function fetchApprovedTemplates(
	context: ILoadOptionsFunctions,
	phoneParameterName: string,
	valueFn: (entry: IDataObject) => string,
	labelFn: (entry: IDataObject) => string,
): Promise<INodePropertyOptions[]> {
	const entries = await fetchApprovedTemplateEntries(context, phoneParameterName);

	return toOptions(entries, labelFn, valueFn);
}

export async function getMessageTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'phoneNumberId', 'a phone number');

	return fetchApprovedTemplates(
		this,
		'phoneNumberId',
		(entry) => encodeMessageTemplateValue(entry),
		templateLabel,
	);
}

export async function getBroadcastTemplates(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'broadcastPhoneNumberId', 'a phone number');

	return fetchApprovedTemplates(this, 'broadcastPhoneNumberId', templateIdValue, broadcastTemplateLabel);
}

export async function getTemplateLanguages(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'phoneNumberId', 'a phone number');
	const templateName = requireLoadOptionsDependency(this, 'templateName', 'a template');

	const entries = await fetchApprovedTemplateEntries(this, 'phoneNumberId');
	const languages = [
		...new Set(
			entries
				.filter((entry) => String(entry.name ?? '') === templateName)
				.map((entry) => String(entry.language ?? entry.language_code ?? ''))
				.filter(Boolean),
		),
	].sort();

	return languages.map((language) => ({
		name: language,
		value: language,
	}));
}
