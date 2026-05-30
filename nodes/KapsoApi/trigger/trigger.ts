import {
	IDataObject,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeExecutionData,
} from 'n8n-workflow';
import type { KapsoWebhookEvent } from './events';

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
	if (Array.isArray(value)) {
		return value[0];
	}

	return value;
}

export function resolveKapsoWebhookEvent(
	headerData: IDataObject,
	body: IDataObject,
): string | undefined {
	const headerEvent =
		normalizeHeaderValue(headerData['x-webhook-event'] as string | string[] | undefined) ??
		normalizeHeaderValue(headerData['X-Webhook-Event'] as string | string[] | undefined);

	if (headerEvent) {
		return headerEvent;
	}

	if (typeof body.type === 'string' && body.type) {
		return body.type;
	}

	if (typeof body.event === 'string' && body.event) {
		return body.event;
	}

	return undefined;
}

export function expandKapsoWebhookPayload(body: IDataObject): IDataObject[] {
	if (Array.isArray(body.data)) {
		return body.data as IDataObject[];
	}

	return [body];
}

export function makeKapsoWebhookHandler(events: readonly KapsoWebhookEvent[]) {
	return async function webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headerData = this.getHeaderData();
		const eventType = resolveKapsoWebhookEvent(headerData, body);
		const outputIndex = events.findIndex((event) => event.value === eventType);
		const payloads = expandKapsoWebhookPayload(body);

		const items: INodeExecutionData[] = payloads.map((payload) => ({
			json: {
				...payload,
				kapso_event: eventType,
			},
		}));

		const workflowData: INodeExecutionData[][] = events.map(() => []);

		if (outputIndex >= 0) {
			workflowData[outputIndex] = items;
		}

		return {
			workflowData,
		};
	};
}
