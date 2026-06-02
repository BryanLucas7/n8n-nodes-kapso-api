import { INodeProperties, INodePropertyModeTypeOptions } from 'n8n-workflow';
import {
	KAPSO_DOCS,
	withKapsoDoc,
} from './expressionHints';
import { optionalLabel } from './displayNames';

export const META_PHONE_MIN = 8;
export const META_PHONE_MAX = 15;
export const META_PHONE_PLACEHOLDER = '15551234567';
export const META_PHONE_REGEX = String.raw`\d{8,15}`;
export const META_PHONE_HINT = `Numbers only, ${META_PHONE_MIN}-${META_PHONE_MAX} digits, no + or spaces`;
export const META_PHONE_DESCRIPTION =
	'Recipient phone number in Meta format: 8-15 digits, no + or spaces.';

export const E164_PHONE_MAX = 16;
export const E164_PHONE_PLACEHOLDER = '+15551234567';
export const E164_PHONE_REGEX = String.raw`\+[1-9]\d{1,14}`;
export const E164_PHONE_HINT = 'E.164 format with +, 8-16 characters total';
export const E164_PHONE_DESCRIPTION =
	'Phone number in E.164 format with leading + (Kapso Platform API).';

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
export const FLOW_CTA_MAX = 20;
export const FLOW_ID_MAX = 64;
export const FLOW_NAME_MAX = 128;

export const UUID_MAX = 36;
export const UUID_REGEX = String.raw`[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`;
export const DOWNLOAD_TOKEN_MAX = 512;
export const CUSTOM_RELATIVE_PATH_MAX = 256;
export const FILTER_STRING_MAX = 128;
export const JSON_PAYLOAD_MAX_BYTES = 65536;
export const CUSTOMER_ID_MAX = 36;

export const MEDIA_ID_HINT = 'Digits only (ID returned by Upload Media or Kapso Trigger media attachment)';
export const MEDIA_ID_MAX_LENGTH = 32;

export const WAMID_HINT =
	'WhatsApp message ID (WAMID), usually starting with wamid.';
export const WAMID_MAX_LENGTH = 256;

export const EMOJI_FORMAT_HINT = 'Single emoji only (for example 👍)';
export const EMOJI_MAX_LENGTH = 8;

type LimitedFieldOptions = {
	displayOptions?: INodeProperties['displayOptions'];
	required?: boolean;
	optional?: boolean;
	default?: string;
	rows?: number;
	placeholder?: string;
	description?: string;
	hint?: string;
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
	const isOptional = options.optional ?? options.required === false;
	// eslint-disable-next-line n8n-nodes-base/node-param-default-missing -- factory helper; callers inherit default: ''
	return {
		displayName: isOptional ? optionalLabel(displayName) : displayName,
		name,
		type: 'string',
		default: options.default ?? '',
		...(options.required !== undefined ? { required: options.required } : {}),
		...(options.placeholder ? { placeholder: options.placeholder } : {}),
		...(options.description ? { description: options.description } : {}),
		...(options.hint ? { hint: options.hint } : {}),
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
	hint?: string,
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
		...(hint ? { hint } : {}),
	};
}

export function httpUrlStringField(
	name: string,
	displayName: string,
	displayOptions: INodeProperties['displayOptions'],
	options: { required?: boolean; description?: string; placeholder?: string; hint?: string } = {},
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
		...(options.hint ? { hint: options.hint } : {}),
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
	return limitedStringField(name, displayName, DOCUMENT_FILENAME_MAX, {
		displayOptions,
		optional: true,
		description: 'Filename shown to the recipient for document messages',
	});
}

export function listSearchResourceLocatorMode(searchListMethod: string) {
	return {
		displayName: 'From List',
		name: 'list',
		type: 'list' as const,
		typeOptions: {
			searchListMethod,
			searchable: true,
			searchFilterRequired: false,
		},
	};
}

export function idResourceLocatorMode(placeholder: string, maxLength: number) {
	return {
		displayName: 'By ID',
		name: 'id',
		type: 'string' as const,
		placeholder,
		typeOptions: {
			maxLength,
		} as unknown as INodePropertyModeTypeOptions,
	};
}

export function catalogResourceLocatorField(
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	return {
		displayName: 'Catalog',
		name: 'catalogId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			listSearchResourceLocatorMode('searchCatalogs'),
			idResourceLocatorMode('catalog-id', CATALOG_ID_MAX),
		],
		displayOptions,
		description: withKapsoDoc(
			'WhatsApp catalog linked to the selected phone number. Search shows recent matches; type to filter',
			KAPSO_DOCS.templateAdvanced,
			'Catalog',
		),
	};
}

