import { describe, expect, it } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import {
	CUSTOM_API_CALL,
	operationOptionsByResource,
} from '../../nodes/KapsoApi/actions/operations';
import {
	buildRequest,
	customRelativePath,
	pathId,
	resolveWhatsappCustomPath,
} from '../../nodes/KapsoApi/actions/routing';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

const PHONE = TEST_PHONE_NUMBER_ID;
const CONV = '550e8400-e29b-41d4-a716-446655440000';
const CONTACT = 'contact-1';
const BROADCAST = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const MEDIA = '425509551842';
const MESSAGE = 'wamid.test';

const ROUTING_EXPECTATIONS: Record<
	string,
	{ api: 'platform' | 'whatsapp' | 'mediaDownload'; method: string; path: string }
> = {
	'message:sendText': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendImage': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendVideo': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendAudio': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendDocument': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendSticker': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendLocation': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:requestLocation': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendButtons': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendList': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendCtaUrl': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendProduct': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendProductList': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendCatalog': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendFlow': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendCallPermission': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendContact': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendReaction': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:markRead': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:list': { api: 'whatsapp', method: 'GET', path: `/${PHONE}/messages` },
	'message:get': {
		api: 'whatsapp',
		method: 'GET',
		path: `/${PHONE}/messages/${encodeURIComponent(MESSAGE)}`,
	},
	'platformMessage:list': { api: 'platform', method: 'GET', path: '/whatsapp/messages' },
	'platformMessage:get': {
		api: 'platform',
		method: 'GET',
		path: `/whatsapp/messages/${encodeURIComponent(MESSAGE)}`,
	},
	'media:uploadFromUrl': { api: 'platform', method: 'POST', path: '/whatsapp/media' },
	'media:getUrl': { api: 'whatsapp', method: 'GET', path: `/${MEDIA}` },
	'media:download': { api: 'mediaDownload', method: 'GET', path: '/media_download' },
	'media:delete': { api: 'whatsapp', method: 'DELETE', path: `/${MEDIA}` },
	'conversation:get': { api: 'platform', method: 'GET', path: `/whatsapp/conversations/${CONV}` },
	'conversation:list': { api: 'platform', method: 'GET', path: '/whatsapp/conversations' },
	'conversation:updateStatus': {
		api: 'platform',
		method: 'PATCH',
		path: `/whatsapp/conversations/${CONV}`,
	},
	'contact:get': { api: 'platform', method: 'GET', path: `/whatsapp/contacts/${CONTACT}` },
	'contact:list': { api: 'platform', method: 'GET', path: '/whatsapp/contacts' },
	'contact:create': { api: 'platform', method: 'POST', path: '/whatsapp/contacts' },
	'contact:update': { api: 'platform', method: 'PATCH', path: `/whatsapp/contacts/${CONTACT}` },
	'contact:erase': { api: 'platform', method: 'DELETE', path: `/whatsapp/contacts/${CONTACT}` },
	'broadcast:get': { api: 'platform', method: 'GET', path: `/whatsapp/broadcasts/${BROADCAST}` },
	'broadcast:list': { api: 'platform', method: 'GET', path: '/whatsapp/broadcasts' },
	'broadcast:create': { api: 'platform', method: 'POST', path: '/whatsapp/broadcasts' },
	'broadcast:addRecipients': {
		api: 'platform',
		method: 'POST',
		path: `/whatsapp/broadcasts/${BROADCAST}/recipients`,
	},
	'broadcast:listRecipients': {
		api: 'platform',
		method: 'GET',
		path: `/whatsapp/broadcasts/${BROADCAST}/recipients`,
	},
	'broadcast:send': { api: 'platform', method: 'POST', path: `/whatsapp/broadcasts/${BROADCAST}/send` },
	'broadcast:schedule': {
		api: 'platform',
		method: 'POST',
		path: `/whatsapp/broadcasts/${BROADCAST}/schedule`,
	},
	'broadcast:cancel': {
		api: 'platform',
		method: 'POST',
		path: `/whatsapp/broadcasts/${BROADCAST}/cancel`,
	},
	'blockUser:block': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/block_users` },
	'blockUser:unblock': { api: 'whatsapp', method: 'DELETE', path: `/${PHONE}/block_users` },
};

describe('routing', () => {
	for (const [resource, options] of Object.entries(operationOptionsByResource)) {
		for (const option of options) {
			const operation = String(option.value);
			const key = `${resource}:${operation}`;

			if (resource === 'media' && operation === 'uploadBinary') {
				continue;
			}

			if (resource === 'message' && operation === 'sendTemplate') {
				continue;
			}

			if (resource === CUSTOM_API_CALL) {
				continue;
			}

			it(`builds ${key}`, () => {
				const ef = createMockExecuteFunctions({ resource, operation });
				const request = buildRequest(ef, resource, operation, 0);
				const expected = ROUTING_EXPECTATIONS[key];

				expect(expected, `missing expectation for ${key}`).toBeDefined();
				expect(request.api).toBe(expected.api);
				expect(request.method).toBe(expected.method);
				expect(request.path).toBe(expected.path);
				expect(request.path.startsWith('/')).toBe(true);
			});
		}
	}

	it('builds broadcast send and cancel without request body', () => {
		const sendRequest = buildRequest(
			createMockExecuteFunctions({ resource: 'broadcast', operation: 'send' }),
			'broadcast',
			'send',
			0,
		);
		const cancelRequest = buildRequest(
			createMockExecuteFunctions({ resource: 'broadcast', operation: 'cancel' }),
			'broadcast',
			'cancel',
			0,
		);

		expect(sendRequest.body).toBeUndefined();
		expect(cancelRequest.body).toBeUndefined();
	});

	it('builds message list query from dedicated filter fields', () => {
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'list',
			advancedOptions: {
				messageListDirection: 'outbound',
			},
		});

		const request = buildRequest(ef, 'message', 'list', 0);

		expect(request.query).toEqual({
			direction: 'outbound',
			fields: 'kapso()',
		});
	});

	it('prefixes WhatsApp custom API paths with the selected phone number', () => {
		const ef = createMockExecuteFunctions({
			resource: CUSTOM_API_CALL,
			operation: CUSTOM_API_CALL,
			customMethod: 'POST',
			customApiSurface: 'whatsapp',
			customPath: '/messages',
			phoneNumberId: PHONE,
			bodyJson: '{"type":"text","text":{"body":"Hi"}}',
		});

		const request = buildRequest(ef, CUSTOM_API_CALL, CUSTOM_API_CALL, 0);

		expect(request.path).toBe(`/${PHONE}/messages`);
	});

	it('requires phone number for WhatsApp custom API paths that need prefixing', () => {
		const ef = createMockExecuteFunctions({
			resource: CUSTOM_API_CALL,
			operation: CUSTOM_API_CALL,
			customMethod: 'POST',
			customApiSurface: 'whatsapp',
			customPath: '/messages',
			phoneNumberId: '',
			bodyJson: '{"type":"text","text":{"body":"Hi"}}',
		});

		expect(() => buildRequest(ef, CUSTOM_API_CALL, CUSTOM_API_CALL, 0)).toThrow(
			/Phone Number is required/,
		);
	});

	it('builds custom API GET requests without body', () => {
		const ef = createMockExecuteFunctions({
			resource: CUSTOM_API_CALL,
			operation: CUSTOM_API_CALL,
			customMethod: 'GET',
			customApiSurface: 'platform',
			customPath: '/whatsapp/contacts',
		});

		const request = buildRequest(ef, CUSTOM_API_CALL, CUSTOM_API_CALL, 0);

		expect(request.body).toBeUndefined();
	});

	it('builds custom API call requests', () => {
		const ef = createMockExecuteFunctions({
			resource: CUSTOM_API_CALL,
			operation: CUSTOM_API_CALL,
			customMethod: 'PATCH',
			customApiSurface: 'whatsapp',
			customPath: 'whatsapp/phone_numbers/123',
			bodyJson: '{"status":"connected"}',
		});

		const request = buildRequest(ef, CUSTOM_API_CALL, CUSTOM_API_CALL, 0);

		expect(request).toMatchObject({
			api: 'whatsapp',
			method: 'PATCH',
			path: '/whatsapp/phone_numbers/123',
			body: { status: 'connected' },
		});
	});

	it('extracts resource locator values in paths', () => {
		const ef = createMockExecuteFunctions({
			resource: 'conversation',
			operation: 'get',
			conversationId: { mode: 'list', value: CONV, __rl: true },
		});

		const request = buildRequest(ef, 'conversation', 'get', 0);

		expect(request.path).toBe(`/whatsapp/conversations/${encodeURIComponent(CONV)}`);
	});

	it('rejects unsupported resource and operation pairs', () => {
		const ef = createMockExecuteFunctions();

		expect(() => buildRequest(ef, 'unknown', 'list', 0)).toThrow(ApplicationError);
		expect(() => buildRequest(ef, 'unknown', 'list', 0)).toThrow(
			/Operation list for resource unknown is not supported/,
		);
	});

	it('validates path identifiers and custom relative paths', () => {
		expect(pathId('abc', 'ID')).toBe('abc');
		expect(() => pathId('', 'ID')).toThrow(/ID is required/);
		expect(customRelativePath('whatsapp/contacts')).toBe('/whatsapp/contacts');
		expect(resolveWhatsappCustomPath(PHONE, '/messages')).toBe(`/${PHONE}/messages`);
		expect(() => customRelativePath('https://api.kapso.ai/platform')).toThrow(/must be relative/);
		expect(() => customRelativePath('../whatsapp/contacts')).toThrow(/\.\./);
	});
});
