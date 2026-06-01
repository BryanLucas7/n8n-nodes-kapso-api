import { describe, expect, it } from 'vitest';
import { buildMessageRequest } from '../../nodes/KapsoApi/actions/routing';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

describe('message routing builders', () => {
	it('builds sendText with reply context from additional options', () => {
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'sendText',
			advancedOptions: {
				replyToMessageId: 'wamid.parent',
				linkPreview: true,
			},
		});

		const request = buildMessageRequest(ef, 'sendText', 0);

		expect(request.body).toMatchObject({
			to: '15551234567',
			type: 'text',
			context: { message_id: 'wamid.parent' },
			text: { preview_url: true, body: 'hello' },
		});
	});

	it('maps media operations to the correct media type', () => {
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'sendDocument',
			filename: 'invoice.pdf',
		});

		const request = buildMessageRequest(ef, 'sendDocument', 0);

		expect(request.path).toBe(`/${TEST_PHONE_NUMBER_ID}/messages`);
		expect(request.body).toMatchObject({
			type: 'document',
			document: {
				id: '425509551842',
				filename: 'invoice.pdf',
			},
		});
	});

	it('builds sendButtons from fixed collection values', () => {
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'sendButtons',
		});

		const request = buildMessageRequest(ef, 'sendButtons', 0);

		expect(request.body).toMatchObject({
			type: 'interactive',
			interactive: {
				type: 'button',
				action: {
					buttons: [{ type: 'reply', reply: { id: 'btn_yes', title: 'Yes' } }],
				},
			},
		});
	});
});
