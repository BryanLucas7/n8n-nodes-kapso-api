import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildBlockUsersBody,
	buildBroadcastAddRecipientsBody,
	buildBroadcastCreateBody,
	buildBroadcastScheduleBody,
	buildContactCreateBody,
	buildConversationStatusBody,
	buildMediaIngestBody,
} from '../../nodes/KapsoApi/actions/platformPayloads';
import { PARAMETER_TYPE_SUFFIX } from '../../nodes/KapsoApi/resourceMapping/templateParameters';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const e164Phone = { mode: 'phone', value: '+15551234567', __rl: true };
const broadcastPhone = { mode: 'phone', value: '+14155550123', __rl: true };
const contactUuid = '550e8400-e29b-41d4-a716-446655440000';

const imageTemplateDefinition = {
	name: 'promo',
	language: 'en_US',
	parameterFormat: 'named',
	componentMode: 'standard',
	headerFormat: 'image',
	headerTextHasVariable: false,
	bodyVariables: [
		{
			id: 'first_name',
			displayName: 'first_name',
			parameterName: 'first_name',
			valueType: 'text',
		},
		{
			id: 'discount',
			displayName: 'discount',
			parameterName: 'discount',
			valueType: 'text',
		},
	],
	buttonSlots: [{ index: 0, subType: 'url', dynamicKind: 'url_suffix' }],
	carouselCards: [],
};

const imageOnlyTemplateDefinition = {
	name: 'media_only',
	language: 'en_US',
	parameterFormat: 'named',
	componentMode: 'standard',
	headerFormat: 'image',
	headerTextHasVariable: false,
	bodyVariables: [],
	buttonSlots: [],
	carouselCards: [],
};

const mpmTemplateDefinition = {
	name: 'mpm_promo',
	language: 'en_US',
	parameterFormat: 'named',
	componentMode: 'standard',
	headerFormat: 'none',
	headerTextHasVariable: false,
	bodyVariables: [],
	buttonSlots: [{ index: 0, subType: 'mpm', dynamicKind: 'mpm' }],
	carouselCards: [],
};

const emptyTemplateDefinition = {
	name: 'plain',
	language: 'en_US',
	parameterFormat: 'named',
	componentMode: 'standard',
	headerFormat: 'none',
	headerTextHasVariable: false,
	bodyVariables: [],
	buttonSlots: [],
	carouselCards: [],
};

vi.mock('../../nodes/KapsoApi/loadOptions/broadcastTemplateFetch', () => ({
	loadBroadcastTemplateDefinition: vi.fn(),
}));

vi.mock('../../nodes/KapsoApi/loadOptions/broadcastCreateTemplate', () => ({
	resolveBroadcastCreateTemplateId: vi.fn(async () => '784203120908608'),
}));

vi.mock('../../nodes/KapsoApi/actions/broadcastPreflight', () => ({
	assertBroadcastDraftForRecipients: vi.fn(async () => undefined),
}));

import { loadBroadcastTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/broadcastTemplateFetch';

describe('platformPayloads', () => {
	beforeEach(() => {
		vi.mocked(loadBroadcastTemplateDefinition).mockResolvedValue(emptyTemplateDefinition);
	});

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
			'Contact Phone Number must use the phone number selector',
		);
	});

	it('builds broadcast create body', async () => {
		const ef = createMockExecuteFunctions({
			broadcastName: 'Weekend Sale',
			phoneNumberId: '1234567890',
			broadcastTemplateId: '784203120908608',
		});

		await expect(buildBroadcastCreateBody(ef, 0)).resolves.toEqual({
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

	it('builds broadcast recipients with template components', async () => {
		vi.mocked(loadBroadcastTemplateDefinition).mockResolvedValue(imageTemplateDefinition);

		const ef = createMockExecuteFunctions({
			broadcastDetectedHeaderFormat: 'image',
			broadcastDetectedComponentMode: 'standard',
			broadcastRecipients: {
				recipientValues: [
					{
						phoneNumber: broadcastPhone,
						recipientHeaderMediaUrl: 'https://cdn.example.com/banner.jpg',
						recipientBodyParametersMapper: {
							mappingMode: 'defineBelow',
							value: {
								first_name: 'John',
								[`first_name${PARAMETER_TYPE_SUFFIX}`]: 'text',
								discount: 'SAVE50',
								[`discount${PARAMETER_TYPE_SUFFIX}`]: 'text',
							},
						},
						recipientButtonParametersMapper: {
							mappingMode: 'defineBelow',
							value: {
								btn_0_url_suffix: 'promo-code-12345',
							},
						},
					},
				],
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).resolves.toEqual({
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

	it('normalizes Resource Locator values in broadcast recipient template headers', async () => {
		vi.mocked(loadBroadcastTemplateDefinition).mockResolvedValue(imageOnlyTemplateDefinition);

		const ef = createMockExecuteFunctions({
			broadcastDetectedHeaderFormat: 'image',
			broadcastDetectedComponentMode: 'standard',
			broadcastRecipients: {
				recipientValues: [
					{
						phoneNumber: broadcastPhone,
						recipientHeaderMediaId: { mode: 'id', value: '1234567890' },
					},
				],
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).resolves.toMatchObject({
			whatsapp_broadcast: {
				recipients: [
					{
						components: [
							{
								type: 'header',
								parameters: [
									{
										type: 'image',
										image: { id: '1234567890' },
									},
								],
							},
						],
					},
				],
			},
		});
	});

	it('builds broadcast recipients with MPM template button sections', async () => {
		vi.mocked(loadBroadcastTemplateDefinition).mockResolvedValue(mpmTemplateDefinition);

		const ef = createMockExecuteFunctions({
			broadcastDetectedHeaderFormat: 'none',
			broadcastDetectedComponentMode: 'standard',
			broadcastRecipients: {
				recipientValues: [
					{
						phoneNumber: broadcastPhone,
						recipientButtonParametersMapper: {
							mappingMode: 'defineBelow',
							value: {
								btn_0_mpm: [
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
					},
				],
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).resolves.toEqual({
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

	it('rejects invalid broadcast contact UUID values', async () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{ whatsappContactId: 'not-a-uuid' }],
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).rejects.toThrow(
			'Contact ID must be a valid UUID',
		);
	});

	it('builds broadcast recipients with contact UUID instead of phone', async () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{ whatsappContactId: contactUuid }],
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).resolves.toEqual({
			whatsapp_broadcast: {
				recipients: [{ whatsapp_contact_id: contactUuid }],
			},
		});
	});

	it('rejects legacy plain-text broadcast recipient phone values', async () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{ phoneNumber: '+14155550123' }],
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).rejects.toThrow(
			'Phone Number must use the phone number selector',
		);
	});

	it('rejects broadcast recipients without phone number or contact ID', async () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: [{}],
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).rejects.toThrow(
			'Each broadcast recipient requires a phone number or contact ID.',
		);
	});

	it('builds top-level broadcast schedule body', () => {
		const ef = createMockExecuteFunctions({
			scheduledAt: '2099-06-01T12:00:00.000Z',
		});

		expect(buildBroadcastScheduleBody(ef, 0)).toEqual({
			scheduled_at: '2099-06-01T12:00:00.000Z',
		});
	});

	it('rejects past broadcast schedule timestamps', () => {
		const ef = createMockExecuteFunctions({
			scheduledAt: '2000-01-01T00:00:00.000Z',
		});

		expect(() => buildBroadcastScheduleBody(ef, 0)).toThrow('Scheduled At must be in the future.');
	});

	it('rejects more than 1000 broadcast recipients', async () => {
		const ef = createMockExecuteFunctions({
			broadcastRecipients: {
				recipientValues: Array.from({ length: 1001 }, () => ({
					phoneNumber: { mode: 'phone', value: '+14155550123', __rl: true },
				})),
			},
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).rejects.toThrow('1000 recipients');
	});

	it('rejects recipientsBodyJson with more than 1000 recipients', async () => {
		const ef = createMockExecuteFunctions({
			recipientsBodyJson: JSON.stringify({
				whatsapp_broadcast: {
					recipients: Array.from({ length: 1001 }, () => ({
						phone_number: '+14155550123',
					})),
				},
			}),
		});

		await expect(buildBroadcastAddRecipientsBody(ef, 0)).rejects.toThrow('1000 recipients');
	});

	it('maps only the current input item in inputItems mode', async () => {
		vi.mocked(loadBroadcastTemplateDefinition).mockResolvedValue(emptyTemplateDefinition);

		const ef = createMockExecuteFunctions(
			{
				broadcastRecipientSource: 'inputItems',
				broadcastRecipientPhoneField: 'phone',
			},
			{
				items: [{ json: { phone: '+15551111111' } }, { json: { phone: '+15552222222' } }],
				itemIndex: 1,
			},
		);

		await expect(buildBroadcastAddRecipientsBody(ef, 1)).resolves.toEqual({
			whatsapp_broadcast: {
				recipients: [{ phone_number: '+15552222222' }],
			},
		});
	});
});
