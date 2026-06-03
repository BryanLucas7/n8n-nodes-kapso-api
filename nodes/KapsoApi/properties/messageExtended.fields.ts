import { INodeProperties } from 'n8n-workflow';
import { messageStickerOperations } from '../actions/operations';
import { optionalLabel } from './displayNames';
import {
	catalogIdField,
	ctaButtonLabelField,
	e164PhoneResourceLocatorField,
	interactiveFooterTextField,
	interactiveHeaderTextField,
	INTERACTIVE_HEADER_MAX,
	httpUrlStringField,
	flowCtaField,
	flowIdField,
	flowScreenField,
	flowTokenField,
	limitedTextResourceLocatorField,
	LOCATION_TEXT_MAX,
	listSectionTitleField,
	mediaIdStringField,
	productRetailerIdField,
	publicUrlStringField,
} from './fieldConstraints';
import { KAPSO_DOCS, withKapsoDoc } from './expressionHints';
import {
	interactiveHeaderMediaFields,
	interactiveHeaderTypeField,
	productListHeaderTypeOptions,
} from './interactiveHeaderOptions';
import {
	FLOW_PREVIEW_NOTICE_DISPLAY_NAME,
	FLOW_SINGLE_SCREEN_NOTICE_DISPLAY_NAME,
	hideWhenFlowNavigateOnly,
	hideWhenFlowSingleScreen,
	showWhenFlowEncryptionWarning,
	showWhenFlowPreviewAvailable,
	showWhenFlowSelected,
	showWhenFlowSingleScreenNotice,
} from './flowDisplayConditions';
import { flowModeField } from './flowMode.fields';

const stickerOps = [...messageStickerOperations];
const ctaOps = ['sendCta'];

/** Headers and setup fields shown before body text. */
export const messageInteractiveHeaderFields: INodeProperties[] = [
	interactiveHeaderTypeField('buttonHeaderType', 'Header Type', ['sendButtons']),
	...interactiveHeaderMediaFields('button', ['sendButtons']),
	interactiveHeaderTextField('headerText', 'Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendButtons'],
			buttonHeaderType: ['text'],
		},
	}),
	interactiveHeaderTypeField('listHeaderType', 'List Header Type', ['sendList']),
	interactiveHeaderTextField('listHeaderText', 'List Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendList'],
			listHeaderType: ['text'],
		},
	}),
	...interactiveHeaderMediaFields('list', ['sendList']),
	interactiveHeaderTypeField('ctaHeaderType', 'Header Type', ctaOps),
	interactiveHeaderTextField('ctaHeaderText', 'Header Text', {
		show: {
			resource: ['message'],
			operation: ctaOps,
			ctaHeaderType: ['text'],
		},
	}),
	...interactiveHeaderMediaFields('cta', ctaOps),
	{
		displayName: 'Product List Header Type',
		name: 'productListHeaderType',
		type: 'options',
		options: productListHeaderTypeOptions,
		default: 'text',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendProductList'],
			},
		},
		description: 'Header format for the multi-product list message',
	},
	limitedTextResourceLocatorField('productListHeaderText', 'Product List Header Text', INTERACTIVE_HEADER_MAX, {
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendProductList'],
				productListHeaderType: ['text'],
			},
		},
		required: true,
		description: `Header text shown above the product sections (max ${INTERACTIVE_HEADER_MAX} characters)`,
	}),
	...interactiveHeaderMediaFields('productList', ['sendProductList']),
	flowModeField,
	flowIdField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
		},
	}),
	{
		displayName:
			'Kapso always sends flow_message_version 3 to Meta. Flow JSON version in Kapso Dashboard is separate and does not change this field.',
		name: 'flowMessageVersionNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				...showWhenFlowSelected,
			},
		},
	},
	{
		displayName: FLOW_PREVIEW_NOTICE_DISPLAY_NAME,
		name: 'flowPreviewNotice',
		type: 'notice',
		default: '',
		typeOptions: {
			theme: 'info',
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				...showWhenFlowPreviewAvailable,
			},
		},
	},
	{
		displayName:
			'This Flow uses a data endpoint but Flow encryption is not configured. Configure it in Kapso Dashboard > WhatsApp > Flows > [Flow] > Encryption before sending data-exchange messages.',
		name: 'flowEncryptionNotice',
		type: 'notice',
		default: '',
		typeOptions: {
			theme: 'warning',
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				...showWhenFlowEncryptionWarning,
			},
		},
	},
	{
		...interactiveHeaderTypeField('flowHeaderType', 'Flow Header Type', ['sendFlow']),
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				...showWhenFlowSelected,
			},
		},
	},
	interactiveHeaderTextField('flowHeaderText', 'Flow Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
			flowHeaderType: ['text'],
			...showWhenFlowSelected,
		},
	}),
	...interactiveHeaderMediaFields('flow', ['sendFlow']).map((field) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show ?? {}),
				...showWhenFlowSelected,
			},
		},
	})),
];

