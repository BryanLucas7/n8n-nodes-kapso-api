import { INodeProperties, INodePropertyModeTypeOptions } from 'n8n-workflow';

export const META_PHONE_MIN = 8;
export const META_PHONE_MAX = 15;
export const META_PHONE_PLACEHOLDER = '15551234567';
export const META_PHONE_REGEX = String.raw`\d{8,15}`;
export const META_PHONE_HINT = `Numbers only, ${META_PHONE_MIN}-${META_PHONE_MAX} digits, no + or spaces`;
export const META_PHONE_DESCRIPTION =
	'Recipient phone number: 8-15 digits, no + or spaces (Meta WhatsApp send API)';

export const E164_PHONE_MAX = 16;
export const E164_PHONE_PLACEHOLDER = '+15551234567';
export const E164_PHONE_REGEX = String.raw`\+[1-9]\d{1,14}`;
export const E164_PHONE_HINT = 'E.164 format with +, 8-16 characters total';
export const E164_PHONE_DESCRIPTION =
	'Phone number in E.164 format with plus sign (Kapso Platform API)';

export const TEXT_MESSAGE_MAX = 4096;
export const INTERACTIVE_BODY_MAX = 1024;
export const MEDIA_CAPTION_MAX = 1024;
export const INTERACTIVE_HEADER_MAX = 60;
export const INTERACTIVE_FOOTER_MAX = 60;
export const BUTTON_TITLE_MAX = 20;
export const BUTTON_ID_MAX = 256;
export const LIST_BUTTON_TEXT_MAX = 20;
export const LIST_SECTION_TITLE_MAX = 24;
export const LIST_ROW_TITLE_MAX = 24;
export const LIST_ROW_DESCRIPTION_MAX = 72;
export const LIST_ROW_ID_MAX = 200;
export const CTA_BUTTON_LABEL_MAX = 20;

export const URL_FIELD_MAX = 2048;
export const DOCUMENT_FILENAME_MAX = 240;
export const CATALOG_ID_MAX = 64;
export const PRODUCT_RETAILER_ID_MAX = 100;
export const FLOW_TOKEN_MAX = 128;
export const FLOW_SCREEN_MAX = 64;
export const FLOW_CTA_MAX = 30;
export const FLOW_ID_MAX = 64;
export const FLOW_NAME_MAX = 128;

export const UUID_MAX = 36;
export const UUID_REGEX = String.raw`[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`;
export const DOWNLOAD_TOKEN_MAX = 512;
export const CUSTOM_RELATIVE_PATH_MAX = 256;
export const FILTER_STRING_MAX = 128;
export const JSON_PAYLOAD_MAX_BYTES = 65536;
export const CUSTOMER_ID_MAX = 36;

export const MEDIA_ID_HINT = 'Digits only (ID returned by Upload Media)';
export const MEDIA_ID_MAX_LENGTH = 32;

export const WAMID_HINT = 'WhatsApp message ID starting with wamid.';
export const WAMID_MAX_LENGTH = 256;

export const EMOJI_HINT = 'Single emoji only (for example 👍)';
export const EMOJI_MAX_LENGTH = 8;

type LimitedFieldOptions = {
	displayOptions?: INodeProperties['displayOptions'];
	required?: boolean;
	default?: string;
	rows?: number;
	placeholder?: string;
	description?: string;
};

export const metaPhoneRegexValidation = {
	type: 'regex' as const,
	properties: {
		regex: META_PHONE_REGEX,
		errorMessage: `Use ${META_PHONE_MIN}-${META_PHONE_MAX} digits only, without + or spaces`,
	},
};

export const e164PhoneRegexValidation = {
	type: 'regex' as const,
	properties: {
		regex: E164_PHONE_REGEX,
		errorMessage: 'Use E.164 format with + (for example +15551234567)',
	},
};

export const uuidRegexValidation = {
	type: 'regex' as const,
	properties: {
		regex: UUID_REGEX,
		errorMessage: 'Use a valid UUID (for example 550e8400-e29b-41d4-a716-446655440000)',
	},
};

