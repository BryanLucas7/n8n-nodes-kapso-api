import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messageSendOperations } from '../../nodes/KapsoApi/actions/operations';
import { buildRequest, buildBroadcastAddRecipientsRequest, buildBroadcastCreateRequest, buildSendTemplateRequest } from '../../nodes/KapsoApi/actions/routing';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

const fetchSelectedTemplateDefinitionMock = vi.hoisted(() =>
	vi.fn(async () => ({
		name: 'order_update',
		language: 'en_US',
		parameterFormat: 'named',
		componentMode: 'standard',
		headerFormat: 'text',
		headerTextHasVariable: false,
		bodyVariables: [
			{
				id: 'first_name',
				displayName: 'first_name',
				parameterName: 'first_name',
				valueType: 'text',
			},
		],
		buttonSlots: [],
		carouselCards: [],
	})),
);

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../nodes/KapsoApi/loadOptions/templateFetch')>();
	return {
		...actual,
		fetchSelectedTemplateDefinition: fetchSelectedTemplateDefinitionMock,
		resolveSendTemplateContext: vi.fn(async () => {
			const definition = await fetchSelectedTemplateDefinitionMock();
			return {
				identity: { name: definition.name, language: definition.language },
				definition,
			};
		}),
	};
});

vi.mock('../../nodes/KapsoApi/loadOptions/broadcastTemplateFetch', () => ({
	loadBroadcastTemplateDefinition: vi.fn(async () => ({
		name: 'plain',
		language: 'en_US',
		parameterFormat: 'named',
		componentMode: 'standard',
		headerFormat: 'none',
		headerTextHasVariable: false,
		bodyVariables: [],
		buttonSlots: [],
		carouselCards: [],
	})),
}));

vi.mock('../../nodes/KapsoApi/loadOptions/broadcastCreateTemplate', () => ({
	resolveBroadcastCreateTemplateId: vi.fn(async () => '784203120908608'),
}));

vi.mock('../../nodes/KapsoApi/actions/broadcastPreflight', () => ({
	assertBroadcastDraftForRecipients: vi.fn(async () => undefined),
	assertBroadcastReadyToSend: vi.fn(async () => undefined),
	assertBroadcastScheduledForCancel: vi.fn(async () => undefined),
	fetchBroadcastPreflight: vi.fn(async () => ({ status: 'draft', totalRecipients: 1 })),
}));

const PHONE = TEST_PHONE_NUMBER_ID;
const RECIPIENT = '15551234567';

function build(resource: string, operation: string, parameters: Record<string, unknown> = {}) {
	return buildRequest(
		createMockExecuteFunctions({ resource, operation, ...parameters }),
		resource,
		operation,
		0,
	);
}

