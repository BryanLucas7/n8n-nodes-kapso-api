import { INodeProperties } from 'n8n-workflow';
import { listSectionTitleField, mediaIdStringField, productRetailerIdField, flowTokenField, publicUrlStringField } from './fieldConstraints';

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
	displayName: 'Flow Action Data',
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
			values: [
				{
					displayName: 'Key',
					name: 'key',
					type: 'string',
					default: '',
					required: true,
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
					required: true,
				},
			],
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
			values: [listSectionTitleField(), mpmProductItemsField],
		},
	],
};

export const templateButtonParameterCollectionOptions: INodeProperties['options'] = [
	{
		displayName: 'URL',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		values: [
			templateButtonKindField('url'),
			buttonIndexField,
			{
				displayName: 'URL Suffix',
				name: 'buttonText',
				type: 'string',
				default: '',
				description: 'Dynamic suffix appended to the static URL defined in the template',
			},
		],
	},
	{
		displayName: 'Quick Reply (Text)',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		values: [
			templateButtonKindField('quick_reply_text'),
			buttonIndexField,
			{
				displayName: 'Text',
				name: 'buttonText',
				type: 'string',
				default: '',
				required: true,
				description: 'Visible quick-reply label when the template uses a text parameter',
			},
		],
	},
	{
		displayName: 'Quick Reply (Payload)',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		values: [
			templateButtonKindField('quick_reply_payload'),
			buttonIndexField,
			{
				displayName: 'Payload',
				name: 'buttonPayload',
				type: 'string',
				default: '',
				required: true,
				description: 'Developer-defined payload returned when the button is tapped',
			},
		],
	},
	{
		displayName: 'Flow',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		values: [templateButtonKindField('flow'), buttonIndexField, flowTokenField(), flowActionDataFields],
	},
	{
		displayName: 'Copy Code',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		values: [
			templateButtonKindField('copy_code'),
			buttonIndexField,
			{
				displayName: 'Coupon Code',
				name: 'buttonText',
				type: 'string',
				default: '',
				required: true,
			},
		],
	},
	{
		displayName: 'Catalog',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		values: [
			templateButtonKindField('catalog'),
			buttonIndexField,
			{
				displayName: 'Thumbnail SKU',
				name: 'catalogThumbnailProductRetailerId',
				type: 'string',
				default: '',
				description: 'Optional product_retailer_id used as the catalog thumbnail',
			},
		],
	},
	{
		displayName: 'MPM',
		name: TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
		values: [
			templateButtonKindField('mpm'),
			buttonIndexField,
			{
				displayName: 'Thumbnail SKU',
				name: 'mpmThumbnailProductRetailerId',
				type: 'string',
				default: '',
				description: 'Optional product_retailer_id shown before the customer opens the product list',
			},
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
	},
	{
		displayName: 'Header Location Name',
		name: `${prefix}HeaderLocationName`,
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource,
				operation,
				[`${prefix}HeaderType`]: ['location'],
			},
		},
	},
	{
		displayName: 'Header Location Address',
		name: `${prefix}HeaderLocationAddress`,
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource,
				operation,
				[`${prefix}HeaderType`]: ['location'],
			},
		},
	},
];
