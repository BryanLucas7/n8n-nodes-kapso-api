import { describe, expect, it } from 'vitest';
import {
	buildButtonsMessage,
	buildContactMessage,
	buildListMessage,
	buildMarkReadMessage,
	buildMediaMessage,
	buildReactionMessage,
	buildTemplateMessage,
	buildTemplateMessageFromParams,
	buildTextMessage,
} from '../../nodes/KapsoApi/actions/messagePayloads';
import { parseJsonObject, parseJsonValue } from '../../nodes/KapsoApi/transport/json';

describe('Kapso message payload builders', () => {
	it('builds Meta-compatible text payloads with optional reply context', () => {
		expect(buildTextMessage('15551234567', 'Hello', true)).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'text',
			text: {
				preview_url: true,
				body: 'Hello',
			},
		});

		expect(buildTextMessage('15551234567', 'Hello', false, 'wamid.parent')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'text',
			text: {
				preview_url: false,
				body: 'Hello',
			},
			context: {
				message_id: 'wamid.parent',
			},
		});
	});

	it('builds media payloads with document filenames and reply context', () => {
		expect(
			buildMediaMessage(
				'15551234567',
				'document',
				'id',
				'media-id',
				'Invoice attached',
				'invoice.pdf',
				'wamid.parent',
			),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'document',
			document: {
				id: 'media-id',
				caption: 'Invoice attached',
				filename: 'invoice.pdf',
			},
			context: {
				message_id: 'wamid.parent',
			},
		});
	});

	it('builds button and list interactive payloads', () => {
		expect(
			buildButtonsMessage('15551234567', 'Pick one', [
				{ buttonId: 'yes', buttonTitle: 'Yes' },
				{ buttonId: 'no', buttonTitle: 'No' },
			], 'Header', 'Footer'),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'interactive',
			interactive: {
				type: 'button',
				body: { text: 'Pick one' },
				header: { type: 'text', text: 'Header' },
				footer: { text: 'Footer' },
				action: {
					buttons: [
						{ type: 'reply', reply: { id: 'yes', title: 'Yes' } },
						{ type: 'reply', reply: { id: 'no', title: 'No' } },
					],
				},
			},
		});

		expect(
			buildListMessage(
				'15551234567',
				'Choose delivery',
				'View options',
				[
					{
						sectionTitle: 'Delivery',
						rows: [
							{ rowId: 'standard', rowTitle: 'Standard', rowDescription: '3-5 days' },
						],
					},
				],
				'Footer',
			),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'interactive',
			interactive: {
				type: 'list',
				body: { text: 'Choose delivery' },
				footer: { text: 'Footer' },
				action: {
					button: 'View options',
					sections: [
						{
							title: 'Delivery',
							rows: [
								{
									id: 'standard',
									title: 'Standard',
									description: '3-5 days',
								},
							],
						},
					],
				},
			},
		});
	});

	it('builds contact payloads', () => {
		expect(
			buildContactMessage('15551234567', [
				{
					formattedName: 'John Doe',
					firstName: 'John',
					lastName: 'Doe',
					phoneNumber: '+15559876543',
					phoneType: 'MOBILE',
					email: 'john@example.com',
					organization: 'Kapso',
					url: 'https://kapso.ai',
				},
			]),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'contacts',
			contacts: [
				{
					name: {
						formatted_name: 'John Doe',
						first_name: 'John',
						last_name: 'Doe',
					},
					phones: [{ phone: '+15559876543', type: 'MOBILE' }],
					emails: [{ email: 'john@example.com', type: 'WORK' }],
					org: { company: 'Kapso' },
					urls: [{ url: 'https://kapso.ai', type: 'WORK' }],
				},
			],
		});
	});

	it('builds template payloads from parameters and raw components', () => {
		expect(
			buildTemplateMessageFromParams(
				'15551234567',
				'order_confirmation',
				'en_US',
				['Jessica'],
				'Order update',
				[{ buttonText: 'Track' }],
			),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'template',
			template: {
				name: 'order_confirmation',
				language: { code: 'en_US' },
				components: [
					{
						type: 'header',
						parameters: [{ type: 'text', text: 'Order update' }],
					},
					{
						type: 'body',
						parameters: [{ type: 'text', text: 'Jessica' }],
					},
					{
						type: 'button',
						sub_type: 'quick_reply',
						index: '0',
						parameters: [{ type: 'text', text: 'Track' }],
					},
				],
			},
		});

		expect(
			buildTemplateMessage(
				'15551234567',
				'order_confirmation',
				'en_US',
				'[{"type":"body","parameters":[{"type":"text","text":"Jessica"}]}]',
			),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'template',
			template: {
				name: 'order_confirmation',
				language: { code: 'en_US' },
				components: [
					{
						type: 'body',
						parameters: [{ type: 'text', text: 'Jessica' }],
					},
				],
			},
		});
	});

	it('builds reaction and mark-read payloads', () => {
		expect(buildReactionMessage('15551234567', 'wamid.123', '👍')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'reaction',
			reaction: {
				message_id: 'wamid.123',
				emoji: '👍',
			},
		});

		expect(buildMarkReadMessage('wamid.123', true)).toEqual({
			messaging_product: 'whatsapp',
			status: 'read',
			message_id: 'wamid.123',
			typing_indicator: { type: 'text' },
		});
	});
});

describe('Kapso JSON helpers', () => {
	it('parses JSON objects and values', () => {
		expect(parseJsonObject('{"fields":"id,name"}', 'Query JSON')).toEqual({
			fields: 'id,name',
		});
		expect(parseJsonValue('[{"type":"body"}]', 'Components JSON')).toEqual([
			{ type: 'body' },
		]);
	});

	it('rejects invalid JSON', () => {
		expect(() => parseJsonObject('{bad', 'Body JSON')).toThrow('Body JSON must be valid JSON');
	});
});
