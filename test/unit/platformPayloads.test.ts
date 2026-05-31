import { describe, expect, it } from 'vitest';
import {
	buildBlockUsersBody,
	buildBroadcastAddRecipientsBody,
	buildBroadcastCreateBody,
	buildContactCreateBody,
	buildConversationStatusBody,
	buildMediaIngestBody,
} from '../../nodes/KapsoApi/actions/platformPayloads';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

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
			contactWaId: '+15551234567',
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
				userValues: [{ user: '15551234567' }],
			},
		});

		expect(buildBlockUsersBody(ef, 0)).toEqual({
			block_users: [{ user: '15551234567' }],
		});
	});

	it('builds broadcast recipients with template components', () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [
					{
						phoneNumber: '+14155550123',
						bodyParameters: {
							bodyParameterValues: [
								{ parameterName: 'first_name', parameterText: 'John' },
								{ parameterName: 'discount', parameterText: 'SAVE50' },
							],
						},
						headerType: 'image',
						headerMediaUrl: 'https://cdn.example.com/banner.jpg',
						buttonParameters: {
							buttonParameterValues: [
								{ buttonSubType: 'url', buttonIndex: 0, buttonText: 'promo-code-12345' },
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
						phoneNumber: '+14155550123',
						buttonParameters: {
							buttonParameterValues: [
								{
									buttonSubType: 'mpm',
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
