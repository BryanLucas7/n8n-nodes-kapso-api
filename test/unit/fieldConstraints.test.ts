import { describe, expect, it } from 'vitest';
import { messageBodyFields } from '../../nodes/KapsoApi/properties/messageBody.fields';
import {
	BUTTON_ID_MAX,
	BUTTON_TITLE_MAX,
	CATALOG_ID_MAX,
	DOCUMENT_FILENAME_MAX,
	FILTER_STRING_MAX,
	FLOW_TOKEN_MAX,
	LIST_BUTTON_TEXT_MAX,
	LIST_ROW_DESCRIPTION_MAX,
	LIST_ROW_ID_MAX,
	LIST_ROW_TITLE_MAX,
	LIST_SECTION_TITLE_MAX,
	MEDIA_ID_MAX_LENGTH,
	maxLengthRegexPattern,
	maxLengthRegexValidation,
	PRODUCT_RETAILER_ID_MAX,
	TEXT_MESSAGE_MAX,
	URL_FIELD_MAX,
	UUID_MAX,
	buttonIdField,
	buttonTitleField,
	catalogIdField,
	documentFilenameField,
	e164PhoneResourceLocatorField,
	filterStringField,
	flowTokenField,
	httpUrlStringField,
	listButtonTextField,
	listRowDescriptionField,
	listRowIdField,
	listRowTitleField,
	listSectionTitleField,
	mediaIdStringField,
	metaPhoneResourceLocatorField,
	productRetailerIdField,
	textMessageField,
	uuidResourceLocatorIdMode,
	uuidStringField,
} from '../../nodes/KapsoApi/properties/fieldConstraints';

type ConstrainedField = {
	type?: string;
	typeOptions?: { maxLength?: number; rows?: number };
	placeholder?: string;
	validation?: Array<{ type?: string; properties?: { regex?: string } }>;
	modes?: Array<{
		typeOptions?: { maxLength?: number; rows?: number };
		placeholder?: string;
		validation?: Array<{ type?: string; properties?: { regex?: string } }>;
	}>;
};

function maxLengthOf(field: ConstrainedField): number | undefined {
	return field.typeOptions?.maxLength ?? field.modes?.[0]?.typeOptions?.maxLength;
}

function rowsOf(field: ConstrainedField): number | undefined {
	return field.typeOptions?.rows ?? field.modes?.[0]?.typeOptions?.rows;
}

function placeholderOf(field: ConstrainedField): string | undefined {
	return field.placeholder ?? field.modes?.[0]?.placeholder;
}

function regexValidationOf(field: ConstrainedField): { type?: string; regex?: string } | undefined {
	const entry = field.validation?.[0] ?? field.modes?.[0]?.validation?.[0];
	return entry ? { type: entry.type, regex: entry.properties?.regex } : undefined;
}

