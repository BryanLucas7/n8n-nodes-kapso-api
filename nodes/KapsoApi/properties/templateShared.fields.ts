import { INodeProperties } from 'n8n-workflow';

const templateButtonSubTypeOptions = [
	{ name: 'URL', value: 'url' },
	{ name: 'Quick Reply', value: 'quick_reply' },
	{ name: 'Flow', value: 'flow' },
	{ name: 'Copy Code', value: 'copy_code' },
	{ name: 'Catalog', value: 'catalog' },
	{ name: 'MPM', value: 'mpm' },
];

const templateButtonParameterTypeOptions = [
	{ name: 'Text', value: 'text' },
	{ name: 'Payload', value: 'payload' },
];

export const templateHeaderTypeOptions: INodeProperties['options'] = [
	{ name: 'None', value: 'none' },
	{ name: 'Text', value: 'text' },
	{ name: 'Image', value: 'image' },
	{ name: 'Video', value: 'video' },
	{ name: 'Document', value: 'document' },
	{ name: 'Location', value: 'location' },
];

export const templateButtonParameterValues: INodeProperties[] = [
	{
		displayName: 'Sub Type',
		name: 'buttonSubType',
		type: 'options',
		options: templateButtonSubTypeOptions,
		default: 'url',
	},
	{
		displayName: 'Index',
		name: 'buttonIndex',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: 0,
		},
	},
	{
		displayName: 'Parameter Type',
		name: 'buttonParameterType',
		type: 'options',
		options: templateButtonParameterTypeOptions,
		default: 'text',
		displayOptions: {
			show: {
				buttonSubType: ['url', 'quick_reply', 'copy_code'],
			},
		},
	},
	{
		displayName: 'Text',
		name: 'buttonText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				buttonSubType: ['url', 'quick_reply', 'copy_code'],
				buttonParameterType: ['text'],
			},
		},
		description: 'Dynamic button value (URL suffix, OTP code, etc.)',
	},
	{
		displayName: 'Payload',
		name: 'buttonPayload',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				buttonSubType: ['quick_reply'],
				buttonParameterType: ['payload'],
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
		displayOptions: {
			show: {
				buttonSubType: ['flow'],
			},
		},
	},
	{
		displayName: 'Flow Action Data JSON',
		name: 'flowActionDataJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				buttonSubType: ['flow'],
			},
		},
	},
	{
		displayName: 'Catalog Thumbnail Product ID',
		name: 'catalogThumbnailProductRetailerId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				buttonSubType: ['catalog'],
			},
		},
	},
	{
		displayName: 'MPM Thumbnail Product ID',
		name: 'mpmThumbnailProductRetailerId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				buttonSubType: ['mpm'],
			},
		},
	},
	{
		displayName: 'MPM Sections',
		name: 'mpmSectionValues',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				buttonSubType: ['mpm'],
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
						name: 'productValues',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								displayName: 'Product',
								name: 'productItems',
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
];

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
	{
		displayName: 'Header Media URL',
		name: `${prefix}HeaderMediaUrl`,
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource,
				operation,
				[`${prefix}HeaderType`]: ['image', 'video', 'document'],
				[`${prefix}HeaderMediaSource`]: ['link'],
			},
		},
	},
	{
		displayName: 'Header Media ID',
		name: `${prefix}HeaderMediaId`,
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource,
				operation,
				[`${prefix}HeaderType`]: ['image', 'video', 'document'],
				[`${prefix}HeaderMediaSource`]: ['id'],
			},
		},
		description: 'Media ID from Upload Media',
	},
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