export function productRetailerResourceLocatorField(
	name = 'productRetailerId',
	displayName = 'Product',
	displayOptions?: INodeProperties['displayOptions'],
	required = true,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required,
		modes: [
			listSearchResourceLocatorMode('searchCatalogProducts'),
			idResourceLocatorMode('product-sku', PRODUCT_RETAILER_ID_MAX),
		],
		displayOptions,
		description: withKapsoDoc(
			'Catalog product SKU (product_retailer_id). Select a catalog first, then search products',
			KAPSO_DOCS.templateAdvanced,
			'Catalog',
		),
	};
}

export function flowResourceLocatorField(
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	return {
		displayName: 'Flow',
		name: 'flowId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			listSearchResourceLocatorMode('searchWhatsappFlows'),
			idResourceLocatorMode('meta-flow-id', FLOW_ID_MAX),
		],
		displayOptions,
		description: withKapsoDoc(
			'WhatsApp Flow for this phone number. Create and publish it in Kapso Dashboard > WhatsApp > Flows. Search by Flow name, or paste the Meta Flow ID from the Flow details. Draft flows require Flow Mode: Draft',
			KAPSO_DOCS.flowsOverview,
			'Flows',
		),
	};
}

export function flowScreenOptionsField(
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	return {
		displayName: optionalLabel('Flow Screen'),
		name: 'flowScreen',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getFlowScreens',
			loadOptionsDependsOn: ['phoneNumberId', 'flowId', 'flowMode'],
		},
		displayOptions,
		description: withKapsoDoc(
			'First screen the recipient sees when Flow action is Navigate. Loaded from the Flow builder for the selected Flow. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			KAPSO_DOCS.sendFlow,
			'Send Flow',
		),
	};
}

export function catalogIdField(displayOptions: INodeProperties['displayOptions']): INodeProperties {
	return catalogResourceLocatorField(displayOptions);
}

export function productRetailerIdField(
	name = 'productRetailerId',
	displayName = 'Product Retailer ID',
	displayOptions?: INodeProperties['displayOptions'],
	required = true,
): INodeProperties {
	return productRetailerResourceLocatorField(name, displayName, displayOptions, required);
}

export function flowCtaField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return limitedStringField('flowCta', 'Flow Button Label', FLOW_CTA_MAX, {
		displayOptions,
		optional: true,
		description:
			'Button label that opens the Flow (1-20 characters). Defaults to the selected Flow name when empty',
	});
}

export function flowTokenField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return {
		displayName: optionalLabel('Flow Token'),
		name: 'flowToken',
		type: 'string',
		default: '',
		// eslint-disable-next-line n8n-nodes-base/node-param-type-options-password-missing -- visible for copy/paste from Flow responses
		typeOptions: {
			maxLength: FLOW_TOKEN_MAX,
		},
		displayOptions,
		description: withKapsoDoc(
			'Optional correlation token returned with Flow responses. Leave empty for the common path; Kapso will use the Flow ID so responses can be collected and stored automatically',
			KAPSO_DOCS.sendFlow,
			'Send Flow',
		),
	};
}

export function flowScreenField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return flowScreenOptionsField(displayOptions);
}

export function flowIdField(displayOptions?: INodeProperties['displayOptions']): INodeProperties {
	return flowResourceLocatorField(displayOptions);
}

export function uuidStringField(
	name: string,
	displayName: string,
	options: LimitedFieldOptions & { description?: string } = {},
): INodeProperties {
	const isRequired = options.required === true;

	return {
		displayName: isRequired ? displayName : optionalLabel(displayName),
		name,
		type: 'string',
		default: '',
		...(options.required !== undefined ? { required: options.required } : {}),
		...(options.description ? { description: options.description } : {}),
		...(options.hint ? { hint: options.hint } : {}),
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
	return limitedStringField(name, displayName, FILTER_STRING_MAX, {
		optional: true,
		description,
	});
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
	options: { description?: string } = {},
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		required: true,
		typeOptions: {
			maxLength: WAMID_MAX_LENGTH,
		},
		displayOptions,
		description: options.description ?? WAMID_HINT,
	};
}

export function emojiStringField(displayOptions: INodeProperties['displayOptions']): INodeProperties {
	return {
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '👍',
		required: true,
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
		description: `Plain text message body (max ${TEXT_MESSAGE_MAX} characters).`,
	});

