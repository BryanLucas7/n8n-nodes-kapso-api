import { describe, expect, it } from 'vitest';
import { SEND_AND_WAIT_OPERATION } from 'n8n-workflow';
import {
	messageReplyOperations,
	messageSendOperations,
} from '../../nodes/KapsoApi/actions/operations';

describe('messageReplyOperations', () => {
	const sendOps = new Set(messageSendOperations);

	it('covers every send operation that Meta supports as a contextual reply', () => {
		const supported = new Set([
			'sendText',
			'sendImage',
			'sendVideo',
			'sendAudio',
			'sendDocument',
			'sendSticker',
			'sendLocation',
			'requestLocation',
			'sendButtons',
			'sendList',
			'sendCta',
			'sendProduct',
			'sendProductList',
			'sendCatalog',
			'sendFlow',
			'sendCallPermission',
			'sendContact',
			SEND_AND_WAIT_OPERATION,
		]);

		const excluded = new Set(['sendTemplate', 'sendReaction']);

		for (const operation of messageReplyOperations) {
			expect(supported.has(operation)).toBe(true);
			expect(excluded.has(operation)).toBe(false);
			expect(sendOps.has(operation)).toBe(true);
		}

		for (const operation of supported) {
			expect(messageReplyOperations).toContain(operation);
		}

		for (const operation of excluded) {
			expect(messageReplyOperations).not.toContain(operation);
		}
	});
});