describe('routing integration bodies', () => {
	describe('message sends', () => {
		it('builds sendText with link preview and reply context', () => {
			const request = build('message', 'sendText', {
				textBody: 'See https://example.com',
				advancedOptions: {
					linkPreview: true,
					replyToMessageId: 'wamid.parent',
				},
			});

			expect(request.body).toEqual({
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: RECIPIENT,
				type: 'text',
				text: {
					preview_url: true,
					body: 'See https://example.com',
				},
				context: {
					message_id: 'wamid.parent',
				},
			});
		});

		it('builds sendAudio as a voice note without caption', () => {
			const request = build('message', 'sendAudio', {
				sendAsVoiceNote: true,
				caption: 'Should be ignored',
			});

			expect(request.body).toMatchObject({
				type: 'audio',
				audio: {
					id: '425509551842',
					voice: true,
				},
			});
			expect((request.body as { audio?: { caption?: string } }).audio?.caption).toBeUndefined();
		});

		it('builds sendDocument with filename', () => {
			const request = build('message', 'sendDocument', {
				filename: 'invoice.pdf',
				caption: 'Your invoice',
			});

			expect(request.body).toMatchObject({
				type: 'document',
				document: {
					id: '425509551842',
					filename: 'invoice.pdf',
					caption: 'Your invoice',
				},
			});
		});

		it('builds sendReaction and removeReaction bodies', () => {
			expect(
				build('message', 'sendReaction', {
					reactionMessageId: 'wamid.react',
					reactionMode: 'react',
					emoji: '👍',
				}).body,
			).toEqual({
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: RECIPIENT,
				type: 'reaction',
				reaction: {
					message_id: 'wamid.react',
					emoji: '👍',
				},
			});

			expect(
				build('message', 'sendReaction', {
					reactionMessageId: 'wamid.react',
					reactionMode: 'remove',
				}).body,
			).toEqual({
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: RECIPIENT,
				type: 'reaction',
				reaction: {
					message_id: 'wamid.react',
					emoji: '',
				},
			});
		});

		it('builds sendTemplate with body components only for static text headers', async () => {
			const request = await buildSendTemplateRequest(
				createMockExecuteFunctions({
					resource: 'message',
					operation: 'sendTemplate',
					templateName: 'order_update',
					languageCode: 'en_US',
					templateDetectedHeaderFormat: 'text',
					templateDetectedComponentMode: 'standard',
					templateBodyParametersMapper: {
						mappingMode: 'defineBelow',
						value: { first_name: 'Jessica' },
					},
				}),
				0,
			);

			expect(request.body).toMatchObject({
				type: 'template',
				template: {
					name: 'order_update',
					language: { code: 'en_US' },
					components: [
						{
							type: 'body',
							parameters: [
								{
									type: 'text',
									text: 'Jessica',
									parameter_name: 'first_name',
								},
							],
						},
					],
				},
			});
		});

		it('builds markRead with typing indicator', () => {
			const request = build('message', 'markRead', {
				messageId: 'wamid.read',
				typingIndicator: true,
			});

			expect(request.body).toEqual({
				messaging_product: 'whatsapp',
				status: 'read',
				message_id: 'wamid.read',
				typing_indicator: {
					type: 'text',
				},
			});
		});

		for (const operation of messageSendOperations) {
			if (operation === 'sendReaction' || operation === 'sendTemplate' || operation === 'sendAndWait' || operation === 'sendFlow') {
				continue;
			}

			it(`includes WhatsApp envelope fields for message:${operation}`, () => {
				const request = build('message', operation);
				const body = request.body as Record<string, unknown>;

				expect(body.messaging_product).toBe('whatsapp');
				expect(body.recipient_type).toBe('individual');
				expect(body.to).toBe(RECIPIENT);
				expect(body.type).toBeTruthy();
			});
		}
	});

	describe('platform payloads', () => {
		it('builds conversation:updateStatus body', () => {
			expect(build('conversation', 'updateStatus', { conversationStatus: 'ended' }).body).toEqual({
				whatsapp_conversation: { status: 'ended' },
			});
		});

		it('builds contact:create body', () => {
			expect(
				build('contact', 'create', {
					contactWaId: { mode: 'phone', value: '+15551234567', __rl: true },
					contactProfileName: 'John',
					contactDisplayName: '',
				}).body,
			).toEqual({
				contact: {
					wa_id: '+15551234567',
					profile_name: 'John',
				},
			});
		});

		it('builds contact:update body', () => {
			expect(
				build('contact', 'update', {
					contactProfileName: '',
					contactDisplayName: 'VIP John',
				}).body,
			).toEqual({
				contact: {
					display_name: 'VIP John',
				},
			});
		});

		it('builds broadcast:create body', async () => {
			await expect(
				buildBroadcastCreateRequest(
					createMockExecuteFunctions({
						resource: 'broadcast',
						operation: 'create',
						broadcastName: 'Weekend Sale',
						phoneNumberId: PHONE,
						broadcastTemplateId: '784203120908608',
					}),
					0,
				),
			).resolves.toMatchObject({
				body: {
					whatsapp_broadcast: {
						name: 'Weekend Sale',
						phone_number_id: PHONE,
						whatsapp_template_id: '784203120908608',
					},
				},
			});
		});

		it('builds broadcast:schedule body', () => {
			expect(
				build('broadcast', 'schedule', {
					scheduledAt: '2099-06-01T12:00:00.000Z',
				}).body,
			).toEqual({
				scheduled_at: '2099-06-01T12:00:00.000Z',
			});
		});

		it('builds broadcast:addRecipients body', async () => {
			await expect(
				buildBroadcastAddRecipientsRequest(
					createMockExecuteFunctions({
						resource: 'broadcast',
						operation: 'addRecipients',
						broadcastRecipients: {
							recipientValues: [
								{ phoneNumber: { mode: 'phone', value: '+14155550123', __rl: true } },
							],
						},
					}),
					0,
				),
			).resolves.toMatchObject({
				body: {
					whatsapp_broadcast: {
						recipients: [{ phone_number: '+14155550123' }],
					},
				},
			});
		});

		it('builds media:uploadFromUrl body', () => {
			expect(
				build('media', 'uploadFromUrl', {
					ingestPhoneNumberId: PHONE,
					ingestSourceUrl: 'https://example.com/image.png',
					ingestDelivery: 'meta_media',
				}).body,
			).toEqual({
				media_ingest: {
					phone_number_id: PHONE,
					source: 'https://example.com/image.png',
					delivery: 'meta_media',
				},
			});
		});

		it('builds blockUser bodies', () => {
			const users = {
				block_users: [{ user: '15551234567' }],
			};

			expect(build('blockUser', 'block').body).toEqual(users);
			expect(build('blockUser', 'unblock').body).toEqual(users);
		});
	});

	describe('list and query integration', () => {
		it('builds message:list query from dedicated filter fields', () => {
			expect(
				build('message', 'list', {
					advancedOptions: {
						messageListConversationId: '550e8400-e29b-41d4-a716-446655440000',
						messageListDirection: 'inbound',
						messageListStatus: 'delivered',
					},
				}).query,
			).toEqual({
				conversation_id: '550e8400-e29b-41d4-a716-446655440000',
				direction: 'inbound',
				status: 'delivered',
				fields: 'kapso()',
			});
		});

		it('builds contact:list query from contact list options', () => {
			expect(
				build('contact', 'list', {
					contactListOptions: {
						contactProfileNameContains: 'Ana',
						listAfter: 'cursor-after',
					},
				}).query,
			).toEqual({
				profile_name_contains: 'Ana',
				after: 'cursor-after',
			});
		});

		it('builds conversation:list query from conversation list options', () => {
			expect(
				build('conversation', 'list', {
					conversationListOptions: {
						conversationStatusFilter: 'active',
						conversationUnassigned: true,
					},
				}).query,
			).toEqual({
				status: 'active',
				unassigned: true,
			});
		});

		it('builds platformMessage:list query from dedicated filter fields', () => {
			expect(
				build('platformMessage', 'list', {
					phoneNumberId: PHONE,
					platformMessageListOptions: {
						platformMessageConversationId: '550e8400-e29b-41d4-a716-446655440000',
						platformMessageDirection: 'outbound',
						platformMessageType: 'template',
						platformMessageHasMedia: 'false',
						listBefore: 'cursor-before',
					},
				}).query,
			).toEqual({
				phone_number_id: PHONE,
				conversation_id: '550e8400-e29b-41d4-a716-446655440000',
				direction: 'outbound',
				message_type: 'template',
				has_media: false,
				before: 'cursor-before',
			});
		});

		it('builds media:getUrl query with phone number id', () => {
			expect(
				build('media', 'getUrl', {
					mediaId: '425509551842',
					phoneNumberId: PHONE,
				}).query,
			).toEqual({
				phone_number_id: PHONE,
			});
		});

		it('omits body for broadcast send and cancel', () => {
			expect(build('broadcast', 'send').body).toBeUndefined();
			expect(build('broadcast', 'cancel').body).toBeUndefined();
		});
	});
});
