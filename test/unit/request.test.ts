import { describe, expect, it, vi } from 'vitest';
import {
	buildKapsoRequestOptions,
	joinUrl,
	DEFAULT_KAPSO_BASE_URL,
	trimSlashes,
	getKapsoCredentials,
	kapsoApiRequest,
} from '../../nodes/KapsoApi/transport/request';
import { buildPaginationQuery } from '../../nodes/KapsoApi/transport/pagination';
import { normalizeKapsoError } from '../../nodes/KapsoApi/transport/errors';
import { NodeApiError } from 'n8n-workflow';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const credentials = {
	baseUrl: DEFAULT_KAPSO_BASE_URL,
	apiKey: 'test-api-key',
};

describe('Kapso request builder', () => {
	it('trims slashes and joins urls without a scheme', () => {
		expect(trimSlashes('/platform/v1/')).toBe('platform/v1');
		expect(joinUrl('api.kapso.ai', 'platform/v1', 'whatsapp')).toBe('api.kapso.ai/platform/v1/whatsapp');
	});

	it('joins URLs without duplicate slashes', () => {
		expect(joinUrl('https://api.kapso.ai/', '/platform/v1/', '/whatsapp/phone_numbers')).toBe(
			'https://api.kapso.ai/platform/v1/whatsapp/phone_numbers',
		);
	});

	it('builds Platform API URLs with X-API-Key and query parameters', () => {
		const options = buildKapsoRequestOptions(credentials, {
			api: 'platform',
			method: 'GET',
			path: '/whatsapp/phone_numbers',
			query: {
				page: 2,
				per_page: 50,
				empty: '',
			},
		});

		expect(options.uri).toBe('https://api.kapso.ai/platform/v1/whatsapp/phone_numbers');
		expect(options.headers?.['X-API-Key']).toBe('test-api-key');
		expect(options.headers?.Accept).toBe('application/json');
		expect(options.qs).toEqual({ page: 2, per_page: 50 });
	});

	it('builds Meta WhatsApp API URLs and JSON bodies', () => {
		const options = buildKapsoRequestOptions(credentials, {
			api: 'whatsapp',
			method: 'POST',
			path: '/123/messages',
			body: {
				messaging_product: 'whatsapp',
				to: '15551234567',
				type: 'text',
			},
		});

		expect(options.uri).toBe('https://api.kapso.ai/meta/whatsapp/v24.0/123/messages');
		expect(options.body).toEqual({
			messaging_product: 'whatsapp',
			to: '15551234567',
			type: 'text',
		});
		expect(options.headers?.['Content-Type']).toBe('application/json');
	});

	it('does not send X-API-Key to signed media download URLs', () => {
		const options = buildKapsoRequestOptions(credentials, {
			api: 'mediaDownload',
			method: 'GET',
			path: '/media_download',
			query: {
				token: 'signed-token',
			},
			requiresAuth: false,
			json: false,
			encoding: null,
		});

		expect(options.uri).toBe('https://api.kapso.ai/meta/whatsapp/media_download');
		expect(options.headers).not.toHaveProperty('X-API-Key');
		expect(options.qs).toEqual({ token: 'signed-token' });
		expect(options.encoding).toBeNull();
	});

	it('builds multipart upload options without forcing JSON content-type', () => {
		const file = Buffer.from('binary');
		const options = buildKapsoRequestOptions(credentials, {
			api: 'whatsapp',
			method: 'POST',
			path: '/123/media',
			formData: {
				messaging_product: 'whatsapp',
				file: {
					value: file,
					options: {
						filename: 'test.png',
						contentType: 'image/png',
					},
				},
			},
		});

		expect(options.headers).not.toHaveProperty('Content-Type');
		expect(options.formData).toEqual({
			messaging_product: 'whatsapp',
			file: {
				value: file,
				options: {
					filename: 'test.png',
					contentType: 'image/png',
				},
			},
		});
	});

	it('supports full response resolution and empty credential fallbacks', async () => {
		const options = buildKapsoRequestOptions(
			{ baseUrl: '', apiKey: '' },
			{
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/phone_numbers',
				returnFullResponse: true,
			},
		);

		expect(options.uri).toBe(`${DEFAULT_KAPSO_BASE_URL}/platform/v1/whatsapp/phone_numbers`);
		expect(options.resolveWithFullResponse).toBe(true);
		expect(options.headers?.['X-API-Key']).toBe('');

		const ef = createMockExecuteFunctions();
		ef.helpers.request = vi.fn().mockRejectedValue({ statusCode: 500, message: 'boom' });

		await expect(
			kapsoApiRequest(ef, { api: 'platform', method: 'GET', path: '/whatsapp/phone_numbers' }, 0),
		).rejects.toBeInstanceOf(NodeApiError);
	});

	it('reads Kapso credentials with defaults', async () => {
		const ef = createMockExecuteFunctions();
		ef.getCredentials = vi.fn().mockResolvedValue({ baseUrl: '', apiKey: '' });

		await expect(getKapsoCredentials(ef)).resolves.toEqual({
			baseUrl: DEFAULT_KAPSO_BASE_URL,
			apiKey: '',
		});
	});
});

describe('Kapso pagination query', () => {
	it('adds page and per_page while keeping documented filters', () => {
		expect(
			buildPaginationQuery(
				{
					status: 'connected',
					name_contains: 'Support',
				},
				3,
				25,
			),
		).toEqual({
			status: 'connected',
			name_contains: 'Support',
			page: 3,
			per_page: 25,
		});
	});
});

describe('Kapso error normalization', () => {
	it.each([400, 401, 403, 404, 429, 500])('normalizes HTTP %s errors', (statusCode) => {
		const normalized = normalizeKapsoError({
			statusCode,
			error: {
				message: 'Failure from Kapso',
			},
		});

		expect(normalized.httpCode).toBe(String(statusCode));
		expect(normalized.message).toBe(`Kapso API error ${statusCode}: Failure from Kapso`);
	});
});
