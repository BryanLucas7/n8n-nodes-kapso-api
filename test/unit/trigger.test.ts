import { createHmac } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import { IWebhookFunctions } from 'n8n-workflow';
import { KAPSO_WEBHOOK_EVENTS } from '../../nodes/KapsoApi/trigger/events';
import {
	expandKapsoWebhookPayload,
	makeKapsoWebhookHandler,
	resolveKapsoWebhookEvent,
} from '../../nodes/KapsoApi/trigger/trigger';

const WEBHOOK_SECRET = 'test-webhook-secret';

function signBody(body: Record<string, unknown>): string {
	return createHmac('sha256', WEBHOOK_SECRET)
		.update(JSON.stringify(body))
		.digest('hex');
}

function createWebhookContext(
	body: Record<string, unknown>,
	headers: Record<string, string> = {},
): IWebhookFunctions {
	return {
		getBodyData: () => body,
		getHeaderData: () => headers,
		getCredentials: vi.fn().mockResolvedValue({ webhookSecret: WEBHOOK_SECRET }),
		getRequestObject: () => ({ rawBody: Buffer.from(JSON.stringify(body), 'utf8') }),
	} as unknown as IWebhookFunctions;
}

describe('Kapso webhook trigger routing', () => {
	it('resolves event type from header or body fallback', () => {
		expect(
			resolveKapsoWebhookEvent(
				{ 'x-webhook-event': 'whatsapp.message.received' },
				{},
			),
		).toBe('whatsapp.message.received');

		expect(
			resolveKapsoWebhookEvent(
				{ 'X-Webhook-Event': ['whatsapp.message.delivered'] },
				{},
			),
		).toBe('whatsapp.message.delivered');

		expect(resolveKapsoWebhookEvent({}, { type: 'whatsapp.message.sent' })).toBe(
			'whatsapp.message.sent',
		);

		expect(resolveKapsoWebhookEvent({}, { event: 'whatsapp.conversation.created' })).toBe(
			'whatsapp.conversation.created',
		);

		expect(resolveKapsoWebhookEvent({}, {})).toBeUndefined();
	});

	it('expands batch webhook payloads', () => {
		expect(expandKapsoWebhookPayload({ data: [{ id: 1 }, { id: 2 }] })).toEqual([
			{ id: 1 },
			{ id: 2 },
		]);
		expect(expandKapsoWebhookPayload({ id: 1 })).toEqual([{ id: 1 }]);
	});

	it('routes items to the matching output only', async () => {
		const handler = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
		const body = {
			data: [{ message: { id: 'wamid.1' }, phone_number_id: '123' }],
		};
		const webhookContext = createWebhookContext(body, {
			'x-webhook-event': 'whatsapp.message.received',
			'x-webhook-signature': signBody(body),
		});

		const response = await handler.call(webhookContext);

		expect(response.workflowData).toHaveLength(KAPSO_WEBHOOK_EVENTS.length);
		expect(response.workflowData?.[0]).toEqual([
			{
				json: {
					message: { id: 'wamid.1' },
					phone_number_id: '123',
					kapso_event: 'whatsapp.message.received',
				},
			},
		]);
		expect(response.workflowData?.[1]).toEqual([]);
	});

	it('routes unknown events to the Other Event output', async () => {
		const handler = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
		const body = { message: { id: 'wamid.1' } };
		const webhookContext = createWebhookContext(body, {
			'x-webhook-event': 'whatsapp.phone_number.created',
			'x-webhook-signature': signBody(body),
		});

		const response = await handler.call(webhookContext);
		const otherOutputIndex = KAPSO_WEBHOOK_EVENTS.length - 1;

		expect(response.workflowData?.[otherOutputIndex]).toEqual([
			{
				json: {
					message: { id: 'wamid.1' },
					kapso_event: 'whatsapp.phone_number.created',
				},
			},
		]);
	});

	it('rejects webhooks when credential webhook secret is missing', async () => {
		const handler = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
		const body = { message: { id: 'wamid.1' } };
		const webhookContext = {
			getBodyData: () => body,
			getHeaderData: () => ({
				'x-webhook-event': 'whatsapp.message.received',
				'x-webhook-signature': signBody(body),
			}),
			getCredentials: vi.fn().mockResolvedValue({ webhookSecret: '' }),
			getRequestObject: () => ({ rawBody: Buffer.from(JSON.stringify(body), 'utf8') }),
		} as unknown as IWebhookFunctions;

		const response = await handler.call(webhookContext);

		expect(response.webhookResponse).toEqual({
			statusCode: 500,
			body: 'Webhook Secret is required on the Kapso API credential.',
		});
	});

	it('rejects webhooks with invalid signatures', async () => {
		const handler = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
		const body = { message: { id: 'wamid.1' } };
		const webhookContext = createWebhookContext(body, {
			'x-webhook-event': 'whatsapp.message.received',
			'x-webhook-signature': 'invalid',
		});

		const response = await handler.call(webhookContext);

		expect(response.webhookResponse).toEqual({
			statusCode: 401,
			body: 'Invalid webhook signature',
		});
	});

	it('returns empty workflow data when event type is missing', async () => {
		const handler = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
		const body = { message: { id: 'wamid.1' } };
		const webhookContext = createWebhookContext(body, {
			'x-webhook-signature': signBody(body),
		});

		const response = await handler.call(webhookContext);

		expect(response.workflowData?.every((output) => output.length === 0)).toBe(true);
	});

	it('rejects webhooks when credential secret is undefined', async () => {
		const handler = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
		const body = { message: { id: 'wamid.1' } };
		const webhookContext = {
			getBodyData: () => body,
			getHeaderData: () => ({
				'x-webhook-event': 'whatsapp.message.received',
				'x-webhook-signature': signBody(body),
			}),
			getCredentials: vi.fn().mockResolvedValue({}),
			getRequestObject: () => ({ rawBody: Buffer.from(JSON.stringify(body), 'utf8') }),
		} as unknown as IWebhookFunctions;

		const response = await handler.call(webhookContext);

		expect(response.webhookResponse?.statusCode).toBe(500);
	});
});
