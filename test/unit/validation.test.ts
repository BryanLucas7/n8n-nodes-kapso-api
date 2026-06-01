import { describe, expect, it } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import {
	assertE164Phone,
	assertMaxLength,
	assertMetaRecipientPhone,
	assertPublicMediaUrl,
	assertReactionEmoji,
	assertUuid,
	assertWamid,
	assertWhatsAppMediaId,
	validateButtonTitle,
	validateCatalogId,
	validateFlowToken,
	validateHttpUrl,
	validateInteractiveBodyText,
	validateListRowDescription,
	validateTextMessageBody,
} from '../../nodes/KapsoApi/actions/validation';
import {
	BUTTON_TITLE_MAX,
	CATALOG_ID_MAX,
	FLOW_TOKEN_MAX,
	INTERACTIVE_BODY_MAX,
	LIST_ROW_DESCRIPTION_MAX,
	TEXT_MESSAGE_MAX,
} from '../../nodes/KapsoApi/properties/fieldConstraints';

describe('field validation', () => {
	it('accepts Meta recipient phone numbers', () => {
		expect(assertMetaRecipientPhone('15551234567')).toBe('15551234567');
	});

	it('accepts E.164 platform phone numbers', () => {
		expect(assertE164Phone('+15551234567')).toBe('+15551234567');
	});

	it('rejects invalid E.164 phone numbers', () => {
		expect(() => assertE164Phone('15551234567')).toThrow(ApplicationError);
	});

	it('rejects recipient phones with letters or plus sign', () => {
		expect(() => assertMetaRecipientPhone('+15551234567')).toThrow(ApplicationError);
		expect(() => assertMetaRecipientPhone('abc')).toThrow(ApplicationError);
	});

	it('rejects recipient phones longer than 15 digits', () => {
		expect(() => assertMetaRecipientPhone('545454545454545454545454545454545454')).toThrow(
			ApplicationError,
		);
	});

	it('accepts numeric WhatsApp media IDs', () => {
		expect(assertWhatsAppMediaId('425509551842')).toBe('425509551842');
	});

	it('rejects media IDs with letters', () => {
		expect(() => assertWhatsAppMediaId('media-abc')).toThrow(ApplicationError);
	});

	it('accepts public media URLs', () => {
		expect(assertPublicMediaUrl('https://example.com/image.png')).toBe(
			'https://example.com/image.png',
		);
	});

	it('rejects invalid public media URLs', () => {
		expect(() => assertPublicMediaUrl('not-a-url')).toThrow(ApplicationError);
	});

	it('accepts wamid message IDs', () => {
		expect(assertWamid('wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBJ', 'Message ID')).toBe(
			'wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBJ',
		);
	});

	it('rejects reaction emoji with letters', () => {
		expect(() => assertReactionEmoji('👍 sdadsads')).toThrow(ApplicationError);
		expect(assertReactionEmoji('👍')).toBe('👍');
	});

	it('rejects values longer than Meta limits', () => {
		const longText = 'a'.repeat(TEXT_MESSAGE_MAX + 1);
		const longBody = 'b'.repeat(INTERACTIVE_BODY_MAX + 1);
		const longButtonTitle = 'c'.repeat(BUTTON_TITLE_MAX + 1);
		const longRowDescription = 'd'.repeat(LIST_ROW_DESCRIPTION_MAX + 1);

		expect(() => assertMaxLength('ok', 3, 'Field')).not.toThrow();
		expect(() => assertMaxLength('toolong', 3, 'Field')).toThrow(ApplicationError);
		expect(() => validateTextMessageBody(longText)).toThrow(/4096/);
		expect(() => validateInteractiveBodyText(longBody)).toThrow(/1024/);
		expect(() => validateButtonTitle(longButtonTitle)).toThrow(/20/);
		expect(() => validateListRowDescription(longRowDescription)).toThrow(/72/);
	});

	it('validates phase 2 and phase 3 field limits', () => {
		expect(validateHttpUrl('https://example.com/promo', 'Button URL')).toBe('https://example.com/promo');
		expect(validateCatalogId('CATALOG_1')).toBe('CATALOG_1');
		expect(validateFlowToken('token-abc')).toBe('token-abc');
		expect(assertUuid('550e8400-e29b-41d4-a716-446655440000', 'Conversation ID')).toBe(
			'550e8400-e29b-41d4-a716-446655440000',
		);

		expect(() => assertUuid('conv-123', 'Conversation ID')).toThrow(ApplicationError);
		expect(() => validateHttpUrl('not-a-url', 'Button URL')).toThrow(ApplicationError);
		expect(() => validateCatalogId('x'.repeat(CATALOG_ID_MAX + 1))).toThrow(/64/);
		expect(() => validateFlowToken('t'.repeat(FLOW_TOKEN_MAX + 1))).toThrow(/128/);
	});
});
