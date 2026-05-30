import { describe, expect, it, vi } from 'vitest';
import { IWebhookFunctions } from 'n8n-workflow';
import { KAPSO_WEBHOOK_EVENTS } from '../../nodes/KapsoApi/trigger/events';
import {
	expandKapsoWebhookPayload,
	makeKapsoWebhookHandler,
	resolveKapsoWebhookEvent,
} from '../../nodes/KapsoApi/trigger/trigger';

describe('Kapso webhook trigger routing', () => {
	it('resolves event type from header or body fallback', () => {
		expect(
			resolveKapsoWebhookEvent(
				{ 'x-webhook-event': 'whatsapp.message.received' },
				{},
			),
		).toBe('whatsapp.message.received');

		expect(resolveKapsoWebhookEvent({}, { type: 'whatsapp.message.sent' })).toBe(
			'whatsapp.message.sent',
		);

		expect(resolveKapsoWebhookEvent({}, { event: 'whatsapp.conversation.created' })).toBe(
			'whatsapp.conversation.created',
		);
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
		const webhookContext = {
			getBodyData: () => ({
				data: [{ message: { id: 'wamid.1' }, phone_number_id: '123' }],
			}),
			getHeaderData: () => ({ 'x-webhook-event': 'whatsapp.message.received' }),
		} as unknown as IWebhookFunctions;

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

	it('returns empty outputs for unknown events', async () => {
		const handler = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
		const webhookContext = {
			getBodyData: () => ({ message: { id: 'wamid.1' } }),
			getHeaderData: () => ({ 'x-webhook-event': 'whatsapp.phone_number.created' }),
		} as unknown as IWebhookFunctions;

		const response = await handler.call(webhookContext);

		expect(response.workflowData?.every((output) => output.length === 0)).toBe(true);
	});
});