describe('fieldConstraints', () => {
	it('applies Meta text limits to message fields', () => {
		expect(maxLengthOf(textMessageField({ show: {} }))).toBe(TEXT_MESSAGE_MAX);
		expect(maxLengthOf(listButtonTextField({ show: {} }))).toBe(LIST_BUTTON_TEXT_MAX);
		expect(maxLengthOf(buttonTitleField())).toBe(BUTTON_TITLE_MAX);
		expect(maxLengthOf(buttonIdField())).toBe(BUTTON_ID_MAX);
		expect(maxLengthOf(listSectionTitleField())).toBe(LIST_SECTION_TITLE_MAX);
		expect(maxLengthOf(listRowIdField())).toBe(LIST_ROW_ID_MAX);
		expect(maxLengthOf(listRowTitleField())).toBe(LIST_ROW_TITLE_MAX);
		expect(maxLengthOf(listRowDescriptionField())).toBe(LIST_ROW_DESCRIPTION_MAX);
		expect(textMessageField({ show: {} }).type).toBe('resourceLocator');
	});

	it('applies media ID max length to header media fields', () => {
		expect(maxLengthOf(mediaIdStringField('mediaId', 'Media ID'))).toBe(MEDIA_ID_MAX_LENGTH);
	});

	it('adds max-length regex validation to limited string fields', () => {
		expect(maxLengthRegexPattern(LIST_ROW_TITLE_MAX, false)).toBe(`.{1,${LIST_ROW_TITLE_MAX}}`);
		expect(maxLengthRegexPattern(LIST_ROW_DESCRIPTION_MAX, true)).toBe(
			`.{0,${LIST_ROW_DESCRIPTION_MAX}}`,
		);

		const requiredRow = regexValidationOf(listRowTitleField());
		expect(requiredRow?.type).toBe('regex');
		expect(requiredRow?.regex).toBe(maxLengthRegexPattern(LIST_ROW_TITLE_MAX, false));

		const optionalRow = regexValidationOf(listRowDescriptionField());
		expect(optionalRow?.regex).toBe(maxLengthRegexPattern(LIST_ROW_DESCRIPTION_MAX, true));

		const flowToken = regexValidationOf(flowTokenField());
		expect(flowToken?.type).toBe('regex');
		expect(maxLengthRegexValidation(FLOW_TOKEN_MAX, { optional: true, label: 'Flow Token' }).properties
			.regex).toBe(maxLengthRegexPattern(FLOW_TOKEN_MAX, true));
	});

	it('configures phone resource locators with regex validation', () => {
		const metaPhone = metaPhoneResourceLocatorField('recipient', 'Recipient Phone');
		const e164Phone = e164PhoneResourceLocatorField('contactWaId', 'WhatsApp ID');

		expect(metaPhone.type).toBe('resourceLocator');
		expect(metaPhone.hint).toBeUndefined();
		expect(metaPhone.description).toContain('8-15 digits');
		expect(metaPhone.modes?.[0]?.validation?.[0]?.type).toBe('regex');
		expect(metaPhone.modes?.[0]?.typeOptions?.maxLength).toBe(15);

		expect(e164Phone.type).toBe('resourceLocator');
		expect(e164Phone.hint).toBeUndefined();
		expect(e164Phone.description).toContain('E.164');
		expect(e164Phone.modes?.[0]?.validation?.[0]?.type).toBe('regex');
		expect(e164Phone.modes?.[0]?.typeOptions?.maxLength).toBe(16);
	});

	it('applies phase 2 URL and catalog field limits', () => {
		expect(maxLengthOf(httpUrlStringField('ctaButtonUrl', 'Button URL', { show: {} }))).toBe(URL_FIELD_MAX);
		expect(httpUrlStringField('ctaButtonUrl', 'Button URL', { show: {} }).hint).toBeUndefined();
		expect(catalogIdField({ show: {} }).type).toBe('resourceLocator');
		expect(catalogIdField({ show: {} }).description).toContain('Catalog');
		expect(productRetailerIdField().type).toBe('resourceLocator');
		expect(productRetailerIdField().description).toContain('Catalog');
		expect(flowTokenField({ show: {} }).description).toContain('Send Flow');
		expect(maxLengthOf(flowTokenField())).toBe(FLOW_TOKEN_MAX);
		expect(maxLengthOf(documentFilenameField('filename', 'Filename'))).toBe(DOCUMENT_FILENAME_MAX);
	});

	it('applies phase 3 UUID and filter limits', () => {
		expect(maxLengthOf(uuidStringField('whatsappContactId', 'Contact ID'))).toBe(UUID_MAX);
		expect(maxLengthOf(filterStringField('contactWaIdContains', 'WhatsApp ID Contains'))).toBe(
			FILTER_STRING_MAX,
		);
		expect(uuidResourceLocatorIdMode('conversation-uuid').validation?.[0]?.type).toBe('regex');
	});

	it('uses a single-line prompt for Request Location instead of a large body textarea', () => {
		const locationPrompt = messageBodyFields.find(
			(field) =>
				field.name === 'bodyText' &&
				field.displayOptions?.show?.operation?.includes('requestLocation'),
		);

		expect(locationPrompt?.displayName).toBe('Location Request Prompt');
		expect(rowsOf(locationPrompt ?? {})).toBeUndefined();
		expect(placeholderOf(locationPrompt ?? {})).toContain('share your location');
	});
});
