import { describe, expect, it } from 'vitest';
import {
	containsWhatsAppFormatting,
	stripWhatsAppFormatting,
} from '../../nodes/KapsoApi/actions/whatsappFormatting';
import { validateInteractiveHeaderText } from '../../nodes/KapsoApi/actions/validation';

describe('whatsappFormatting', () => {
	it('strips bold markers from interactive header text', () => {
		expect(stripWhatsAppFormatting('*Restou mais alguma dúvida?*')).toBe('Restou mais alguma dúvida?');
	});

	it('detects whatsapp formatting markers', () => {
		expect(containsWhatsAppFormatting('*bold*')).toBe(true);
		expect(containsWhatsAppFormatting('plain text')).toBe(false);
	});

	it('validateInteractiveHeaderText removes markdown before length checks', () => {
		expect(validateInteractiveHeaderText('*Barbeirada Club*')).toBe('Barbeirada Club');
	});
});
