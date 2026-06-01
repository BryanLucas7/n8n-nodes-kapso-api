import { ApplicationError } from 'n8n-workflow';
import {
	BUTTON_ID_MAX,
	BUTTON_TITLE_MAX,
	CATALOG_ID_MAX,
	CTA_BUTTON_LABEL_MAX,
	CUSTOM_RELATIVE_PATH_MAX,
	DOCUMENT_FILENAME_MAX,
	DOWNLOAD_TOKEN_MAX,
	E164_PHONE_REGEX,
	EMOJI_MAX_LENGTH,
	FILTER_STRING_MAX,
	FLOW_CTA_MAX,
	FLOW_ID_MAX,
	FLOW_SCREEN_MAX,
	FLOW_TOKEN_MAX,
	INTERACTIVE_BODY_MAX,
	INTERACTIVE_FOOTER_MAX,
	INTERACTIVE_HEADER_MAX,
	LIST_BUTTON_TEXT_MAX,
	LIST_ROW_DESCRIPTION_MAX,
	LIST_ROW_ID_MAX,
	LIST_ROW_TITLE_MAX,
	LIST_SECTION_TITLE_MAX,
	MEDIA_CAPTION_MAX,
	META_PHONE_MAX,
	META_PHONE_MIN,
	META_PHONE_REGEX,
	PRODUCT_RETAILER_ID_MAX,
	TEXT_MESSAGE_MAX,
	URL_FIELD_MAX,
	UUID_MAX,
	UUID_REGEX,
} from '../properties/fieldConstraints';

export function parseCoordinate(value: string | number, label: string): number {
	const parsed = typeof value === 'number' ? value : Number(value);

	if (!Number.isFinite(parsed)) {
		throw new ApplicationError(`${label} must be a valid number.`);
	}

	return parsed;
}

export function assertInteractiveButtonCount(count: number): void {
	if (count < 1 || count > 3) {
		throw new ApplicationError('Interactive button messages support 1 to 3 buttons.');
	}
}

export function assertInteractiveListShape(sectionCount: number, rowCount: number): void {
	if (sectionCount < 1 || sectionCount > 10) {
		throw new ApplicationError('Interactive list messages support 1 to 10 sections.');
	}

	if (rowCount < 1 || rowCount > 10) {
		throw new ApplicationError('Interactive list messages support 1 to 10 rows in total.');
	}
}

export function assertProductListSectionCount(sectionCount: number): void {
	if (sectionCount < 1 || sectionCount > 10) {
		throw new ApplicationError('Product list messages support 1 to 10 sections.');
	}
}

export const PRODUCT_LIST_MAX_PRODUCTS = 30;

export function assertProductListShape(
	sections: Array<{ productRetailerIds: string[] }>,
): void {
	assertProductListSectionCount(sections.length);

	let totalProducts = 0;

	for (const section of sections) {
		if (section.productRetailerIds.length < 1) {
			throw new ApplicationError('Each product list section must include at least one product.');
		}

		totalProducts += section.productRetailerIds.length;
	}

	if (totalProducts > PRODUCT_LIST_MAX_PRODUCTS) {
		throw new ApplicationError(
			`Product list messages support at most ${PRODUCT_LIST_MAX_PRODUCTS} products in total.`,
		);
	}
}

export function requireNonEmptyString(value: string, label: string): string {
	const trimmed = value.trim();

	if (!trimmed) {
		throw new ApplicationError(`${label} is required.`);
	}

	return trimmed;
}

export function assertCustomRelativePath(value: string): void {
	if (value.length > CUSTOM_RELATIVE_PATH_MAX) {
		throw new ApplicationError(
			`Custom Relative Path must be at most ${CUSTOM_RELATIVE_PATH_MAX} characters.`,
		);
	}

	if (/(^|\/)\.\.($|\/)/.test(value)) {
		throw new ApplicationError('Custom Relative Path must not contain .. path segments.');
	}
}

