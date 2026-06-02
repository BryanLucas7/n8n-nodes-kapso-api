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

type WebhookRequestObject = {
	rawBody?: Buffer | string;
	body?: unknown;
};

export function resolveKapsoWebhookBody(
	parsedBody: IDataObject,
	request: WebhookRequestObject,
): {
	body: IDataObject;
	rawBody?: Buffer | string;
	isEmpty: boolean;
	parseError?: string;
} {
	let body = parsedBody;
	let rawBody = request.rawBody;
	let parseError: string | undefined;

	if (Object.keys(body ?? {}).length > 0) {
		return {
			body,
			rawBody,
			isEmpty: false,
		};
	}

	if (rawBody !== undefined) {
		const rawText = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
		const trimmed = rawText.trim();

		if (!trimmed) {
			return { body, rawBody, isEmpty: true };
		}

		try {
			const fromRaw = JSON.parse(trimmed) as unknown;
			if (typeof fromRaw === 'object' && fromRaw !== null && !Array.isArray(fromRaw)) {
				body = fromRaw as IDataObject;
			} else {
				return {
					body,
					rawBody,
					isEmpty: true,
					parseError: 'Webhook body must be a JSON object.',
				};
			}
		} catch {
			return {
				body,
				rawBody,
				isEmpty: true,
				parseError: 'Webhook body is not valid JSON.',
			};
		}
	} else {
		const fallbackBody = request.body;
		if (typeof fallbackBody === 'string' && fallbackBody.trim()) {
			try {
				const fromString = JSON.parse(fallbackBody) as unknown;
				if (typeof fromString === 'object' && fromString !== null && !Array.isArray(fromString)) {
					body = fromString as IDataObject;
					rawBody = fallbackBody;
				} else {
					parseError = 'Webhook body must be a JSON object.';
				}
			} catch {
				parseError = 'Webhook body is not valid JSON.';
			}
		} else if (fallbackBody && typeof fallbackBody === 'object' && !Array.isArray(fallbackBody)) {
			body = fallbackBody as IDataObject;
			rawBody = JSON.stringify(fallbackBody);
		}
	}

	const isEmpty = Object.keys(body ?? {}).length === 0;

	return {
		body,
		rawBody,
		isEmpty,
		...(isEmpty && parseError ? { parseError } : {}),
	};
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
		const request = this.getRequestObject() as WebhookRequestObject;
		const { body, rawBody, isEmpty, parseError } = resolveKapsoWebhookBody(
			this.getBodyData() as IDataObject,
			request,
		);
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
		const isValid = verifyKapsoWebhookSignature(
			body,
			signature,
			webhookSecret,
			rawBody,
		);

		if (!isValid) {
			return {
				webhookResponse: {
					statusCode: 401,
					body: 'Invalid webhook signature',
				},
			};
		}

		if (isEmpty) {
			return {
				webhookResponse: {
					statusCode: 400,
					body:
						parseError ??
						'Empty webhook body. Kapso could not parse the request payload.',
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
