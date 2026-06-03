import { describe, expect, it } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import {
	buildCallPermissionMessage,
	buildButtonsMessage,
	buildCatalogMessage,
	buildContactMessage,
	buildCtaCallMessage,
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
import { buildSendAndWaitMessagePayload } from '../../nodes/KapsoApi/sendAndWait/message';
import { parseJsonObject, parseJsonValue } from '../../nodes/KapsoApi/transport/json';
import {
	BUTTON_TITLE_MAX,
	CONTACT_MESSAGE_MAX_CONTACTS,
	INTERACTIVE_BODY_MAX,
	PRODUCT_RETAILER_ID_MAX,
	TEXT_MESSAGE_MAX,
} from '../../nodes/KapsoApi/properties/fieldConstraints';

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

	it('builds contact payloads with reply context', () => {
		expect(
			buildContactMessage(
				'15551234567',
				[
					{
						formattedName: 'John Doe',
						phones: {
							phoneValues: [{ phoneNumber: '+15559876543' }],
						},
					},
				],
				'wamid.reply123',
			),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'contacts',
			context: { message_id: 'wamid.reply123' },
			contacts: [
				{
					name: { formatted_name: 'John Doe' },
					phones: [{ phone: '+15559876543', type: 'MOBILE' }],
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

		expect(
			buildCtaCallMessage(
				'15551234567',
				'Call us',
				'Call',
				'+15559876543',
				'none',
			),
		).toMatchObject({
			type: 'interactive',
			interactive: {
				type: 'cta_call',
				action: {
					name: 'cta_call',
					parameters: {
						display_text: 'Call',
						phone_number: '+15559876543',
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

		expect(buildCatalogMessage('15551234567', 'Browse our catalog')).toMatchObject({
			type: 'interactive',
			interactive: {
				type: 'catalog_message',
				action: {
					name: 'catalog_message',
				},
			},
		});
		expect(
			(buildCatalogMessage('15551234567', 'Browse our catalog') as {
				interactive: { action: { parameters?: unknown } };
			}).interactive.action.parameters,
		).toBeUndefined();
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

	it('adds reply context to location request, call permission, and send-and-wait payloads', () => {
		expect(buildRequestLocationMessage('15551234567', 'Share your location', 'wamid.parent')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'interactive',
			context: { message_id: 'wamid.parent' },
			interactive: {
				type: 'location_request_message',
				body: { text: 'Share your location' },
				action: { name: 'send_location' },
			},
		});

		expect(buildCallPermissionMessage('15551234567', 'May we call you?', 'wamid.parent')).toMatchObject({
			context: { message_id: 'wamid.parent' },
		});

		expect(
			buildSendAndWaitMessagePayload(
				'15551234567',
				{
					message: 'Approve?',
					options: [{ label: '✓ Approve', url: 'https://n8n.example/resume?approved=true' }],
					replyToMessageId: 'wamid.parent',
				},
				'textLinks',
				'instance-123',
			),
		).toMatchObject({
			type: 'text',
			context: { message_id: 'wamid.parent' },
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
		).toThrow(/Flow Button Label is required/);

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

	it('builds draft flow mode and data_exchange initial payloads', () => {
		expect(
			buildFlowMessage(
				'15551234567',
				'Body',
				'Open',
				'token-abc',
				'3',
				'data_exchange',
				undefined,
				{ order_id: '42' },
				undefined,
				'draft',
			),
		).toMatchObject({
			interactive: {
				action: {
					parameters: {
						mode: 'draft',
						flow_action: 'data_exchange',
						flow_action_payload: {
							data: { order_id: '42' },
						},
					},
				},
			},
		});

		expect(
			buildFlowMessage(
				'15551234567',
				'Body',
				'Open',
				'token-abc',
				'3',
				'navigate',
				'WELCOME',
				undefined,
				undefined,
				'published',
			),
		).toMatchObject({
			interactive: {
				action: {
					parameters: {
						mode: 'published',
					},
				},
			},
		});
	});

	it('builds interactive messages with image, video, and document headers (link and id)', () => {
		const to = '15551234567';
		const body = 'Choose';
		const buttons = [{ buttonId: 'a', buttonTitle: 'A' }];

		expect(
			buildButtonsMessage(
				to,
				body,
				buttons,
				'image',
				undefined,
				'link',
				'https://example.com/photo.jpg',
			),
		).toMatchObject({
			interactive: {
				header: { type: 'image', image: { link: 'https://example.com/photo.jpg' } },
			},
		});

		expect(
			buildButtonsMessage(
				to,
				body,
				buttons,
				'image',
				undefined,
				'id',
				undefined,
				'9876543210',
			),
		).toMatchObject({
			interactive: {
				header: { type: 'image', image: { id: '9876543210' } },
			},
		});

		expect(
			buildButtonsMessage(
				to,
				body,
				buttons,
				'video',
				undefined,
				'link',
				'https://example.com/clip.mp4',
			),
		).toMatchObject({
			interactive: {
				header: { type: 'video', video: { link: 'https://example.com/clip.mp4' } },
			},
		});

		expect(
			buildButtonsMessage(
				to,
				body,
				buttons,
				'video',
				undefined,
				'id',
				undefined,
				'1122334455',
			),
		).toMatchObject({
			interactive: {
				header: { type: 'video', video: { id: '1122334455' } },
			},
		});

		expect(
			buildButtonsMessage(
				to,
				body,
				buttons,
				'document',
				undefined,
				'link',
				'https://example.com/doc.pdf',
				undefined,
				'terms.pdf',
			),
		).toMatchObject({
			interactive: {
				header: {
					type: 'document',
					document: { link: 'https://example.com/doc.pdf', filename: 'terms.pdf' },
				},
			},
		});

		expect(
			buildButtonsMessage(
				to,
				body,
				buttons,
				'document',
				undefined,
				'id',
				undefined,
				'5566778899',
				'invoice.pdf',
			),
		).toMatchObject({
			interactive: {
				header: {
					type: 'document',
					document: { id: '5566778899', filename: 'invoice.pdf' },
				},
			},
		});

		expect(
			buildButtonsMessage(
				to,
				body,
				buttons,
				'document',
				undefined,
				'link',
				'https://example.com/bare.pdf',
			),
		).toMatchObject({
			interactive: {
				header: {
					type: 'document',
					document: { link: 'https://example.com/bare.pdf' },
				},
			},
		});
	});

	it('builds list messages with media headers and rows without descriptions', () => {
		expect(
			buildListMessage(
				'15551234567',
				'Pick one',
				'Options',
				[
					{
						sectionTitle: 'Items',
						rows: [{ rowId: 'a', rowTitle: 'Alpha' }],
					},
				],
				undefined,
				'image',
				undefined,
				'link',
				'https://example.com/header.png',
			),
		).toMatchObject({
			interactive: {
				header: { type: 'image', image: { link: 'https://example.com/header.png' } },
				action: {
					sections: [{ rows: [{ id: 'a', title: 'Alpha' }] }],
				},
			},
		});

		const row = (
			buildListMessage(
				'15551234567',
				'Body',
				'View',
				[{ sectionTitle: 'S', rows: [{ rowId: 'r', rowTitle: 'Row' }] }],
			).interactive as { action: { sections: { rows: Record<string, unknown>[] }[] } }
		).action.sections[0].rows[0];
		expect(row).not.toHaveProperty('description');
	});

	it('builds contact payloads with skipped empty fields and optional name parts', () => {
		expect(
			buildContactMessage('15551234567', [
				{
					formattedName: 'Skip Empty',
					phones: {
						phoneValues: [
							{ phoneNumber: '' },
							{ phoneNumber: '+15550001111' },
						],
					},
				},
			]),
		).toMatchObject({
			contacts: [{ phones: [{ phone: '+15550001111', type: 'MOBILE' }] }],
		});

		expect(() =>
			buildContactMessage('15551234567', [
				{
					formattedName: 'No Phone',
					phones: { phoneValues: [{ phoneNumber: '' }] },
				},
			]),
		).toThrow('requires at least one phone number');

		expect(() =>
			buildContactMessage('15551234567', [
				{
					formattedName: 'Missing Values',
					phones: {},
				},
			]),
		).toThrow('requires at least one phone number');

		expect(
			buildContactMessage('15551234567', [
				{
					formattedName: 'Full Profile',
					middleName: 'Q',
					namePrefix: 'Dr',
					nameSuffix: 'Jr',
					birthday: '1990-01-01',
					phones: { phoneValues: [{ phoneNumber: '+15550002222' }] },
					emails: {
						emailValues: [{ email: '' }, { email: 'a@b.com' }],
					},
					urls: {
						urlValues: [{ url: '' }, { url: 'https://site.test' }],
					},
					orgDepartment: 'Sales',
					addresses: {
						addressValues: [
							{ addressType: 'HOME' },
							{ street: '2 Oak Ave', city: 'Austin' },
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
					name: {
						formatted_name: 'Full Profile',
						middle_name: 'Q',
						prefix: 'Dr',
						suffix: 'Jr',
					},
					birthday: '1990-01-01',
					phones: [{ phone: '+15550002222', type: 'MOBILE' }],
					emails: [{ email: 'a@b.com', type: 'WORK' }],
					urls: [{ url: 'https://site.test', type: 'WORK' }],
					org: { department: 'Sales' },
					addresses: [
						{
							type: 'WORK',
							street: '2 Oak Ave',
							city: 'Austin',
						},
					],
				},
			],
		});
	});

	it('rejects contact messages above the Meta contact count limit', () => {
		const contacts = Array.from({ length: CONTACT_MESSAGE_MAX_CONTACTS + 1 }, (_, index) => ({
			formattedName: `Contact ${index + 1}`,
			phones: { phoneValues: [{ phoneNumber: '+15550002222' }] },
		}));

		expect(() => buildContactMessage('15551234567', contacts)).toThrow(
			`Contact messages support 1 to ${CONTACT_MESSAGE_MAX_CONTACTS} contacts.`,
		);
	});

	it('builds template payloads from advanced JSON and without components', () => {
		expect(
			buildTemplateMessageFromParams('15551234567', 'raw_template', 'en', {
				advancedComponentsJson: '[{"type":"body","parameters":[{"type":"text","text":"Hi"}]}]',
			}),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'template',
			template: {
				name: 'raw_template',
				language: { code: 'en' },
				components: [{ type: 'body', parameters: [{ type: 'text', text: 'Hi' }] }],
			},
		});

		expect(
			buildTemplateMessageFromParams('15551234567', 'minimal', 'en_US', {}),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'template',
			template: {
				name: 'minimal',
				language: { code: 'en_US' },
			},
		});

		expect(buildTemplateMessage('15551234567', 'plain', 'en')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'template',
			template: {
				name: 'plain',
				language: { code: 'en' },
			},
		});
	});

	it('builds CTA URL messages with footer, reply context, and media headers', () => {
		expect(
			buildCtaUrlMessage(
				'15551234567',
				'Tap below',
				'Open',
				'https://example.com',
				'image',
				undefined,
				'id',
				undefined,
				'1234567890',
				undefined,
				'Thanks',
				'wamid.parent',
			),
		).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'interactive',
			interactive: {
				type: 'cta_url',
				header: { type: 'image', image: { id: '1234567890' } },
				body: { text: 'Tap below' },
				footer: { text: 'Thanks' },
				action: {
					name: 'cta_url',
					parameters: {
						display_text: 'Open',
						url: 'https://example.com',
					},
				},
			},
			context: { message_id: 'wamid.parent' },
		});
	});

	it('builds product, catalog, and mark-read payloads without optional fields', () => {
		const productWithoutBody = buildProductMessage('15551234567', 'CATALOG_ID', 'SKU_1234');
		expect(productWithoutBody).toMatchObject({
			interactive: { type: 'product' },
		});
		expect(
			(productWithoutBody.interactive as Record<string, unknown>).body,
		).toBeUndefined();

		expect(buildMarkReadMessage('wamid.123', false)).toEqual({
			messaging_product: 'whatsapp',
			status: 'read',
			message_id: 'wamid.123',
		});

		expect(
			buildCatalogMessage('15551234567', 'Browse', 'SKU_THUMB', 'wamid.parent'),
		).toMatchObject({
			context: { message_id: 'wamid.parent' },
		});
	});

	it('builds product list messages with required media headers', () => {
		const sections = [{ sectionTitle: 'Featured', productRetailerIds: ['SKU_1'] }];

		expect(
			buildProductListMessage(
				'15551234567',
				'CATALOG_ID',
				'Pick',
				sections,
				'video',
				undefined,
				'link',
				'https://example.com/promo.mp4',
			),
		).toMatchObject({
			interactive: {
				header: { type: 'video', video: { link: 'https://example.com/promo.mp4' } },
			},
		});

		expect(
			buildProductListMessage(
				'15551234567',
				'CATALOG_ID',
				'Pick',
				sections,
				'document',
				undefined,
				'id',
				undefined,
				'9988776655',
				'catalog.pdf',
			),
		).toMatchObject({
			interactive: {
				header: {
					type: 'document',
					document: { id: '9988776655', filename: 'catalog.pdf' },
				},
			},
		});
	});

	it('builds flow messages with headers, footers, and navigate payload branches', () => {
		expect(
			buildFlowMessage(
				'15551234567',
				'Start',
				'Go',
				'token',
				'3',
				'navigate',
				'SCREEN_A',
				undefined,
				'wamid.reply',
				'published',
				'text',
				'Flow title',
			),
		).toMatchObject({
			context: { message_id: 'wamid.reply' },
			interactive: {
				header: { type: 'text', text: 'Flow title' },
			},
		});

		expect(
			buildFlowMessage(
				'15551234567',
				'Start',
				'Go',
				'token',
				'3',
				'navigate',
				undefined,
				{ key: 'value' },
			),
		).toMatchObject({
			interactive: {
				action: {
					parameters: {
						flow_action_payload: { data: { key: 'value' } },
					},
				},
			},
		});

		expect(
			buildFlowMessage(
				'15551234567',
				'Start',
				'Go',
				'token',
				'3',
				'navigate',
			),
		).toMatchObject({
			interactive: {
				action: {
					parameters: {
						flow_action: 'navigate',
					},
				},
			},
		});

		const bareNavigateParams = (
			buildFlowMessage('15551234567', 'Start', 'Go', 'token', '3', 'navigate').interactive as {
				action: { parameters: Record<string, unknown> };
			}
		).action.parameters;
		expect(bareNavigateParams).not.toHaveProperty('flow_action_payload');

		expect(
			buildFlowMessage(
				'15551234567',
				'Start',
				'Go',
				'token',
				'3',
				'navigate',
				'ONLY_SCREEN',
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				'link',
				undefined,
				undefined,
				undefined,
				'Footer text',
			),
		).toMatchObject({
			interactive: {
				footer: { text: 'Footer text' },
				action: {
					parameters: {
						flow_action_payload: { screen: 'ONLY_SCREEN' },
					},
				},
			},
		});
	});

	it('rejects flow button labels longer than 20 characters', () => {
		expect(() =>
			buildFlowMessage(
				'15551234567',
				'Start',
				'123456789012345678901',
				'token',
				'3',
				'navigate',
			),
		).toThrow('Flow Button Label');
	});

	it('builds location, sticker, and media link payloads with reply context', () => {
		expect(buildLocationMessage('15551234567', '40.7', '-74.0', undefined, undefined, 'wamid.loc')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'location',
			location: { latitude: 40.7, longitude: -74 },
			context: { message_id: 'wamid.loc' },
		});

		expect(buildStickerMessage('15551234567', 'link', 'https://example.com/sticker.webp', 'wamid.st')).toEqual({
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: '15551234567',
			type: 'sticker',
			sticker: { link: 'https://example.com/sticker.webp' },
			context: { message_id: 'wamid.st' },
		});

		expect(buildMediaMessage('15551234567', 'image', 'link', 'https://example.com/pic.jpg')).toMatchObject({
			type: 'image',
			image: { link: 'https://example.com/pic.jpg' },
		});
	});

	it('rejects message fields that exceed Meta length limits', () => {
		const longText = 'a'.repeat(TEXT_MESSAGE_MAX + 1);
		const longBody = 'b'.repeat(INTERACTIVE_BODY_MAX + 1);
		const longButtonTitle = 'c'.repeat(BUTTON_TITLE_MAX + 1);

		expect(() => buildTextMessage('15551234567', longText, false)).toThrow(ApplicationError);
		expect(() =>
			buildButtonsMessage('15551234567', 'ok', [{ buttonId: 'id', buttonTitle: longButtonTitle }], 'none'),
		).toThrow(/20/);
		expect(() =>
			buildListMessage(
				'15551234567',
				longBody,
				'View',
				[{ sectionTitle: 'Section', rows: [{ rowId: 'id', rowTitle: 'Title' }] }],
			),
		).toThrow(/1024/);
		expect(() => buildCallPermissionMessage('15551234567', longBody)).toThrow(/1024/);
		expect(() =>
			buildCtaUrlMessage('15551234567', 'Body', 'Open', 'not-a-url', 'none'),
		).toThrow(ApplicationError);
		expect(() =>
			buildProductMessage('15551234567', 'CATALOG_ID', 'x'.repeat(PRODUCT_RETAILER_ID_MAX + 1)),
		).toThrow(/100/);
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
