import { INodeProperties } from 'n8n-workflow';
import { messageStickerOperations } from '../actions/operations';
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
	{
		displayName: 'Sticker Media Value',
		name: 'stickerValue',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: stickerOps,
			},
		},
		description: 'Sticker media ID or public WEBP URL',
	},
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
	{
		displayName: 'List Header Text',
		name: 'listHeaderText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendList'],
				listHeaderType: ['text'],
			},
		},
	},
	...interactiveHeaderMediaFields('list', ['sendList']),
	{
		displayName: 'Button Label',
		name: 'ctaButtonLabel',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendCtaUrl'],
			},
		},
	},
	{
		displayName: 'Button URL',
		name: 'ctaButtonUrl',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendCtaUrl'],
			},
		},
	},
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
	{
		displayName: 'Header Text',
		name: 'ctaHeaderText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendCtaUrl'],
				ctaHeaderType: ['text'],
			},
		},
	},
	...interactiveHeaderMediaFields('cta', ['sendCtaUrl']),
	{
		displayName: 'Catalog ID',
		name: 'catalogId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendProduct', 'sendProductList'],
			},
		},
	},
	{
		displayName: 'Product Retailer ID',
		name: 'productRetailerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendProduct'],
			},
		},
		description: 'Product SKU in the connected Meta catalog',
	},
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
	{
		displayName: 'Product List Header Text',
		name: 'productListHeaderText',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendProductList'],
				productListHeaderType: ['text'],
			},
		},
	},
	...interactiveHeaderMediaFields('productList', ['sendProductList']),
	{
		displayName: 'Product Sections',
		name: 'productSections',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		required: true,
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
					{
						displayName: 'Section Title',
						name: 'sectionTitle',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Products',
						name: 'productItems',
						placeholder: 'Add Product',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								displayName: 'Product',
								name: 'product',
								values: [
									{
										displayName: 'Product Retailer ID',
										name: 'productRetailerId',
										type: 'string',
										default: '',
										required: true,
									},
								],
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Thumbnail Product Retailer ID',
		name: 'catalogThumbnailProductId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendCatalog'],
			},
		},
	},
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
	{
		displayName: 'Flow Header Text',
		name: 'flowHeaderText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				flowHeaderType: ['text'],
			},
		},
	},
	...interactiveHeaderMediaFields('flow', ['sendFlow']),
	{
		displayName: 'Flow Footer Text',
		name: 'flowFooterText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
	},
	{
		displayName: 'Flow ID',
		name: 'flowId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
		description: 'Meta Flow ID. Provide Flow ID or Flow Name, not both.',
	},
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
	{
		displayName: 'Flow Button Label',
		name: 'flowCta',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
	},
	{
		displayName: 'Flow Token',
		name: 'flowToken',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
			},
		},
		description: 'Session token for correlating Flow responses',
	},
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
	{
		displayName: 'Flow Screen',
		name: 'flowScreen',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendFlow'],
				flowAction: ['navigate'],
			},
		},
		description: 'Initial screen ID when Flow Action is Navigate',
	},
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
