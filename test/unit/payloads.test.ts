import { describe, expect, it } from 'vitest';
import {
	buildCallPermissionMessage,
	buildButtonsMessage,
	buildCatalogMessage,
	buildContactMessage,
	buildCtaUrlMessage,
	buildFlowMessage,
	buildListMessage,
	buildLocationMessage,
	buildMarkReadMessage,
	buildMediaMessage,
	buildProductListMessage,
	buildProductMessage,
	buildReactionMessage,
	buildRequestLocationMessage,
	buildStickerMessage,
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

		expect(
			buildMediaMessage('15551234567', 'audio', 'id', 'audio-id', undefined, undefined, undefined, true),
		).toMatchObject({
			type: 'audio',
			audio: {
				id: 'audio-id',
				voice: true,
			},
		});
	});

	it('builds button and list interactive payloads', () => {
		expect(
			buildButtonsMessage('15551234567', 'Pick one', [
				{ buttonId: 'yes', buttonTitle: 'Yes' },
				{ buttonId: 'no', buttonTitle: 'No' },
			], 'text', 'Header', 'link', undefined, undefined, undefined, 'Footer'),
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
					phones: {
						phoneValues: [{ phoneNumber: '+15559876543', phoneType: 'MOBILE' }],
					},
					emails: {
						emailValues: [{ email: 'john@example.com', emailType: 'WORK' }],
					},
					organization: 'Kapso',
					urls: {
						urlValues: [{ url: 'https://kapso.ai', urlType: 'WORK' }],
					},
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

	it('builds contact payloads with multiple phones, emails, urls, and addresses', () => {
		expect(
			buildContactMessage('15551234567', [
				{
					formattedName: 'Jane Smith',
					phones: {
						phoneValues: [
							{ phoneNumber: '+15551111111', phoneType: 'MOBILE', waId: '15551111111' },
							{ phoneNumber: '+15552222222', phoneType: 'WORK' },
						],
					},
					emails: {
						emailValues: [
							{ email: 'jane@work.com', emailType: 'WORK' },
							{ email: 'jane@home.com', emailType: 'HOME' },
						],
					},
					urls: {
						urlValues: [{ url: 'https://kapso.ai', urlType: 'WORK' }],
					},
					organization: 'Kapso',
					orgDepartment: 'Engineering',
					orgTitle: 'Lead',
					addresses: {
						addressValues: [
							{
								street: '1 Main St',
								city: 'SF',
								state: 'CA',
								zip: '94105',
								country: 'USA',
								countryCode: 'US',
								addressType: 'WORK',
							},
						],
					},
				},
			]),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'contacts',
			contacts: [
				{
					name: { formatted_name: 'Jane Smith' },
					phones: [
						{ phone: '+15551111111', type: 'MOBILE', wa_id: '15551111111' },
						{ phone: '+15552222222', type: 'WORK' },
					],
					emails: [
						{ email: 'jane@work.com', type: 'WORK' },
						{ email: 'jane@home.com', type: 'HOME' },
					],
					urls: [{ url: 'https://kapso.ai', type: 'WORK' }],
					org: { company: 'Kapso', department: 'Engineering', title: 'Lead' },
					addresses: [
						{
							type: 'WORK',
							street: '1 Main St',
							city: 'SF',
							state: 'CA',
							zip: '94105',
							country: 'USA',
							country_code: 'US',
						},
					],
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
				{
					headerType: 'text',
					headerText: 'Order update',
					bodyParameters: [{ parameterText: 'Jessica' }],
					buttonParameters: [
						{ buttonSubType: 'quick_reply', buttonIndex: 0, buttonText: 'Track' },
					],
				},
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

describe('Kapso extended message payload builders', () => {
	it('builds location, sticker, and location request payloads', () => {
		expect(buildLocationMessage('15551234567', 37.7749, -122.4194, 'Office', '123 Market St')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'location',
			location: {
				latitude: 37.7749,
				longitude: -122.4194,
				name: 'Office',
				address: '123 Market St',
			},
		});

		expect(buildStickerMessage('15551234567', 'id', '798882015472548')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'sticker',
			sticker: { id: '798882015472548' },
		});

		expect(buildRequestLocationMessage('15551234567', 'Share your location')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'interactive',
			interactive: {
				type: 'location_request_message',
				body: { text: 'Share your location' },
				action: { name: 'send_location' },
			},
		});
	});

	it('builds CTA URL and catalog payloads', () => {
		expect(
			buildCtaUrlMessage(
				'15551234567',
				'Tap below',
				'Open',
				'https://example.com',
				'text',
				'Header',
				undefined,
				'Footer',
			),
		).toMatchObject({
			type: 'interactive',
			interactive: {
				type: 'cta_url',
				header: { type: 'text', text: 'Header' },
				action: {
					name: 'cta_url',
					parameters: {
						display_text: 'Open',
						url: 'https://example.com',
					},
				},
			},
		});

		expect(buildCatalogMessage('15551234567', 'Browse our catalog', 'SKU_THUMB')).toMatchObject({
			type: 'interactive',
			interactive: {
				type: 'catalog_message',
				action: {
					name: 'catalog_message',
					parameters: {
						thumbnail_product_retailer_id: 'SKU_THUMB',
					},
				},
			},
		});
	});

	it('builds product and flow payloads', () => {
		expect(buildProductMessage('15551234567', 'CATALOG_ID', 'SKU_1234', 'Optional body')).toMatchObject({
			interactive: {
				type: 'product',
				action: {
					catalog_id: 'CATALOG_ID',
					product_retailer_id: 'SKU_1234',
				},
			},
		});

		expect(
			buildProductListMessage('15551234567', 'CATALOG_ID', 'Choose a product', [
				{
					sectionTitle: 'Popular',
					productRetailerIds: ['SKU_1', 'SKU_2'],
				},
			], 'text', 'Header', 'link', undefined, undefined, undefined, 'Footer'),
		).toMatchObject({
			interactive: {
				type: 'product_list',
				header: { type: 'text', text: 'Header' },
				action: {
					catalog_id: 'CATALOG_ID',
					sections: [
						{
							title: 'Popular',
							product_items: [
								{ product_retailer_id: 'SKU_1' },
								{ product_retailer_id: 'SKU_2' },
							],
						},
					],
				},
			},
		});

		expect(() =>
			buildProductListMessage('15551234567', 'CATALOG_ID', 'Choose a product', [
				{ sectionTitle: 'Popular', productRetailerIds: ['SKU_1'] },
			], 'none'),
		).toThrow('Product list messages require a valid header.');

		expect(
			buildFlowMessage(
				'15551234567',
				'Book now',
				'Book Now',
				'token-abc',
				'3',
				'navigate',
				'WELCOME',
				{ order_id: '42' },
				undefined,
				undefined,
				undefined,
				undefined,
				'link',
				undefined,
				undefined,
				undefined,
				undefined,
				'123456789',
			),
		).toMatchObject({
			interactive: {
				type: 'flow',
				action: {
					name: 'flow',
					parameters: {
						flow_id: '123456789',
						flow_cta: 'Book Now',
						flow_action: 'navigate',
						flow_action_payload: {
							screen: 'WELCOME',
							data: { order_id: '42' },
						},
					},
				},
			},
		});

		expect(
			buildFlowMessage(
				'15551234567',
				'Book now',
				'Book Now',
				'token-abc',
				'3',
				'navigate',
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				'link',
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				'appointment_booking',
			),
		).toMatchObject({
			interactive: {
				action: {
					parameters: {
						flow_name: 'appointment_booking',
					},
				},
			},
		});
	});

	it('builds call permission payloads', () => {
		expect(buildCallPermissionMessage('15551234567', 'May we call you?')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'interactive',
			interactive: {
				type: 'call_permission_request',
				body: { text: 'May we call you?' },
				action: { name: 'call_permission_request' },
			},
		});
	});

	it('rejects interactive payloads that exceed Meta limits', () => {
		expect(() =>
			buildButtonsMessage('15551234567', 'Pick one', [
				{ buttonId: '1', buttonTitle: 'One' },
				{ buttonId: '2', buttonTitle: 'Two' },
				{ buttonId: '3', buttonTitle: 'Three' },
				{ buttonId: '4', buttonTitle: 'Four' },
			]),
		).toThrow(/1 to 3 buttons/);

		expect(() =>
			buildListMessage('15551234567', 'Body', 'Button', [
				{
					sectionTitle: 'Only',
					rows: Array.from({ length: 11 }, (_, index) => ({
						rowId: `row-${index}`,
						rowTitle: `Row ${index}`,
					})),
				},
			]),
		).toThrow(/1 to 10 rows/);

		expect(() =>
			buildProductListMessage(
				'15551234567',
				'CATALOG_ID',
				'Choose a product',
				Array.from({ length: 11 }, (_, index) => ({
					sectionTitle: `Section ${index}`,
					productRetailerIds: ['SKU_1'],
				})),
				'text',
				'Header',
			),
		).toThrow(/1 to 10 sections/);

		expect(() =>
			buildProductListMessage(
				'15551234567',
				'CATALOG_ID',
				'Choose a product',
				[{ sectionTitle: 'Empty', productRetailerIds: [] }],
				'text',
				'Header',
			),
		).toThrow(/at least one product/);

		expect(() =>
			buildProductListMessage(
				'15551234567',
				'CATALOG_ID',
				'Choose a product',
				[
					{
						sectionTitle: 'All',
						productRetailerIds: Array.from({ length: 31 }, (_, index) => `SKU_${index}`),
					},
				],
				'text',
				'Header',
			),
		).toThrow(/30 products/);
	});

	it('rejects flow messages with empty CTA or token', () => {
		expect(() =>
			buildFlowMessage(
				'15551234567',
				'Body',
				'',
				'token',
				'3',
				'navigate',
			),
		).toThrow(/Flow CTA is required/);

		expect(() =>
			buildFlowMessage(
				'15551234567',
				'Body',
				'Open',
				'   ',
				'3',
				'navigate',
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				'flow-1',
			),
		).toThrow(/Flow token is required/);
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
