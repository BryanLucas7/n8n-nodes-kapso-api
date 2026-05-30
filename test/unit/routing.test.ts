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
} from '../../nodes/KapsoApi/actions/routing';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

const PHONE = TEST_PHONE_NUMBER_ID;
const CONV = 'conv-1';
const CONTACT = 'contact-1';
const BROADCAST = 'broadcast-1';
const MEDIA = 'media-1';
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
	'message:sendButtons': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendList': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendContact': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendTemplate': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendReaction': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:markRead': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:sendRaw': { api: 'whatsapp', method: 'POST', path: `/${PHONE}/messages` },
	'message:list': { api: 'whatsapp', method: 'GET', path: `/${PHONE}/messages` },
	'message:get': {
		api: 'whatsapp',
		method: 'GET',
		path: `/${PHONE}/messages/${encodeURIComponent(MESSAGE)}`,
	},
	'media:uploadFromUrl': { api: 'platform', method: 'POST', path: '/whatsapp/media' },
	'media:getUrl': { api: 'whatsapp', method: 'GET', path: `/${MEDIA}` },
	'media:download': { api: 'mediaDownload', method: 'GET', path: '/media_download' },
	'media:delete': { api: 'whatsapp', method: 'DELETE', path: `/${MEDIA}` },
	'conversation:get': { api: 'platform', method: 'GET', path: `/whatsapp/conversations/${CONV}` },
	'conversation:updateStatus': {
		api: 'platform',
		method: 'PATCH',
		path: `/whatsapp/conversations/${CONV}`,
	},
	'contact:get': { api: 'platform', method: 'GET', path: `/whatsapp/contacts/${CONTACT}` },
	'contact:create': { api: 'platform', method: 'POST', path: '/whatsapp/contacts' },
	'contact:update': { api: 'platform', method: 'PATCH', path: `/whatsapp/contacts/${CONTACT}` },
	'contact:erase': { api: 'platform', method: 'DELETE', path: `/whatsapp/contacts/${CONTACT}` },
	'broadcast:get': { api: 'platform', method: 'GET', path: `/whatsapp/broadcasts/${BROADCAST}` },
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
			messageListDirection: 'outbound',
			messageResponseFields: 'kapso(direction,status)',
		});

		const request = buildRequest(ef, 'message', 'list', 0);

		expect(request.query).toEqual({
			direction: 'outbound',
			fields: 'kapso(direction,status)',
		});
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
			conversationId: { mode: 'list', value: 'conv-locator' },
		});

		const request = buildRequest(ef, 'conversation', 'get', 0);

		expect(request.path).toBe('/whatsapp/conversations/conv-locator');
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
		expect(() => customRelativePath('https://api.kapso.ai/platform')).toThrow(/must be relative/);
	});
});