export function limitedStringField(
	name: string,
	displayName: string,
	maxLength: number,
	options: LimitedFieldOptions = {},
): INodeProperties {
	// eslint-disable-next-line n8n-nodes-base/node-param-default-missing -- factory helper; callers inherit default: ''
	return {
		displayName,
		name,
		type: 'string',
		default: options.default ?? '',
		...(options.required !== undefined ? { required: options.required } : {}),
		...(options.placeholder ? { placeholder: options.placeholder } : {}),
		...(options.description ? { description: options.description } : {}),
		...(options.displayOptions ? { displayOptions: options.displayOptions } : {}),
		typeOptions: {
			maxLength,
			...(options.rows ? { rows: options.rows } : {}),
		},
	};
}

export function metaPhoneResourceLocatorField(
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
	description = META_PHONE_DESCRIPTION,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		default: { mode: 'phone', value: '' },
		required: true,
		modes: [
			{
				displayName: 'Phone Number',
				name: 'phone',
				type: 'string',
				placeholder: META_PHONE_PLACEHOLDER,
				typeOptions: {
					maxLength: META_PHONE_MAX,
				} as unknown as INodePropertyModeTypeOptions,
				validation: [metaPhoneRegexValidation],
			},
		],
		...(displayOptions ? { displayOptions } : {}),
		description,
		hint: META_PHONE_HINT,
	};
}

export function e164PhoneResourceLocatorField(
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
	description = E164_PHONE_DESCRIPTION,
	required = true,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		default: { mode: 'phone', value: '' },
		required,
		modes: [
			{
				displayName: 'Phone Number',
				name: 'phone',
				type: 'string',
				placeholder: E164_PHONE_PLACEHOLDER,
				typeOptions: {
					maxLength: E164_PHONE_MAX,
				} as unknown as INodePropertyModeTypeOptions,
				validation: [e164PhoneRegexValidation],
			},
		],
		...(displayOptions ? { displayOptions } : {}),
		description,
		hint: E164_PHONE_HINT,
	};
}

export function mediaIdStringField(
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
	required = true,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		hint: MEDIA_ID_HINT,
		typeOptions: {
			maxLength: MEDIA_ID_MAX_LENGTH,
		},
		...(displayOptions ? { displayOptions } : {}),
		description: MEDIA_ID_HINT,
		...(required ? { required: true } : {}),
	};
}

export function publicUrlStringField(
	name: string,
	displayName: string,
	displayOptions: INodeProperties['displayOptions'],
	description = 'Public HTTPS URL of the media file',
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		required: true,
		validateType: 'url',
		typeOptions: {
			maxLength: URL_FIELD_MAX,
		},
		displayOptions,
		description,
	};
}

export function httpUrlStringField(
	name: string,
	displayName: string,
	displayOptions: INodeProperties['displayOptions'],
	options: { required?: boolean; description?: string; placeholder?: string } = {},
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		validateType: 'url',
		typeOptions: {
			maxLength: URL_FIELD_MAX,
		},
		displayOptions,
		...(options.required !== undefined ? { required: options.required } : { required: true }),
		...(options.description ? { description: options.description } : {}),
		...(options.placeholder ? { placeholder: options.placeholder } : {}),
	};
}

export function documentFilenameField(
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	return limitedStringField(name, displayName, DOCUMENT_FILENAME_MAX, { displayOptions });
}

export function catalogIdField(displayOptions: INodeProperties['displayOptions']): INodeProperties {
	return limitedStringField('catalogId', 'Catalog ID', CATALOG_ID_MAX, {
		displayOptions,
		required: true,
	});
}

export function productRetailerIdField(
	name = 'productRetailerId',
	displayName = 'Product Retailer ID',
	displayOptions?: INodeProperties['displayOptions'],
	required = true,
): INodeProperties {
	return limitedStringField(name, displayName, PRODUCT_RETAILER_ID_MAX, {
		displayOptions,
		required,
	});
}

export function flowCtaField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return limitedStringField('flowCta', 'Flow Button Label', FLOW_CTA_MAX, {
		displayOptions,
		required: true,
	});
}

export function flowTokenField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return {
		displayName: 'Flow Token',
		name: 'flowToken',
		type: 'string',
		default: '',
		required: true,
		hint: `Up to ${FLOW_TOKEN_MAX} characters`,
		typeOptions: {
			maxLength: FLOW_TOKEN_MAX,
			password: true,
		},
		displayOptions,
		description: 'Session token for correlating Flow responses',
	};
}

export function flowScreenField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return limitedStringField('flowScreen', 'Flow Screen', FLOW_SCREEN_MAX, { displayOptions });
}

