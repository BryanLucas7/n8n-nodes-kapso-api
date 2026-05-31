import {
	IDataObject,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeExecutionData,
} from 'n8n-workflow';
import type { KapsoWebhookEvent } from './events';
import { KAPSO_WEBHOOK_UNKNOWN_EVENT } from './events';
import {
	resolveKapsoWebhookSignature,
	verifyKapsoWebhookSignature,
} from './signature';

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
		const credentials = await this.getCredentials('kapsoApi');
		const webhookSecret = String(credentials.webhookSecret ?? '').trim();

		if (!webhookSecret) {
			return {
				webhookResponse: {
					statusCode: 500,
					body: 'Webhook Secret is required on the Kapso API credential.',
				},
			};
		}

		const signature = resolveKapsoWebhookSignature(headerData);
		const request = this.getRequestObject() as { rawBody?: Buffer | string };
		const isValid = verifyKapsoWebhookSignature(
			body,
			signature,
			webhookSecret,
			request.rawBody,
		);

		if (!isValid) {
			return {
				webhookResponse: {
					statusCode: 401,
					body: 'Invalid webhook signature',
				},
			};
		}

		const eventType = resolveKapsoWebhookEvent(headerData, body);
		const knownEventValues = events
			.map((event) => event.value)
			.filter((value) => value !== KAPSO_WEBHOOK_UNKNOWN_EVENT);
		const outputIndex = knownEventValues.findIndex((value) => value === eventType);
		const unknownOutputIndex = events.findIndex(
			(event) => event.value === KAPSO_WEBHOOK_UNKNOWN_EVENT,
		);
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
		} else if (eventType && unknownOutputIndex >= 0) {
			workflowData[unknownOutputIndex] = items;
		}

		return {
			workflowData,
		};
	};
}
