import { INodeProperties } from 'n8n-workflow';
import { messageStickerOperations } from '../actions/operations';
import {
	catalogIdField,
	ctaButtonLabelField,
	interactiveFooterTextField,
	interactiveHeaderTextField,
	INTERACTIVE_HEADER_MAX,
	httpUrlStringField,
	flowCtaField,
	flowIdField,
	flowScreenField,
	flowTokenField,
	listSectionTitleField,
	limitedStringField,
	mediaIdStringField,
	productRetailerIdField,
	publicUrlStringField,
} from './fieldConstraints';
import {
	interactiveHeaderMediaFields,
	interactiveHeaderTypeOptions,
	productListHeaderTypeOptions,
} from './interactiveHeaderOptions';

const stickerOps = [...messageStickerOperations];

export const messageExtendedFields: INodeProperties[] = [
	{
		displayName: 'Latitude',
		name: 'locationLatitude',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: {
			numberPrecision: 6,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
	},
	{
		displayName: 'Longitude',
		name: 'locationLongitude',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: {
			numberPrecision: 6,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
	},
	{
		displayName: 'Location Name',
		name: 'locationName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
	},
	{
		displayName: 'Location Address',
		name: 'locationAddress',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendLocation'],
			},
		},
	},
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
	{
		displayName: 'Header Type',
		name: 'buttonHeaderType',
		type: 'options',
		options: interactiveHeaderTypeOptions,
		default: 'none',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendButtons'],
			},
		},
	},
	...interactiveHeaderMediaFields('button', ['sendButtons']),
	{
		displayName: 'List Header Type',
		name: 'listHeaderType',
		type: 'options',
		options: interactiveHeaderTypeOptions,
		default: 'none',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendList'],
			},
		},
	},
	interactiveHeaderTextField('listHeaderText', 'List Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendList'],
			listHeaderType: ['text'],
		},
	}),
	...interactiveHeaderMediaFields('list', ['sendList']),
	ctaButtonLabelField({
		show: {
			resource: ['message'],
			operation: ['sendCtaUrl'],
		},
	}),
	httpUrlStringField('ctaButtonUrl', 'Button URL', {
		show: {
			resource: ['message'],
			operation: ['sendCtaUrl'],
		},
	}),
	{
		displayName: 'Header Type',
		name: 'ctaHeaderType',
		type: 'options',
		options: interactiveHeaderTypeOptions,
		default: 'none',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendCtaUrl'],
			},
		},
	},
	interactiveHeaderTextField('ctaHeaderText', 'Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendCtaUrl'],
			ctaHeaderType: ['text'],
		},
	}),
	...interactiveHeaderMediaFields('cta', ['sendCtaUrl']),
	catalogIdField({
		show: {
			resource: ['message'],
			operation: ['sendProduct', 'sendProductList'],
		},
	}),
	productRetailerIdField('productRetailerId', 'Product Retailer ID', {
		show: {
			resource: ['message'],
			operation: ['sendProduct'],
		},
	}, true),
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
	},
	limitedStringField('productListHeaderText', 'Product List Header Text', INTERACTIVE_HEADER_MAX, {
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendProductList'],
				productListHeaderType: ['text'],
			},
		},
		required: true,
	}),
	...interactiveHeaderMediaFields('productList', ['sendProductList']),
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
									productRetailerIdField('productRetailerId', 'Product SKU'),
								],
							},
						],
					},
				],
			},
		],
	},
	productRetailerIdField('catalogThumbnailProductId', 'Thumbnail SKU', {
		show: {
			resource: ['message'],
			operation: ['sendCatalog'],
		},
	}),
	{
		displayName: 'Flow Mode',
		name: 'flowMode',
		type: 'options',
		options: [
			{ name: 'Default (Published)', value: '' },
			{ name: 'Draft', value: 'draft' },
			{ name: 'Published', value: 'published' },
		],
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
		description: 'Whether to send the Flow in draft or published mode',
	},
	{
		displayName: 'Flow Header Type',
		name: 'flowHeaderType',
		type: 'options',
		options: interactiveHeaderTypeOptions,
		default: 'none',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
	},
	interactiveHeaderTextField('flowHeaderText', 'Flow Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
			flowHeaderType: ['text'],
		},
	}),
	...interactiveHeaderMediaFields('flow', ['sendFlow']),
	interactiveFooterTextField('flowFooterText', 'Flow Footer Text', {
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
		},
	}),
	flowIdField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
		},
	}),
	{
		displayName: 'Flow Name',
		name: 'flowName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
		description: 'Human-readable Flow name registered in Meta. Provide Flow ID or Flow Name, not both.',
	},
	flowCtaField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
		},
	}),
	flowTokenField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
		},
	}),
	{
		displayName: 'Flow Message Version',
		name: 'flowMessageVersion',
		type: 'string',
		default: '3',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
	},
	{
		displayName: 'Flow Action',
		name: 'flowAction',
		type: 'options',
		options: [
			{ name: 'Navigate', value: 'navigate' },
			{ name: 'Data Exchange', value: 'data_exchange' },
		],
		default: 'navigate',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
	},
	flowScreenField({
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
			flowAction: ['navigate'],
		},
	}),
	{
		displayName: 'Flow Initial Data JSON',
		name: 'flowInitialDataJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
		description: 'Optional initial data passed to the Flow screen',
	},
];