export const interactiveBodyField = (
	name: string,
	displayName: string,
	displayOptions: INodeProperties['displayOptions'],
	options: { required?: boolean; hint?: string; description?: string; rows?: number } = {},
): INodeProperties =>
	limitedStringField(name, displayName, INTERACTIVE_BODY_MAX, {
		displayOptions,
		required: options.required ?? true,
		rows: options.rows ?? 3,
		...(options.hint ? { hint: options.hint } : {}),
		description:
			options.description ??
			`Main message body for this interactive message (max ${INTERACTIVE_BODY_MAX} characters)`,
	});

/** Single-line prompt for simple interactive asks (location, call permission). */
export const promptMessageField = (
	name: string,
	displayName: string,
	displayOptions: INodeProperties['displayOptions'],
	options: {
		required?: boolean;
		description?: string;
		placeholder?: string;
	} = {},
): INodeProperties =>
	limitedStringField(name, displayName, INTERACTIVE_BODY_MAX, {
		displayOptions,
		required: options.required ?? true,
		placeholder: options.placeholder,
		description:
			options.description ??
			`Short plain-text prompt shown to the recipient (max ${INTERACTIVE_BODY_MAX} characters)`,
	});

export const mediaCaptionField = (displayOptions: INodeProperties['displayOptions']): INodeProperties =>
	limitedStringField('caption', 'Caption', MEDIA_CAPTION_MAX, {
		displayOptions,
		optional: true,
		description: `Plain-text caption shown below the media (max ${MEDIA_CAPTION_MAX} characters). Meta does not support preview_url on media captions — use Send Text with Link Preview if you need a rich URL card`,
	});

export const interactiveHeaderTextField = (
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties =>
	limitedStringField(name, displayName, INTERACTIVE_HEADER_MAX, {
		displayOptions,
		optional: true,
		description: `Header text above the message body (max ${INTERACTIVE_HEADER_MAX} characters)`,
	});

export const interactiveFooterTextField = (
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties =>
	limitedStringField(name, displayName, INTERACTIVE_FOOTER_MAX, {
		displayOptions,
		optional: true,
		description: `Footer text below the interactive content (max ${INTERACTIVE_FOOTER_MAX} characters)`,
	});

export const buttonIdField = (): INodeProperties =>
	limitedStringField('buttonId', 'Button ID', BUTTON_ID_MAX, {
		required: true,
		description: 'Developer-defined ID returned in the webhook when this button is tapped',
	});

export const buttonTitleField = (): INodeProperties =>
	limitedStringField('buttonTitle', 'Button Title', BUTTON_TITLE_MAX, {
		required: true,
		description: `Label shown on the button (max ${BUTTON_TITLE_MAX} characters)`,
	});

export const listButtonTextField = (displayOptions: INodeProperties['displayOptions']): INodeProperties =>
	limitedStringField('listButtonText', 'List Button Text', LIST_BUTTON_TEXT_MAX, {
		displayOptions,
		required: true,
		description: `Label on the button that opens the list menu (max ${LIST_BUTTON_TEXT_MAX} characters)`,
	});

export const listSectionTitleField = (): INodeProperties =>
	limitedStringField('sectionTitle', 'Section Title', LIST_SECTION_TITLE_MAX, {
		required: true,
		description: `Section heading shown in the list menu (max ${LIST_SECTION_TITLE_MAX} characters)`,
	});

export const listRowIdField = (): INodeProperties =>
	limitedStringField('rowId', 'Row ID', LIST_ROW_ID_MAX, {
		required: true,
		description: 'Developer-defined ID returned when this list row is selected',
	});

export const listRowTitleField = (): INodeProperties =>
	limitedStringField('rowTitle', 'Row Title', LIST_ROW_TITLE_MAX, {
		required: true,
		description: `Row title shown in the list menu (max ${LIST_ROW_TITLE_MAX} characters)`,
	});

export const listRowDescriptionField = (): INodeProperties =>
	limitedStringField('rowDescription', 'Row Description', LIST_ROW_DESCRIPTION_MAX, {
		optional: true,
		description: `Row subtitle (max ${LIST_ROW_DESCRIPTION_MAX} characters)`,
	});

export const ctaButtonLabelField = (displayOptions: INodeProperties['displayOptions']): INodeProperties =>
	limitedStringField('ctaButtonLabel', 'Button Label', CTA_BUTTON_LABEL_MAX, {
		displayOptions,
		required: true,
		description: `Call-to-action button label (max ${CTA_BUTTON_LABEL_MAX} characters)`,
	});
