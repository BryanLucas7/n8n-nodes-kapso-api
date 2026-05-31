import { createHmac, timingSafeEqual } from 'crypto';
import { IDataObject } from 'n8n-workflow';

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
	if (Array.isArray(value)) {
		return value[0];
	}

	return value;
}

export function resolveKapsoWebhookSignature(
	headerData: IDataObject,
): string | undefined {
	return (
		normalizeHeaderValue(headerData['x-webhook-signature'] as string | string[] | undefined) ??
		normalizeHeaderValue(headerData['X-Webhook-Signature'] as string | string[] | undefined)
	);
}

function serializeWebhookPayload(body: IDataObject, rawBody?: Buffer | string): string {
	if (rawBody !== undefined) {
		return Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
	}

	return JSON.stringify(body);
}

export function verifyKapsoWebhookSignature(
	body: IDataObject,
	signature: string | undefined,
	secret: string,
	rawBody?: Buffer | string,
): boolean {
	if (!signature?.trim()) {
		return false;
	}

	const expectedSignature = createHmac('sha256', secret)
		.update(serializeWebhookPayload(body, rawBody))
		.digest('hex');

	const provided = Buffer.from(signature.trim());
	const expected = Buffer.from(expectedSignature);

	if (provided.length !== expected.length) {
		return false;
	}

	return timingSafeEqual(provided, expected);
}