export function assertMetaRecipientPhone(value: string): string {
	const trimmed = requireNonEmptyString(value, 'Recipient Phone');

	if (!new RegExp(`^${META_PHONE_REGEX}$`).test(trimmed)) {
		throw new ApplicationError(
			`Recipient Phone must be ${META_PHONE_MIN}-${META_PHONE_MAX} digits without +, spaces, or letters (Meta send API format).`,
		);
	}

	return trimmed;
}

export function assertE164Phone(value: string, label = 'Phone Number'): string {
	const trimmed = requireNonEmptyString(value, label);

	if (!new RegExp(`^${E164_PHONE_REGEX}$`).test(trimmed)) {
		throw new ApplicationError(
			`${label} must be in E.164 format with + (for example +15551234567).`,
		);
	}

	return trimmed;
}

export function assertWhatsAppMediaId(value: string, label = 'Media ID'): string {
	const trimmed = requireNonEmptyString(value, label);

	if (!/^\d+$/.test(trimmed)) {
		throw new ApplicationError(
			`${label} must contain digits only (use the ID returned by Upload Media).`,
		);
	}

	return trimmed;
}

export function assertPublicMediaUrl(value: string, label = 'Public URL'): string {
	const trimmed = requireNonEmptyString(value, label);

	try {
		const parsed = new URL(trimmed);
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			throw new ApplicationError(`${label} must use http:// or https://.`);
		}
	} catch (error) {
		if (error instanceof ApplicationError) {
			throw error;
		}

		throw new ApplicationError(`${label} must be a valid URL.`);
	}

	return trimmed;
}

export function assertWamid(value: string, label: string): string {
	const trimmed = requireNonEmptyString(value, label);

	if (!/^wamid\./i.test(trimmed)) {
		throw new ApplicationError(`${label} must start with wamid. (WhatsApp message ID).`);
	}

	return trimmed;
}

export function assertReactionEmoji(value: string): string {
	const trimmed = requireNonEmptyString(value, 'Emoji');

	if (/[A-Za-z]/.test(trimmed)) {
		throw new ApplicationError('Emoji must be a single emoji character, not text or letters.');
	}

	if (trimmed.length > EMOJI_MAX_LENGTH) {
		throw new ApplicationError('Emoji value is too long for a WhatsApp reaction.');
	}

	return trimmed;
}

export function assertMaxLength(value: string, max: number, label: string): string {
	if (value.length > max) {
		throw new ApplicationError(`${label} must be at most ${max} characters.`);
	}

	return value;
}

export function validateOptionalMaxLength(
	value: string | undefined,
	max: number,
	label: string,
): string | undefined {
	if (!value) {
		return undefined;
	}

	return assertMaxLength(value, max, label);
}

export function validateTextMessageBody(body: string): string {
	return assertMaxLength(requireNonEmptyString(body, 'Text'), TEXT_MESSAGE_MAX, 'Text');
}

export function validateInteractiveBodyText(body: string, label = 'Body Text'): string {
	return assertMaxLength(requireNonEmptyString(body, label), INTERACTIVE_BODY_MAX, label);
}

export function validateMediaCaption(caption: string | undefined): string | undefined {
	return validateOptionalMaxLength(caption?.trim() || undefined, MEDIA_CAPTION_MAX, 'Caption');
}

export function validateInteractiveHeaderText(text: string): string {
	return assertMaxLength(requireNonEmptyString(text, 'Header Text'), INTERACTIVE_HEADER_MAX, 'Header Text');
}

export function validateInteractiveFooterText(text: string | undefined): string | undefined {
	return validateOptionalMaxLength(text?.trim() || undefined, INTERACTIVE_FOOTER_MAX, 'Footer Text');
}

export function validateButtonId(buttonId: string): string {
	return assertMaxLength(requireNonEmptyString(buttonId, 'Button ID'), BUTTON_ID_MAX, 'Button ID');
}

export function validateButtonTitle(buttonTitle: string): string {
	return assertMaxLength(
		requireNonEmptyString(buttonTitle, 'Button Title'),
		BUTTON_TITLE_MAX,
		'Button Title',
	);
}

