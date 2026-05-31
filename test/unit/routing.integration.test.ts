import { describe, expect, it } from 'vitest';
import { messageSendOperations } from '../../nodes/KapsoApi/actions/operations';
import { buildRequest } from '../../nodes/KapsoApi/actions/routing';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

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
					id: 'media-id',
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
					id: 'media-id',
					filename: 'invoice.pdf',
					caption: 'Your invoice',
				},
			});
		});

		it('builds sendReaction and removeReaction bodies', () => {
			expect(
				build('message', 'sendReaction', {
					reactionMessageId: 'wamid.react',
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
					removeReaction: true,
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

		it('builds sendTemplate with header and body components', () => {
			const request = build('message', 'sendTemplate', {
				templateName: 'order_update',
				languageCode: 'en_US',
				templateHeaderType: 'text',
				templateHeaderText: 'Order shipped',
				templateBodyParameters: {
					parameterValues: [{ parameterName: 'first_name', parameterText: 'Jessica' }],
				},
			});

			expect(request.body).toMatchObject({
				type: 'template',
				template: {
					name: 'order_update',
					language: { code: 'en_US' },
					components: [
						{
							type: 'header',
							parameters: [{ type: 'text', text: 'Order shipped' }],
						},
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
			if (operation === 'sendReaction') {
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
					contactWaId: '+15551234567',
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

		it('builds broadcast:create body', () => {
			expect(
				build('broadcast', 'create', {
					broadcastName: 'Weekend Sale',
					broadcastPhoneNumberId: PHONE,
					broadcastTemplateId: '784203120908608',
				}).body,
			).toEqual({
				whatsapp_broadcast: {
					name: 'Weekend Sale',
					phone_number_id: PHONE,
					whatsapp_template_id: '784203120908608',
				},
			});
		});

		it('builds broadcast:schedule body', () => {
			expect(
				build('broadcast', 'schedule', {
					scheduledAt: '2026-06-01T12:00:00.000Z',
				}).body,
			).toEqual({
				whatsapp_broadcast: {
					scheduled_at: '2026-06-01T12:00:00.000Z',
				},
			});
		});

		it('builds broadcast:addRecipients body', () => {
			expect(
				build('broadcast', 'addRecipients', {
					broadcastRecipients: {
						recipientValues: [{ phoneNumber: '+14155550123' }],
					},
				}).body,
			).toEqual({
				whatsapp_broadcast: {
					recipients: [{ phone_number: '+14155550123' }],
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
						messageListConversationId: 'conv-123',
						messageListDirection: 'inbound',
						messageListStatus: 'delivered',
					},
				}).query,
			).toEqual({
				conversation_id: 'conv-123',
				direction: 'inbound',
				status: 'delivered',
				fields: 'kapso()',
			});
		});

		it('builds contact:list query from platform list options', () => {
			expect(
				build('contact', 'list', {
					platformListOptions: {
						contactProfileNameContains: 'Ana',
						listAfter: 'cursor-after',
					},
				}).query,
			).toEqual({
				profile_name_contains: 'Ana',
				after: 'cursor-after',
			});
		});

		it('builds conversation:list query from platform list options', () => {
			expect(
				build('conversation', 'list', {
					platformListOptions: {
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
						platformMessageConversationId: 'conv-123',
						platformMessageDirection: 'outbound',
						platformMessageType: 'template',
						platformMessageHasMedia: 'false',
						listBefore: 'cursor-before',
					},
				}).query,
			).toEqual({
				phone_number_id: PHONE,
				conversation_id: 'conv-123',
				direction: 'outbound',
				message_type: 'template',
				has_media: false,
				before: 'cursor-before',
			});
		});

		it('builds media:getUrl query with phone number id', () => {
			expect(
				build('media', 'getUrl', {
					mediaId: 'media-1',
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
