import { describe, expect, it } from 'vitest';
import { messageLinkPreviewField } from '../../nodes/KapsoApi/properties/messageLinkPreview.fields';
import { messageSendOptionsField } from '../../nodes/KapsoApi/properties/messageSendOptions.fields';

describe('messageSendOptionsField', () => {
	it('does not expose Link Preview inside the collection', () => {
		const linkPreview = messageSendOptionsField.options?.find((field) => field.name === 'linkPreview');
		expect(linkPreview).toBeUndefined();
	});

	it('keeps Reply To Message ID optional in the collection without nested displayOptions', () => {
		const replyTo = messageSendOptionsField.options?.find((field) => field.name === 'replyToMessageId');
		expect(replyTo?.displayOptions).toBeUndefined();
		expect(replyTo?.type).toBe('string');
		expect(replyTo?.required).toBeUndefined();
		expect(messageSendOptionsField.displayOptions?.show?.operation).toContain('sendAudio');
		expect(messageSendOptionsField.displayOptions?.show?.operation).toContain('sendContact');
		expect(messageSendOptionsField.displayOptions?.show?.operation).not.toContain('sendTemplate');
		expect(messageSendOptionsField.displayOptions?.show?.operation).toContain('requestLocation');
		expect(messageSendOptionsField.displayOptions?.show?.operation).toContain('sendCallPermission');
	});

	it('exposes Link Preview as a top-level Send Text field', () => {
		expect(messageLinkPreviewField.name).toBe('linkPreview');
		expect(messageLinkPreviewField.displayOptions?.show?.operation).toEqual(['sendText']);
	});
});
