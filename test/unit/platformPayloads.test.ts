import { describe, expect, it } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import {
	buildBlockUsersBody,
	buildBroadcastAddRecipientsBody,
	buildBroadcastCreateBody,
	buildContactCreateBody,
	buildConversationStatusBody,
	buildMediaIngestBody,
} from '../../nodes/KapsoApi/actions/platformPayloads';
import { TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY } from '../../nodes/KapsoApi/properties/templateShared.fields';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const e164Phone = { mode: 'phone', value: '+15551234567', __rl: true };
const broadcastPhone = { mode: 'phone', value: '+14155550123', __rl: true };
const contactUuid = '550e8400-e29b-41d4-a716-446655440000';

describe('platformPayloads', () => {
	it('builds conversation status body', () => {
		const ef = createMockExecuteFunctions({
			conversationStatus: 'ended',
		});

		expect(buildConversationStatusBody(ef, 0)).toEqual({
			whatsapp_conversation: { status: 'ended' },
		});
	});

	it('builds contact create body', () => {
		const ef = createMockExecuteFunctions({
			contactWaId: e164Phone,
			contactProfileName: 'John',
			contactDisplayName: 'VIP John',
		});

		expect(buildContactCreateBody(ef, 0)).toEqual({
			contact: {
				wa_id: '+15551234567',
				profile_name: 'John',
				display_name: 'VIP John',
			},
		});
	});

	it('rejects legacy plain-text contact WhatsApp ID values', () => {
		const ef = createMockExecuteFunctions({
			contactWaId: '+15551234567',
		});

		expect(() => buildContactCreateBody(ef, 0)).toThrow(
			'WhatsApp ID must use the phone number selector',
		);
	});

	it('builds broadcast create body', () => {
		const ef = createMockExecuteFunctions({
			broadcastName: 'Weekend Sale',
			broadcastPhoneNumberId: '1234567890',
			broadcastTemplateId: '784203120908608',
		});

		expect(buildBroadcastCreateBody(ef, 0)).toEqual({
			whatsapp_broadcast: {
				name: 'Weekend Sale',
				phone_number_id: '1234567890',
				whatsapp_template_id: '784203120908608',
			},
		});
	});

	it('builds media ingest body', () => {
		const ef = createMockExecuteFunctions({
			ingestPhoneNumberId: '1234567890',
			ingestSourceUrl: 'https://example.com/image.png',
			ingestDelivery: 'meta_media',
		});

		expect(buildMediaIngestBody(ef, 0)).toEqual({
			media_ingest: {
				phone_number_id: '1234567890',
				source: 'https://example.com/image.png',
				delivery: 'meta_media',
			},
		});
	});

	it('builds media ingest body with meta resumable asset delivery', () => {
		const ef = createMockExecuteFunctions({
			ingestPhoneNumberId: '1234567890',
			ingestSourceUrl: 'https://example.com/video.mp4',
			ingestDelivery: 'meta_resumable_asset',
		});

		expect(buildMediaIngestBody(ef, 0)).toEqual({
			media_ingest: {
				phone_number_id: '1234567890',
				source: 'https://example.com/video.mp4',
				delivery: 'meta_resumable_asset',
			},
		});
	});

	it('builds block users body', () => {
		const ef = createMockExecuteFunctions({
			blockedUsers: {
				userValues: [{ user: { mode: 'phone', value: '15551234567', __rl: true } }],
			},
		});

		expect(buildBlockUsersBody(ef, 0)).toEqual({
		 block_users: [{ user: '15551234567' }],
		});
	});

	it('rejects legacy plain-text block user phone values', () => {
		const ef = createMockExecuteFunctions({
			blockedUsers: {
				userValues: [{ user: '15551234567' }],
			},
		});

		expect(() => buildBlockUsersBody(ef, 0)).toThrow(
			'User Phone must use the phone number selector',
		);
	});

	it('builds broadcast recipients with template components', () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [
					{
						phoneNumber: broadcastPhone,
						bodyParameters: {
							bodyParameterValues: [
								{ parameterName: 'first_name', parameterText: 'John' },
								{ parameterName: 'discount', parameterText: 'SAVE50' },
							],
						},
						headerType: 'image',
						headerMediaUrl: 'https://cdn.example.com/banner.jpg',
						buttonParameters: {
							[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]: [
								{ templateButtonKind: 'url', buttonIndex: 0, buttonText: 'promo-code-12345' },
							],
						},
					},
				],
			},
		});

		expect(buildBroadcastAddRecipientsBody(ef, 0)).toEqual({
			whatsapp_broadcast: {
				recipients: [
					{
						phone_number: '+14155550123',
						components: [
							{
								type: 'header',
								parameters: [
									{
										type: 'image',
										image: { link: 'https://cdn.example.com/banner.jpg' },
									},
								],
							},
							{
								type: 'body',
								parameters: [
									{ type: 'text', parameter_name: 'first_name', text: 'John' },
									{ type: 'text', parameter_name: 'discount', text: 'SAVE50' },
								],
							},
							{
								type: 'button',
								sub_type: 'url',
								index: '0',
								parameters: [{ type: 'text', text: 'promo-code-12345' }],
							},
						],
					},
				],
			},
		});
	});

	it('builds broadcast recipients with MPM template button sections', () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [
					{
						phoneNumber: broadcastPhone,
						buttonParameters: {
							[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]: [
								{
									templateButtonKind: 'mpm',
									buttonIndex: 0,
									mpmThumbnailProductRetailerId: 'SKU_1',
									mpmSectionValues: {
										sectionValues: [
											{
												sectionTitle: 'Popular',
												productValues: {
													productItems: [
														{ productRetailerId: 'SKU_1' },
														{ productRetailerId: 'SKU_2' },
													],
												},
											},
										],
									},
								},
							],
						},
					},
				],
			},
		});

		expect(buildBroadcastAddRecipientsBody(ef, 0)).toEqual({
			whatsapp_broadcast: {
				recipients: [
					{
						phone_number: '+14155550123',
						components: [
							{
								type: 'button',
								sub_type: 'mpm',
								index: '0',
								parameters: [
									{
										type: 'action',
										action: {
											thumbnail_product_retailer_id: 'SKU_1',
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
								],
							},
						],
					},
				],
			},
		});
	});

	it('rejects invalid broadcast contact UUID values', () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{ whatsappContactId: 'not-a-uuid' }],
			},
		});

		expect(() => buildBroadcastAddRecipientsBody(ef, 0)).toThrow('Contact ID must be a valid UUID');
	});

	it('builds broadcast recipients with contact UUID instead of phone', () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{ whatsappContactId: contactUuid }],
			},
		});

		expect(buildBroadcastAddRecipientsBody(ef, 0)).toEqual({
			whatsapp_broadcast: {
				recipients: [{ whatsapp_contact_id: contactUuid }],
			},
		});
	});

	it('rejects legacy plain-text broadcast recipient phone values', () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{ phoneNumber: '+14155550123' }],
			},
		});

		expect(() => buildBroadcastAddRecipientsBody(ef, 0)).toThrow(
			'Phone Number must use the phone number selector',
		);
	});

	it('rejects broadcast recipients without phone number or contact ID', () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{}],
			},
		});

		expect(() => buildBroadcastAddRecipientsBody(ef, 0)).toThrow(
			'Each broadcast recipient requires a phone number or contact ID.',
		);
	});
});