export function flowIdField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return limitedStringField('flowId', 'Flow ID', FLOW_ID_MAX, { displayOptions });
}

export function uuidStringField(
	name: string,
	displayName: string,
	options: LimitedFieldOptions & { description?: string } = {},
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		...(options.required !== undefined ? { required: options.required } : {}),
		...(options.description ? { description: options.description } : {}),
		...(options.displayOptions ? { displayOptions: options.displayOptions } : {}),
		...(options.placeholder ? { placeholder: options.placeholder } : {}),
		typeOptions: {
			maxLength: UUID_MAX,
		},
	};
}

export function filterStringField(
	name: string,
	displayName: string,
	description?: string,
): INodeProperties {
	return limitedStringField(name, displayName, FILTER_STRING_MAX, { description });
}

export function uuidResourceLocatorIdMode(placeholder: string) {
	return {
		displayName: 'By ID',
		name: 'id',
		type: 'string' as const,
		placeholder,
		typeOptions: {
			maxLength: UUID_MAX,
		} as unknown as INodePropertyModeTypeOptions,
		validation: [uuidRegexValidation],
	};
}

export function wamidStringField(
	name: string,
	displayName: string,
	displayOptions: INodeProperties['displayOptions'],
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		required: true,
		hint: WAMID_HINT,
		typeOptions: {
			maxLength: WAMID_MAX_LENGTH,
		},
		displayOptions,
		description: WAMID_HINT,
	};
}

export function emojiStringField(displayOptions: INodeProperties['displayOptions']): INodeProperties {
	return {
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '👍',
		required: true,
		hint: EMOJI_HINT,
		typeOptions: {
			maxLength: EMOJI_MAX_LENGTH,
		},
		displayOptions,
		description: 'Single emoji only (for example 👍). Text and letters are not accepted.',
	};
}

export const textMessageField = (displayOptions: INodeProperties['displayOptions']): INodeProperties =>
	limitedStringField('textBody', 'Text', TEXT_MESSAGE_MAX, {
		displayOptions,
		required: true,
		rows: 4,
	});

export const interactiveBodyField = (
	name: string,
	displayName: string,
	displayOptions: INodeProperties['displayOptions'],
	required = true,
): INodeProperties =>
	limitedStringField(name, displayName, INTERACTIVE_BODY_MAX, {
		displayOptions,
		required,
		rows: 3,
	});

export const mediaCaptionField = (displayOptions: INodeProperties['displayOptions']): INodeProperties =>
	limitedStringField('caption', 'Caption', MEDIA_CAPTION_MAX, { displayOptions });

export const interactiveHeaderTextField = (
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties =>
	limitedStringField(name, displayName, INTERACTIVE_HEADER_MAX, { displayOptions });

export const interactiveFooterTextField = (
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties =>
	limitedStringField(name, displayName, INTERACTIVE_FOOTER_MAX, { displayOptions });

export const buttonIdField = (): INodeProperties =>
	limitedStringField('buttonId', 'Button ID', BUTTON_ID_MAX, { required: true });

export const buttonTitleField = (): INodeProperties =>
	limitedStringField('buttonTitle', 'Button Title', BUTTON_TITLE_MAX, { required: true });

export const listButtonTextField = (displayOptions: INodeProperties['displayOptions']): INodeProperties =>
	limitedStringField('listButtonText', 'List Button Text', LIST_BUTTON_TEXT_MAX, {
		displayOptions,
		required: true,
	});

export const listSectionTitleField = (): INodeProperties =>
	limitedStringField('sectionTitle', 'Section Title', LIST_SECTION_TITLE_MAX, { required: true });

export const listRowIdField = (): INodeProperties =>
	limitedStringField('rowId', 'Row ID', LIST_ROW_ID_MAX, { required: true });

export const listRowTitleField = (): INodeProperties =>
	limitedStringField('rowTitle', 'Row Title', LIST_ROW_TITLE_MAX, { required: true });

export const listRowDescriptionField = (): INodeProperties =>
	limitedStringField('rowDescription', 'Row Description', LIST_ROW_DESCRIPTION_MAX);

export const ctaButtonLabelField = (displayOptions: INodeProperties['displayOptions']): INodeProperties =>
	limitedStringField('ctaButtonLabel', 'Button Label', CTA_BUTTON_LABEL_MAX, {
		displayOptions,
		required: true,
	});