/** Media, location, and catalog setup fields grouped with primary content. */
export const messageMediaAndLocationFields: INodeProperties[] = [
	{
		displayName: 'Send As Voice Note',
		name: 'sendAsVoiceNote',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendAudio'],
			},
		},
		description: 'Whether to send audio as a WhatsApp voice message (push-to-talk)',
	},
	{
		displayName: 'Latitude',
		name: 'locationLatitude',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: {
			minValue: -90,
			maxValue: 90,
			numberPrecision: 6,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
		description: withKapsoDoc(
			'Latitude in decimal degrees (-90 to 90)',
			KAPSO_DOCS.sendLocation,
			'Location',
		),
	},
	{
		displayName: 'Longitude',
		name: 'locationLongitude',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: {
			minValue: -180,
			maxValue: 180,
			numberPrecision: 6,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
		description: 'Longitude in decimal degrees (-180 to 180)',
	},
	limitedTextResourceLocatorField('locationName', 'Location Name', LOCATION_TEXT_MAX, {
		optional: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
		description: `Optional location title shown in the map pin (max ${LOCATION_TEXT_MAX} characters)`,
	}),
	limitedTextResourceLocatorField('locationAddress', 'Location Address', LOCATION_TEXT_MAX, {
		optional: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
		description: `Optional street address shown under the location name (max ${LOCATION_TEXT_MAX} characters)`,
	}),
	{
		displayName: 'Sticker Source',
		name: 'stickerSource',
		type: 'options',
		options: [
			{ name: 'Media ID', value: 'id' },
			{ name: 'Public Link', value: 'link' },
		],
		default: 'id',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: stickerOps,
			},
		},
		description: 'Whether the sticker is sent from a Meta media ID or a public WEBP URL',
	},
	mediaIdStringField('stickerMediaId', 'Sticker Media ID', {
		show: {
			resource: ['message'],
			operation: stickerOps,
			stickerSource: ['id'],
		},
	}),
	publicUrlStringField('stickerMediaUrl', 'Public URL', {
		show: {
			resource: ['message'],
			operation: stickerOps,
			stickerSource: ['link'],
		},
	}, 'Public HTTPS URL of a WEBP sticker'),
	catalogIdField({
		show: {
			resource: ['message'],
			operation: ['sendProduct', 'sendProductList'],
		},
	}),
	productRetailerIdField('productRetailerId', 'Product', {
		show: {
			resource: ['message'],
			operation: ['sendProduct'],
		},
	}, true),
	productRetailerIdField('catalogThumbnailProductId', 'Thumbnail Product', {
		show: {
			resource: ['message'],
			operation: ['sendCatalog'],
		},
	}, false),
];

