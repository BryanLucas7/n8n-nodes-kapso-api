import { INodeProperties } from 'n8n-workflow';
import {
	flowTokenField,
	flowActionDataKeyField,
	flowActionDataValueField,
	limitedTextResourceLocatorField,
	listSectionTitleField,
	LOCATION_TEXT_MAX,
	mediaIdStringField,
	PRODUCT_RETAILER_ID_MAX,
	productRetailerIdField,
	publicUrlStringField,
	templateButtonUrlSuffixField,
	templateCopyCodeField,
	templateQuickReplyPayloadField,
	templateQuickReplyTextField,
} from './fieldConstraints';
import { optionalLabel } from './displayNames';
import { KAPSO_DOCS, withKapsoDoc } from './expressionHints';

export const TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY = 'buttonParameterValues';

const buttonIndexField: INodeProperties = {
	displayName: 'Index',
	name: 'buttonIndex',
	type: 'number',
	default: 0,
	typeOptions: {
		minValue: 0,
	},
	description:
		'Matches the template button order (0 = first button). Auto-fills from add order; change manually to reorder.',
};

function templateButtonKindField(kind: string): INodeProperties {
	return {
		displayName: 'Button Kind',
		name: 'templateButtonKind',
		type: 'hidden',
		default: kind,
	};
}

const flowActionDataFields: INodeProperties = {
	displayName: optionalLabel('Flow Action Data'),
	name: 'flowActionData',
	type: 'fixedCollection',
	placeholder: 'Add Field',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Field',
	},
	default: {},
	description: 'Optional key-value data passed to the Flow when the button is tapped',
	options: [
		{
			displayName: 'Field',
			name: 'fieldValues',
			description: 'One key-value pair passed to the Flow when the button is tapped',
			values: [flowActionDataKeyField(), flowActionDataValueField()],
		},
	],
};

const mpmProductItemsField: INodeProperties = {
	displayName: 'Products',
	name: 'productValues',
	type: 'fixedCollection',
	placeholder: 'Add Product',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Product',
	},
	default: {},
	description: 'At least one product per section. Up to 30 products across all sections.',
	options: [
		{
			displayName: 'Product',
			name: 'productItems',
			values: [productRetailerIdField('productRetailerId', 'Product SKU')],
		},
	],
};

const mpmSectionFields: INodeProperties = {
	displayName: 'MPM Sections',
	name: 'mpmSectionValues',
	type: 'fixedCollection',
	placeholder: 'Add Section',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Section',
	},
	default: {},
	description: 'Catalog sections for this MPM button (1-10 sections, max 30 products total)',
	options: [
		{
			displayName: 'Section',
			name: 'sectionValues',
			description: 'One MPM catalog section with a title and product list',
			values: [listSectionTitleField(), mpmProductItemsField],
		},
	],
};

export const templateButtonParameterCollectionOptions: INodeProperties['options'] = [
	{
		displayName: 'URL',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		description: 'Dynamic URL suffix appended to the static template URL',
		values: [templateButtonKindField('url'), buttonIndexField, templateButtonUrlSuffixField()],
	},
	{
		displayName: 'Quick Reply (Text)',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		description: 'Quick-reply button with a dynamic visible label',
		values: [templateButtonKindField('quick_reply_text'), buttonIndexField, templateQuickReplyTextField()],
	},
	{
		displayName: 'Quick Reply (Payload)',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		description: 'Quick-reply button that returns a developer-defined payload',
		values: [
			templateButtonKindField('quick_reply_payload'),
			buttonIndexField,
			templateQuickReplyPayloadField(),
		],
	},
	{
		displayName: 'Flow',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		description: 'Flow button that opens a WhatsApp Flow with optional action data',
		values: [templateButtonKindField('flow'), buttonIndexField, flowTokenField(), flowActionDataFields],
	},
	{
		displayName: 'Copy Code',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		description: 'Copy-code button that copies a coupon or offer code',
		values: [templateButtonKindField('copy_code'), buttonIndexField, templateCopyCodeField()],
	},
	{
		displayName: 'Catalog',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		description: 'Catalog button that opens the business product catalog',
		values: [
			templateButtonKindField('catalog'),
			buttonIndexField,
			limitedTextResourceLocatorField(
				'catalogThumbnailProductRetailerId',
				'Thumbnail SKU',
				PRODUCT_RETAILER_ID_MAX,
				{
					optional: true,
					description: 'Optional product_retailer_id used as the catalog thumbnail',
				},
			),
		],
	},
	{
		displayName: 'MPM',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		description: 'Multi-product message button with catalog sections',
		values: [
			templateButtonKindField('mpm'),
			buttonIndexField,
			limitedTextResourceLocatorField(
				'mpmThumbnailProductRetailerId',
				'Thumbnail SKU',
				PRODUCT_RETAILER_ID_MAX,
				{
					optional: true,
					description: 'Optional product_retailer_id shown before the customer opens the product list',
				},
			),
			mpmSectionFields,
		],
	},
];

