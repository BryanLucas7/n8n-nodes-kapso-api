import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import {
	resolveKapsoWebhookSignature,
	verifyKapsoWebhookSignature,
} from '../../nodes/KapsoApi/trigger/signature';

describe('Kapso webhook signature verification', () => {
	const secret = 'test-webhook-secret';
	const body = { event: 'whatsapp.message.received', data: [{ id: '1' }] };

	function sign(payload: string): string {
		return createHmac('sha256', secret).update(payload).digest('hex');
	}

	it('verifies a valid signature from JSON.stringify(body)', () => {
		const payload = JSON.stringify(body);
		const signature = sign(payload);

		expect(
			verifyKapsoWebhookSignature(body, signature, secret),
		).toBe(true);
	});

	it('verifies a valid signature from raw body bytes', () => {
		const payload = JSON.stringify(body);
		const signature = sign(payload);

		expect(
			verifyKapsoWebhookSignature(body, signature, secret, Buffer.from(payload, 'utf8')),
		).toBe(true);
	});

	it('rejects missing or invalid signatures', () => {
		expect(verifyKapsoWebhookSignature(body, undefined, secret)).toBe(false);
		expect(verifyKapsoWebhookSignature(body, 'deadbeef', secret)).toBe(false);
	});

	it('reads signature headers case-insensitively', () => {
		const signature = sign(JSON.stringify(body));

		expect(
			resolveKapsoWebhookSignature({ 'x-webhook-signature': signature }),
		).toBe(signature);
		expect(
			resolveKapsoWebhookSignature({ 'X-Webhook-Signature': signature }),
		).toBe(signature);
	});
});