/** Action fields shown after body text (buttons, CTA target, flow action, product sections). */
export const messageInteractiveActionFields: INodeProperties[] = [
	{
		displayName: 'CTA Type',
		name: 'ctaType',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Phone Call', value: 'phone' },
		],
		default: 'url',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ctaOps,
			},
		},
		description: 'Whether the button opens a URL or starts a phone call',
	},
	ctaButtonLabelField({
		show: {
			resource: ['message'],
			operation: ctaOps,
		},
	}),
	httpUrlStringField('ctaButtonUrl', 'Button URL', {
		show: {
			resource: ['message'],
			operation: ctaOps,
			ctaType: ['url'],
		},
	}, {
		description: withKapsoDoc(
			'HTTPS URL opened when the recipient taps the button',
			KAPSO_DOCS.sendButtons,
			'Buttons',
		),
	}),
	e164PhoneResourceLocatorField(
		'ctaButtonPhone',
		'Button Phone Number',
		{
			show: {
				resource: ['message'],
				operation: ctaOps,
				ctaType: ['phone'],
			},
		},
		'E.164 phone number with + that opens in the dialer when the recipient taps the button',
	),
	{
		displayName: 'Product Sections',
		name: 'productSections',
		type: 'fixedCollection',
		placeholder: 'Add Section',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Section',
		},
		default: {},
		required: true,
		description: 'Catalog sections (1-10 sections, max 30 products total)',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendProductList'],
			},
		},
		options: [
			{
				displayName: 'Section',
				name: 'sectionValues',
				values: [
					listSectionTitleField(),
					{
						displayName: 'Products',
						name: 'productItems',
						placeholder: 'Add Product',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Product',
						},
						default: {},
						description: 'At least one product per section',
						options: [
							{
								displayName: 'Product',
								name: 'product',
								values: [
									productRetailerIdField('productRetailerId', 'Product'),
								],
							},
						],
					},
				],
			},
		],
	},
	flowCtaField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
			...showWhenFlowSelected,
		},
	}),
	flowTokenField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
			...showWhenFlowSelected,
		},
	}),
	{
		displayName: optionalLabel('Flow Action'),
		name: 'flowAction',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getFlowActions',
			loadOptionsDependsOn: ['phoneNumberId', 'flowId', 'flowMode'],
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				...showWhenFlowSelected,
			},
			hide: hideWhenFlowNavigateOnly,
		},
		description: 'Leave empty to use the action detected from the Flow. Choose Navigate to open a screen, or Data Exchange only when the Flow has a configured data endpoint. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: FLOW_SINGLE_SCREEN_NOTICE_DISPLAY_NAME,
		name: 'flowScreenAutoNotice',
		type: 'notice',
		default: '',
		typeOptions: {
			theme: 'info',
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				flowAction: ['navigate', ''],
				...showWhenFlowSingleScreenNotice,
			},
		},
	},
	flowScreenField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
			flowAction: ['navigate', ''],
			...showWhenFlowSelected,
		},
		hide: hideWhenFlowSingleScreen,
	}),
	{
		displayName: 'Flow Initial Data',
		name: 'flowInitialDataMapper',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				...showWhenFlowSelected,
			},
		},
		typeOptions: {
			loadOptionsDependsOn: ['phoneNumberId', 'flowId', 'flowScreen', 'flowMode'],
			resourceMapper: {
				resourceMapperMethod: 'getFlowInitialDataFields',
				mode: 'add',
				addAllFields: true,
				supportAutoMap: false,
				fieldWords: {
					singular: 'initial data field',
					plural: 'initial data fields',
				},
				noFieldsError: 'Select a Flow with screen data fields before mapping initial data.',
			},
		},
		description: withKapsoDoc(
			'Initial data fields for the selected Flow screen, as defined in the Flow builder. Map values sent when the Flow opens',
			KAPSO_DOCS.sendFlow,
			'Send Flow',
		),
	},
	interactiveFooterTextField('flowFooterText', 'Flow Footer Text', {
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
			...showWhenFlowSelected,
		},
	}),
];

/** @deprecated Use split exports from index.ts for field order. */
export const messageExtendedFields: INodeProperties[] = [
	...messageInteractiveHeaderFields,
	...messageMediaAndLocationFields,
	...messageInteractiveActionFields,
];
