import { INodeProperties } from 'n8n-workflow';
import { messageMediaOperations, messageSendOperations } from '../actions/operations';

const messageRecipientOperations = [
	...messageSendOperations.filter((operation) => operation !== 'sendRaw'),
];

const messageMediaOps = [...messageMediaOperations];

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
		description: 'Recipient phone number in international format without plus sign',
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
				operation: messageMediaOps,
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
				operation: ['sendButtons', 'sendList'],
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
				operation: ['sendButtons', 'sendList'],
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
						],
						default: 'MOBILE',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
					},
					{
						displayName: 'Organization',
						name: 'organization',
						type: 'string',
						default: '',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
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
			},
		},
		options: [
			{
				displayName: 'Parameter',
				name: 'parameterValues',
				values: [
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
		displayName: 'Header Parameter',
		name: 'headerParameter',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
			},
		},
		description: 'Text header parameter for text-based templates',
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
			},
		},
		options: [
			{
				displayName: 'Button',
				name: 'buttonValues',
				values: [
					{
						displayName: 'Text',
						name: 'buttonText',
						type: 'string',
						default: '',
						required: true,
					},
				],
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
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '👍',
		required: true,
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendReaction'],
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
