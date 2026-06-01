import { describe, expect, it } from 'vitest';
import {
	asJsonItems,
	advancedComponentsJson,
	bodyJson,
	getAdvancedFixedCollectionItems,
	getAdvancedOptionBoolean,
	getAdvancedOptionString,
	getBoolean,
	getBroadcastListOptionString,
	getContactListOptionBoolean,
	getContactListOptionString,
	getConversationListOptionBoolean,
	getConversationListOptionString,
	getE164PhoneResourceLocatorValue,
	getFixedCollectionItems,
	getLinkPreview,
	getMediaSourceValue,
	getMetaPhoneResourceLocatorValue,
	getNumber,
	getOptionalJsonObject,
	getPlatformMessageListOptionString,
	getReplyToMessageId,
	getResourceParameter,
	getString,
	getValidatedMediaSourceValue,
	itemPair,
	readE164PhoneResourceLocatorValue,
	readMetaPhoneResourceLocatorValue,
	tryReadE164PhoneResourceLocatorValue,
} from '../../nodes/KapsoApi/actions/nodeHelpers';
import { ApplicationError } from 'n8n-workflow';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

describe('nodeHelpers', () => {
	it('reads meta phone resource locator values strictly', () => {
		const ef = createMockExecuteFunctions({
			recipient: { mode: 'phone', value: '15551234567', __rl: true },
		});

		expect(getMetaPhoneResourceLocatorValue(ef, 'recipient', 0, 'Recipient Phone')).toBe(
			'15551234567',
		);
		expect(readMetaPhoneResourceLocatorValue({ mode: 'phone', value: '15551234567', __rl: true }, 'User Phone')).toBe(
			'15551234567',
		);
		expect(readMetaPhoneResourceLocatorValue({ mode: 'phone', value: undefined, __rl: true }, 'User Phone')).toBe('');
	});

	it('rejects invalid meta phone resource locator values', () => {
		expect(() => readMetaPhoneResourceLocatorValue('15551234567', 'Recipient Phone')).toThrow(
			ApplicationError,
		);
		expect(() => readMetaPhoneResourceLocatorValue({ invalid: true }, 'Recipient Phone')).toThrow(
			'Recipient Phone is required.',
		);
	});

	it('reads E.164 phone resource locator values strictly', () => {
		const ef = createMockExecuteFunctions({
			contactWaId: { mode: 'phone', value: '+15551234567', __rl: true },
		});

		expect(getE164PhoneResourceLocatorValue(ef, 'contactWaId', 0, 'WhatsApp ID')).toBe(
			'+15551234567',
		);
		expect(readE164PhoneResourceLocatorValue({ mode: 'phone', value: '+15551234567', __rl: true }, 'Phone Number'),
		).toBe('+15551234567');
		expect(
			readE164PhoneResourceLocatorValue({ mode: 'phone', value: undefined, __rl: true }, 'Phone Number'),
		).toBe('');
		expect(
			tryReadE164PhoneResourceLocatorValue({ mode: 'phone', value: '', __rl: true }, 'Phone Number'),
		).toBeUndefined();
		expect(tryReadE164PhoneResourceLocatorValue(undefined, 'Phone Number')).toBeUndefined();
		expect(tryReadE164PhoneResourceLocatorValue(null, 'Phone Number')).toBeUndefined();
		expect(tryReadE164PhoneResourceLocatorValue({ invalid: true }, 'Phone Number')).toBeUndefined();
		expect(tryReadE164PhoneResourceLocatorValue('   ', 'Phone Number')).toBeUndefined();
	});

	it('rejects invalid E.164 phone resource locator values', () => {
		expect(() => readE164PhoneResourceLocatorValue('+15551234567', 'WhatsApp ID')).toThrow(
			ApplicationError,
		);
		expect(() => readE164PhoneResourceLocatorValue({ invalid: true }, 'WhatsApp ID')).toThrow(
			'WhatsApp ID is required.',
		);
		expect(() => tryReadE164PhoneResourceLocatorValue('+15551234567', 'Phone Number')).toThrow(
			ApplicationError,
		);
		expect(() => tryReadE164PhoneResourceLocatorValue('  +15551234567  ', 'Phone Number')).toThrow(
			ApplicationError,
		);
	});

	it('reads resource locator objects from node parameters', () => {
		const ef = createMockExecuteFunctions({
			conversationId: { mode: 'list', value: 'conv-rlc' },
			plainField: 'hello',
			invalidField: 42,
		});

		expect(getResourceParameter(ef, 'conversationId', 0)).toBe('conv-rlc');
		expect(getResourceParameter(ef, 'plainField', 0)).toBe('hello');
		expect(getResourceParameter(ef, 'missingField', 0)).toBe('');
		expect(getResourceParameter(ef, 'invalidField', 0)).toBe('');
	});

	it('reads resource locator values without a nested value', () => {
		const ef = createMockExecuteFunctions({
			emptyLocator: { mode: 'list' },
		});

		expect(getResourceParameter(ef, 'emptyLocator', 0)).toBe('');
	});

	it('reads fixed collection items', () => {
		const ef = createMockExecuteFunctions();

		expect(
			getFixedCollectionItems(ef, 'buttons', 'buttonValues', 0),
		).toEqual([{ buttonId: 'btn_yes', buttonTitle: 'Yes' }]);

		const emptyCollection = createMockExecuteFunctions({
			buttons: { buttonValues: 'invalid' },
		});
		expect(getFixedCollectionItems(emptyCollection, 'buttons', 'buttonValues', 0)).toEqual([]);
	});

	it('reads and validates media source values', () => {
		const linkEf = createMockExecuteFunctions({
			mediaSource: 'link',
			mediaId: 'ignored',
			headerMediaUrl: 'https://cdn.example.com/image.jpg',
		});
		expect(getMediaSourceValue(linkEf, 'mediaSource', 'mediaId', 'headerMediaUrl', 0)).toEqual({
			source: 'link',
			value: 'https://cdn.example.com/image.jpg',
		});

		const idEf = createMockExecuteFunctions({
			mediaSource: 'id',
			mediaId: '425509551842',
		});
		expect(getValidatedMediaSourceValue(idEf, 'mediaSource', 'mediaId', 'headerMediaUrl', 0, {
			id: 'Media ID',
			url: 'Media URL',
		})).toEqual({
			source: 'id',
			value: '425509551842',
		});

		const validatedLinkEf = createMockExecuteFunctions({
			mediaSource: 'link',
			headerMediaUrl: 'https://cdn.example.com/image.jpg',
		});
		expect(getValidatedMediaSourceValue(validatedLinkEf, 'mediaSource', 'mediaId', 'headerMediaUrl', 0, {
			id: 'Media ID',
			url: 'Media URL',
		})).toEqual({
			source: 'link',
			value: 'https://cdn.example.com/image.jpg',
		});
	});

	it('parses advanced option helpers', () => {
		const ef = createMockExecuteFunctions({
			advancedOptions: {
				replyToMessageId: 'wamid.parent',
				linkPreview: true,
				advancedComponentsJson: ' {"type":"body"} ',
				customHeaders: {
					headerValues: [{ name: 'X-Test', value: '1' }],
				},
			},
			contactListOptions: { includeArchived: true, status: 'open' },
			conversationListOptions: { includeClosed: false, assignee: 'me' },
			platformMessageListOptions: { direction: 'inbound' },
			broadcastListOptions: { status: 'draft' },
		});

		expect(getReplyToMessageId(ef, 0)).toBe('wamid.parent');
		expect(getLinkPreview(ef, 0, false)).toBe(true);
		expect(advancedComponentsJson(ef, 0)).toBe(' {"type":"body"} ');
		expect(getAdvancedOptionString(ef, 0, 'missing')).toBe('');
		expect(getAdvancedOptionBoolean(ef, 0, 'missing', true)).toBe(true);
		expect(getAdvancedOptionBoolean(ef, 0, 'linkPreview', false)).toBe(true);
		expect(getAdvancedFixedCollectionItems(ef, 'customHeaders', 'headerValues', 0)).toEqual([
			{ name: 'X-Test', value: '1' },
		]);
		expect(getContactListOptionString(ef, 0, 'status')).toBe('open');
		expect(getContactListOptionBoolean(ef, 0, 'includeArchived', false)).toBe(true);
		expect(getContactListOptionBoolean(ef, 0, 'missingFlag', false)).toBe(false);
		expect(getConversationListOptionString(ef, 0, 'assignee')).toBe('me');
		expect(getConversationListOptionBoolean(ef, 0, 'includeClosed', true)).toBe(false);
		expect(getPlatformMessageListOptionString(ef, 0, 'direction')).toBe('inbound');
		expect(getBroadcastListOptionString(ef, 0, 'status')).toBe('draft');
	});

	it('parses optional JSON objects', () => {
		const ef = createMockExecuteFunctions({
			bodyJson: '{"enabled":true}',
			recipientComponentsJson: '{}',
			emptyJson: '',
		});

		expect(getOptionalJsonObject(ef, 'bodyJson', 0, 'Body JSON')).toEqual({ enabled: true });
		expect(getOptionalJsonObject(ef, 'recipientComponentsJson', 0, 'Components')).toBeUndefined();
		expect(getOptionalJsonObject(ef, 'emptyJson', 0, 'Components')).toBeUndefined();
	});

	it('reads typed node parameters', () => {
		const ef = createMockExecuteFunctions({
			textBody: 'hello',
			page: 3,
		});

		expect(getString(ef, 'textBody', 0)).toBe('hello');
		expect(getNumber(ef, 'page', 0, 1)).toBe(3);
		expect(getBoolean(ef, 'typingIndicator', 0, true)).toBe(false);
	});

	it('parses top-level body JSON for admin operations', () => {
		const ef = createMockExecuteFunctions({
			bodyJson: '{"name":"Kapso"}',
		});

		expect(bodyJson(ef, 0)).toEqual({ name: 'Kapso' });
	});

	it('maps array and object responses to n8n items', () => {
		const arrayItems = asJsonItems([{ id: 1 }, { id: 2 }], 0);
		expect(arrayItems).toHaveLength(2);
		expect(arrayItems[0]).toEqual({
			json: { id: 1 },
			pairedItem: { item: 0 },
		});

		const scalarItems = asJsonItems('ok', 1);
		expect(scalarItems).toEqual([
			{
				json: { data: 'ok' },
				pairedItem: { item: 1 },
			},
		]);

		const objectItems = asJsonItems({ success: true }, 3);
		expect(objectItems[0].json).toEqual({ success: true });

		const primitiveArrayItems = asJsonItems([null, 'value'], 2);
		expect(primitiveArrayItems[0].json).toEqual({ data: null });
		expect(primitiveArrayItems[1].json).toEqual({ data: 'value' });
		expect(itemPair(4)).toEqual({ item: 4 });
	});
});
