import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	requireLoadOptionsDependency,
} from './helpers';
import {
	broadcastTemplateSummary,
	fetchBroadcastEntry,
	fetchBroadcastTemplateDefinitionForLoadOptions,
} from './broadcastTemplateFetch';
import { readNodeParameterString } from './resourceLocatorHelpers';

function readBroadcastId(context: ILoadOptionsFunctions): string {
	return readNodeParameterString(context, 'broadcastId');
}

export async function getBroadcastTemplateSummaryNotice(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'broadcastId', 'Broadcast');

	try {
		const definition = await fetchBroadcastTemplateDefinitionForLoadOptions(this);
		if (!definition) {
			return [{ name: 'Select a broadcast to see its template summary', value: '' }];
		}

		return [{ name: broadcastTemplateSummary(definition), value: '' }];
	} catch {
		return [{ name: 'Select a broadcast to see its template summary', value: '' }];
	}
}

export async function getBroadcastSendPreflightNotice(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	const broadcastId = readBroadcastId(this);
	if (!broadcastId) {
		return [{ name: 'Select a broadcast to see status and recipient count', value: '' }];
	}

	try {
		const entry = await fetchBroadcastEntry(this, broadcastId);
		const status = String(entry?.status ?? 'unknown');
		const totalRecipients = Number(entry?.total_recipients ?? 0);

		return [
			{
				name: `Status: ${status} · Recipients: ${Number.isFinite(totalRecipients) ? totalRecipients : 0}. Send and Schedule require draft status with at least one recipient.`,
				value: '',
			},
		];
	} catch {
		return [{ name: 'Could not load broadcast status. Reselect the broadcast or check credentials.', value: '' }];
	}
}