export const templateButtonParametersField = (
	name: string,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties => ({
	displayName: 'Button Parameters',
	name,
	type: 'fixedCollection',
	placeholder: 'Add Button Parameter',
	typeOptions: {
		multipleValues: true,
		multipleValueButtonText: 'Add Button Parameter',
		sortable: true,
	},
	default: {},
	displayOptions,
	description:
		'Add one entry per template button. Index auto-fills as 0, 1, 2… in add order (drag to reorder). Meta limits: 10 buttons total, up to 10 quick replies, 2 URLs, 1 copy code',
	options: templateButtonParameterCollectionOptions,
});

export const templateMediaSourceField = (
	prefix: string,
	headerTypes: string[],
): INodeProperties => ({
	displayName: 'Header Media Source',
	name: `${prefix}HeaderMediaSource`,
	type: 'options',
	options: [
		{ name: 'Public Link', value: 'link' },
		{ name: 'Media ID', value: 'id' },
	],
	default: 'link',
	description: 'Whether the header uses a Meta media ID or a public HTTPS URL',
	displayOptions: {
		show: {
			[`${prefix}HeaderType`]: headerTypes,
		},
	},
});

export const templateMediaValueFields = (
	prefix: string,
	resource: string[],
	operation: string[],
): INodeProperties[] => [
	publicUrlStringField(`${prefix}HeaderMediaUrl`, 'Header Media URL', {
		show: {
			resource,
			operation,
			[`${prefix}HeaderType`]: ['image', 'video', 'document'],
			[`${prefix}HeaderMediaSource`]: ['link'],
		},
	}),
	mediaIdStringField(`${prefix}HeaderMediaId`, 'Header Media ID', {
		show: {
			resource,
			operation,
			[`${prefix}HeaderType`]: ['image', 'video', 'document'],
			[`${prefix}HeaderMediaSource`]: ['id'],
		},
	}, false),
];

export const templateLocationHeaderFields = (
	prefix: string,
	resource: string[],
	operation: string[],
): INodeProperties[] => [
	{
		displayName: 'Header Latitude',
		name: `${prefix}HeaderLatitude`,
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource,
				operation,
				[`${prefix}HeaderType`]: ['location'],
			},
		},
		description: withKapsoDoc(
			'Latitude in decimal degrees (-90 to 90)',
			KAPSO_DOCS.templateLocationHeader,
			'Location header',
		),
	},
	{
		displayName: 'Header Longitude',
		name: `${prefix}HeaderLongitude`,
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource,
				operation,
				[`${prefix}HeaderType`]: ['location'],
			},
		},
		description: 'Longitude in decimal degrees (-180 to 180)',
	},
	limitedTextResourceLocatorField(
		`${prefix}HeaderLocationName`,
		'Header Location Name',
		LOCATION_TEXT_MAX,
		{
			optional: true,
			displayOptions: {
				show: {
					resource,
					operation,
					[`${prefix}HeaderType`]: ['location'],
				},
			},
			description: `Optional location title shown in the map pin (max ${LOCATION_TEXT_MAX} characters)`,
		},
	),
	limitedTextResourceLocatorField(
		`${prefix}HeaderLocationAddress`,
		'Header Location Address',
		LOCATION_TEXT_MAX,
		{
			optional: true,
			displayOptions: {
				show: {
					resource,
					operation,
					[`${prefix}HeaderType`]: ['location'],
				},
			},
			description: `Optional street address shown under the location name (max ${LOCATION_TEXT_MAX} characters)`,
		},
	),
];
