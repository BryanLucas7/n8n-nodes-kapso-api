import { INodeProperties } from 'n8n-workflow';
import { messageMediaOperations, messageSendOperations } from '../actions/operations';
import {
	templateButtonParameterValues,
	templateHeaderTypeOptions,
} from './templateShared.fields';

const messageRecipientOperations = [...messageSendOperations];

const messageMediaOps = [...messageMediaOperations];
const messageCaptionOperations = ['sendImage', 'sendVideo', 'sendDocument'];

export const messageFields: INodeProperties[] = [
	{
		displayName: 'Recipient Phone',
		name: 'recipient',
		type: 'string',
		default: '',
		required: true,
		placeholder: '15551234567',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: messageRecipientOperations,
			},
		},
		description: 'Recipient phone number in international format without plus sign (Meta WhatsApp send API)',
	},
	{
		displayName: 'Text',
		name: 'textBody',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendText'],
			},
		},
	},
	{
		displayName: 'Media Source',
		name: 'mediaSource',
		type: 'options',
		options: [
			{ name: 'Media ID', value: 'id' },
			{ name: 'Public Link', value: 'link' },
		],
		default: 'id',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: messageMediaOps,
			},
		},
	},
	{
		displayName: 'Media Value',
		name: 'mediaValue',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: messageMediaOps,
			},
		},
		description: 'Media ID or public URL, depending on Media Source',
	},
	{
		displayName: 'Caption',
		name: 'caption',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: messageCaptionOperations,
			},
		},
	},
	{
		displayName: 'Filename',
		name: 'filename',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendDocument'],
			},
		},
		description: 'Used by WhatsApp document messages',
	},
	{
		displayName: 'Body Text',
		name: 'bodyText',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: [
					'sendButtons',
					'sendList',
					'sendCtaUrl',
					'sendProduct',
					'sendProductList',
					'sendCatalog',
					'sendFlow',
					'requestLocation',
					'sendCallPermission',
				],
			},
		},
	},
	{
		displayName: 'Buttons',
		name: 'buttons',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			maxValues: 3,
		},
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendButtons'],
			},
		},
		options: [
			{
				displayName: 'Button',
				name: 'buttonValues',
				values: [
					{
						displayName: 'Button ID',
						name: 'buttonId',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Button Title',
						name: 'buttonTitle',
						type: 'string',
						default: '',
						required: true,
					},
				],
			},
		],
	},
	{
		displayName: 'Header Text',
		name: 'headerText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendButtons'],
				buttonHeaderType: ['text'],
			},
		},
	},
	{
		displayName: 'Footer Text',
		name: 'footerText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendButtons', 'sendList', 'sendCtaUrl', 'sendProductList'],
			},
		},
	},
	{
		displayName: 'List Button Text',
		name: 'listButtonText',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendList'],
			},
		},
	},
	{
		displayName: 'Sections',
		name: 'sections',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendList'],
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
						displayName: 'Rows',
						name: 'rowValues',
						placeholder: 'Add Row',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								displayName: 'Row',
								name: 'row',
								values: [
									{
										displayName: 'Row ID',
										name: 'rowId',
										type: 'string',
										default: '',
										required: true,
									},
									{
										displayName: 'Row Title',
										name: 'rowTitle',
										type: 'string',
										default: '',
										required: true,
									},
									{
										displayName: 'Row Description',
										name: 'rowDescription',
										type: 'string',
										default: '',
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
		displayName: 'Contacts',
		name: 'contacts',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendContact'],
			},
		},
		options: [
			{
				displayName: 'Contact',
				name: 'contactValues',
				values: [
					{
						displayName: 'Formatted Name',
						name: 'formattedName',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Middle Name',
						name: 'middleName',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Name Prefix',
						name: 'namePrefix',
						type: 'string',
						default: '',
						placeholder: 'Dr.',
					},
					{
						displayName: 'Name Suffix',
						name: 'nameSuffix',
						type: 'string',
						default: '',
						placeholder: 'Jr.',
					},
					{
						displayName: 'Birthday',
						name: 'birthday',
						type: 'string',
						default: '',
						placeholder: '1990-01-01',
						description: 'ISO 8601 date (YYYY-MM-DD)',
					},
					{
						displayName: 'Phones',
						name: 'phones',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						required: true,
						options: [
							{
								displayName: 'Phone',
								name: 'phoneValues',
								values: [
									{
										displayName: 'Phone Number',
										name: 'phoneNumber',
										type: 'string',
										default: '',
										required: true,
									},
									{
										displayName: 'Phone Type',
										name: 'phoneType',
										type: 'options',
										options: [
											{ name: 'Mobile', value: 'MOBILE' },
											{ name: 'Work', value: 'WORK' },
											{ name: 'Home', value: 'HOME' },
											{ name: 'Main', value: 'MAIN' },
										],
										default: 'MOBILE',
									},
									{
										displayName: 'WhatsApp ID',
										name: 'waId',
										type: 'string',
										default: '',
										description: 'Optional WhatsApp user ID for this phone entry',
									},
								],
							},
						],
					},
					{
						displayName: 'Emails',
						name: 'emails',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						options: [
							{
								displayName: 'Email',
								name: 'emailValues',
								values: [
									{
										displayName: 'Email',
										name: 'email',
										type: 'string',
										placeholder: 'name@email.com',
										default: '',
										required: true,
									},
									{
										displayName: 'Email Type',
										name: 'emailType',
										type: 'options',
										options: [
											{ name: 'Work', value: 'WORK' },
											{ name: 'Home', value: 'HOME' },
										],
										default: 'WORK',
									},
								],
							},
						],
					},
					{
						displayName: 'Organization',
						name: 'organization',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Organization Department',
						name: 'orgDepartment',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Organization Title',
						name: 'orgTitle',
						type: 'string',
						default: '',
					},
					{
						displayName: 'URLs',
						name: 'urls',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						options: [
							{
								displayName: 'URL',
								name: 'urlValues',
								values: [
									{
										displayName: 'URL',
										name: 'url',
										type: 'string',
										default: '',
										required: true,
									},
									{
										displayName: 'URL Type',
										name: 'urlType',
										type: 'options',
										options: [
											{ name: 'Work', value: 'WORK' },
											{ name: 'Home', value: 'HOME' },
										],
										default: 'WORK',
									},
								],
							},
						],
					},
					{
						displayName: 'Addresses',
						name: 'addresses',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						options: [
							{
								displayName: 'Address',
								name: 'addressValues',
								values: [
									{
										displayName: 'Street',
										name: 'street',
										type: 'string',
										default: '',
									},
									{
										displayName: 'City',
										name: 'city',
										type: 'string',
										default: '',
									},
									{
										displayName: 'State',
										name: 'state',
										type: 'string',
										default: '',
									},
									{
										displayName: 'ZIP',
										name: 'zip',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Country',
										name: 'country',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Country Code',
										name: 'countryCode',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Address Type',
										name: 'addressType',
										type: 'options',
										options: [
											{ name: 'Work', value: 'WORK' },
											{ name: 'Home', value: 'HOME' },
										],
										default: 'WORK',
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
		displayName: 'Template Name or ID',
		name: 'templateName',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getMessageTemplates',
			loadOptionsDependsOn: ['phoneNumberId'],
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Language Code',
		name: 'languageCode',
		type: 'string',
		default: 'en_US',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
	},
	{
		displayName: 'Body Text Parameters',
		name: 'templateBodyParameters',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
			},
		},
		options: [
			{
				displayName: 'Parameter',
				name: 'parameterValues',
				values: [
					{
						displayName: 'Parameter Name',
						name: 'parameterName',
						type: 'string',
						default: '',
						placeholder: 'first_name',
						description:
							'Named template variable when the template uses named parameters',
					},
					{
						displayName: 'Text',
						name: 'parameterText',
						type: 'string',
						default: '',
						required: true,
					},
				],
			},
		],
	},
	{
		displayName: 'Component Mode',
		name: 'templateComponentMode',
		type: 'options',
		options: [
			{ name: 'Standard', value: 'standard' },
			{ name: 'Carousel', value: 'carousel' },
		],
		default: 'standard',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description:
			'Carousel mode builds a template carousel component. Card count must match the approved template.',
	},
	{
		displayName: 'Header Type',
		name: 'templateHeaderType',
		type: 'options',
		options: templateHeaderTypeOptions,
		default: 'none',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
			},
		},
	},
	{
		displayName: 'Header Text',
		name: 'templateHeaderText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['text'],
			},
		},
	},
	{
		displayName: 'Header Media Source',
		name: 'templateHeaderMediaSource',
		type: 'options',
		options: [
			{ name: 'Public Link', value: 'link' },
			{ name: 'Media ID', value: 'id' },
		],
		default: 'link',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['image', 'video', 'document'],
			},
		},
	},
	{
		displayName: 'Header Media URL',
		name: 'templateHeaderMediaUrl',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['image', 'video', 'document'],
				templateHeaderMediaSource: ['link'],
			},
		},
	},
	{
		displayName: 'Header Media ID',
		name: 'templateHeaderMediaId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['image', 'video', 'document'],
				templateHeaderMediaSource: ['id'],
			},
		},
	},
	{
		displayName: 'Header Latitude',
		name: 'templateHeaderLatitude',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['location'],
			},
		},
	},
	{
		displayName: 'Header Longitude',
		name: 'templateHeaderLongitude',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['location'],
			},
		},
	},
	{
		displayName: 'Header Location Name',
		name: 'templateHeaderLocationName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['location'],
			},
		},
	},
	{
		displayName: 'Header Location Address',
		name: 'templateHeaderLocationAddress',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
				templateHeaderType: ['location'],
			},
		},
	},
	{
		displayName: 'Carousel Cards',
		name: 'templateCarouselCards',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['carousel'],
			},
		},
		description:
			'Each card must match the approved template carousel card count and card_index order',
		options: [
			{
				displayName: 'Card',
				name: 'cardValues',
				values: [
					{
						displayName: 'Card Index',
						name: 'cardIndex',
						type: 'number',
						default: 0,
						required: true,
						typeOptions: { minValue: 0 },
					},
					{
						displayName: 'Header Type',
						name: 'cardHeaderType',
						type: 'options',
						options: [
							{ name: 'Image', value: 'image' },
							{ name: 'Video', value: 'video' },
						],
						default: 'image',
					},
					{
						displayName: 'Header Media Source',
						name: 'cardHeaderMediaSource',
						type: 'options',
						options: [
							{ name: 'Public Link', value: 'link' },
							{ name: 'Media ID', value: 'id' },
						],
						default: 'link',
					},
					{
						displayName: 'Header Media URL',
						name: 'cardHeaderMediaUrl',
						type: 'string',
						default: '',
						displayOptions: {
							show: { cardHeaderMediaSource: ['link'] },
						},
					},
					{
						displayName: 'Header Media ID',
						name: 'cardHeaderMediaId',
						type: 'string',
						default: '',
						displayOptions: {
							show: { cardHeaderMediaSource: ['id'] },
						},
					},
					{
						displayName: 'Body Parameters',
						name: 'cardBodyParameters',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						options: [
							{
								displayName: 'Parameter',
								name: 'parameterValues',
								values: [
									{
										displayName: 'Parameter Name',
										name: 'parameterName',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Text',
										name: 'parameterText',
										type: 'string',
										default: '',
										required: true,
									},
								],
							},
						],
					},
					{
						displayName: 'Button Parameters',
						name: 'cardButtonParameters',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						options: [
							{
								displayName: 'Button',
								name: 'buttonValues',
								values: templateButtonParameterValues,
							},
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Button Parameters',
		name: 'templateButtonParameters',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateComponentMode: ['standard'],
			},
		},
		options: [
			{
				displayName: 'Button',
				name: 'buttonValues',
				values: templateButtonParameterValues,
			},
		],
	},
	{
		displayName: 'React To Message ID',
		name: 'reactionMessageId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendReaction'],
			},
		},
	},
	{
		displayName: 'Remove Reaction',
		name: 'removeReaction',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendReaction'],
			},
		},
		description: 'Whether to send an empty emoji to remove the reaction from the message',
	},
	{
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '👍',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendReaction'],
				removeReaction: [false],
			},
		},
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['get', 'markRead'],
			},
		},
	},
	{
		displayName: 'Typing Indicator',
		name: 'typingIndicator',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['markRead'],
			},
		},
	},
];