export function validateListButtonText(buttonText: string): string {
	return assertMaxLength(
		requireNonEmptyString(buttonText, 'List Button Text'),
		LIST_BUTTON_TEXT_MAX,
		'List Button Text',
	);
}

export function validateListSectionTitle(sectionTitle: string): string {
	return assertMaxLength(
		requireNonEmptyString(sectionTitle, 'Section Title'),
		LIST_SECTION_TITLE_MAX,
		'Section Title',
	);
}

export function validateListRowId(rowId: string): string {
	return assertMaxLength(requireNonEmptyString(rowId, 'Row ID'), LIST_ROW_ID_MAX, 'Row ID');
}

export function validateListRowTitle(rowTitle: string): string {
	return assertMaxLength(
		requireNonEmptyString(rowTitle, 'Row Title'),
		LIST_ROW_TITLE_MAX,
		'Row Title',
	);
}

export function validateListRowDescription(description: string | undefined): string | undefined {
	return validateOptionalMaxLength(
		description?.trim() || undefined,
		LIST_ROW_DESCRIPTION_MAX,
		'Row Description',
	);
}

export function validateCtaButtonLabel(label: string, fieldLabel = 'Button Label'): string {
	return assertMaxLength(
		requireNonEmptyString(label, fieldLabel),
		CTA_BUTTON_LABEL_MAX,
		fieldLabel,
	);
}

export function validateFlowCta(label: string): string {
	return assertMaxLength(requireNonEmptyString(label, 'Flow CTA'), FLOW_CTA_MAX, 'Flow CTA');
}

export function validateHttpUrl(value: string, label = 'URL'): string {
	return assertMaxLength(assertPublicMediaUrl(value, label), URL_FIELD_MAX, label);
}

export function validateOptionalHttpUrl(value: string | undefined, label: string): string | undefined {
	if (!value?.trim()) {
		return undefined;
	}

	return validateHttpUrl(value, label);
}

export function validateDocumentFilename(value: string | undefined, label = 'Filename'): string | undefined {
	return validateOptionalMaxLength(value?.trim() || undefined, DOCUMENT_FILENAME_MAX, label);
}

export function validateCatalogId(value: string): string {
	return assertMaxLength(requireNonEmptyString(value, 'Catalog ID'), CATALOG_ID_MAX, 'Catalog ID');
}

export function validateProductRetailerId(value: string, label = 'Product Retailer ID'): string {
	return assertMaxLength(
		requireNonEmptyString(value, label),
		PRODUCT_RETAILER_ID_MAX,
		label,
	);
}

export function validateFlowToken(value: string): string {
	return assertMaxLength(requireNonEmptyString(value, 'Flow token'), FLOW_TOKEN_MAX, 'Flow token');
}

export function validateFlowScreen(value: string | undefined): string | undefined {
	return validateOptionalMaxLength(value?.trim() || undefined, FLOW_SCREEN_MAX, 'Flow Screen');
}

export function validateFlowId(value: string | undefined): string | undefined {
	return validateOptionalMaxLength(value?.trim() || undefined, FLOW_ID_MAX, 'Flow ID');
}

export function assertUuid(value: string, label: string): string {
	const trimmed = requireNonEmptyString(value, label);

	if (trimmed.length > UUID_MAX) {
		throw new ApplicationError(`${label} must be at most ${UUID_MAX} characters.`);
	}

	if (!new RegExp(`^${UUID_REGEX}$`, 'i').test(trimmed)) {
		throw new ApplicationError(`${label} must be a valid UUID.`);
	}

	return trimmed;
}

export function validateOptionalUuid(value: string | undefined, label: string): string | undefined {
	if (!value?.trim()) {
		return undefined;
	}

	return assertUuid(value.trim(), label);
}

export function validateFilterString(value: string | undefined, label: string): string | undefined {
	return validateOptionalMaxLength(value?.trim() || undefined, FILTER_STRING_MAX, label);
}

export function validateDownloadToken(value: string): string {
	return assertMaxLength(
		requireNonEmptyString(value, 'Download Token'),
		DOWNLOAD_TOKEN_MAX,
		'Download Token',
	);
}
