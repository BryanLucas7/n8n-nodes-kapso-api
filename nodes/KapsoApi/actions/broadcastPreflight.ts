import { ApplicationError, IExecuteFunctions } from 'n8n-workflow';
import { kapsoApiRequest } from '../transport/request';
import { extractBroadcastUuid } from '../loadOptions/broadcastSelection';
import { getString } from './nodeHelpers';

type BroadcastPreflight = {
	status: string;
	totalRecipients: number;
};

export async function fetchBroadcastPreflight(
	ef: IExecuteFunctions,
	broadcastId: string,
	itemIndex: number,
): Promise<BroadcastPreflight> {
	const response = (await kapsoApiRequest(
		ef,
		{
			api: 'platform',
			method: 'GET',
			path: `/whatsapp/broadcasts/${encodeURIComponent(broadcastId)}`,
		},
		itemIndex,
	)) as { data?: Record<string, unknown> };

	const data = response.data ?? {};
	const status = String(data.status ?? '').trim().toLowerCase();
	const totalRecipients = Number(data.total_recipients ?? 0);

	return {
		status,
		totalRecipients: Number.isFinite(totalRecipients) ? totalRecipients : 0,
	};
}

export async function assertBroadcastDraftForRecipients(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<void> {
	const broadcastId = extractBroadcastUuid(getString(ef, 'broadcastId', itemIndex));
	const preflight = await fetchBroadcastPreflight(ef, broadcastId, itemIndex);

	if (preflight.status !== 'draft') {
		throw new ApplicationError(
			`Broadcast must be in draft status before adding recipients (current status: ${preflight.status || 'unknown'}).`,
		);
	}
}

export async function assertBroadcastReadyToSend(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<void> {
	const broadcastId = extractBroadcastUuid(getString(ef, 'broadcastId', itemIndex));
	const preflight = await fetchBroadcastPreflight(ef, broadcastId, itemIndex);

	if (preflight.status !== 'draft') {
		throw new ApplicationError(
			`Broadcast must be in draft status before sending or scheduling (current status: ${preflight.status || 'unknown'}).`,
		);
	}

	if (preflight.totalRecipients <= 0) {
		throw new ApplicationError(
			'Broadcast has no recipients. Use Add Recipients before Send or Schedule.',
		);
	}
}

export async function assertBroadcastScheduledForCancel(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<void> {
	const broadcastId = extractBroadcastUuid(getString(ef, 'broadcastId', itemIndex));
	const preflight = await fetchBroadcastPreflight(ef, broadcastId, itemIndex);

	if (preflight.status !== 'scheduled') {
		throw new ApplicationError(
			`Broadcast must be scheduled before cancel (current status: ${preflight.status || 'unknown'}).`,
		);
	}
}
