import { INodeProperties } from 'n8n-workflow';
import { messageMediaOperations, messageSendOperations } from '../actions/operations';
import {
	buttonIdField,
	buttonTitleField,
	documentFilenameField,
	emojiStringField,
	interactiveBodyField,
	interactiveFooterTextField,
	interactiveHeaderTextField,
	listButtonTextField,
	listRowDescriptionField,
	listRowIdField,
	listRowTitleField,
	listSectionTitleField,
	mediaCaptionField,
	mediaIdStringField,
	metaPhoneResourceLocatorField,
	publicUrlStringField,
	textMessageField,
	wamidStringField,
} from './fieldConstraints';
import {
	templateButtonParameterCollectionOptions,
} from './templateShared.fields';

const messageRecipientOperations = [...messageSendOperations];

const messageMediaOps = [...messageMediaOperations];
const messageCaptionOperations = ['sendImage', 'sendVideo', 'sendDocument'];

export const messageFields: INodeProperties[] = [
	metaPhoneResourceLocatorField('recipient', 'Recipient Phone', {
		show: {
			resource: ['message'],
			operation: messageRecipientOperations,
		},
	}),
	textMessageField({
		show: {
			resource: ['message'],
			operation: ['sendText'],
		},
	}),
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
	mediaIdStringField('mediaId', 'Media ID', {
		show: {
			resource: ['message'],
			operation: messageMediaOps,
			mediaSource: ['id'],
		},
	}),
	publicUrlStringField('mediaUrl', 'Public URL', {
		show: {
			resource: ['message'],
			operation: messageMediaOps,
			mediaSource: ['link'],
		},
	}),
	mediaCaptionField({
		show: {
			resource: ['message'],
			operation: messageCaptionOperations,
		},
	}),
	documentFilenameField('filename', 'Filename', {
		show: {
			resource: ['message'],
			operation: ['sendDocument'],
		},
	}),
	interactiveBodyField('bodyText', 'Body Text', {
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
	}),
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
				values: [buttonIdField(), buttonTitleField()],
			},
		],
	},
	interactiveHeaderTextField('headerText', 'Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendButtons'],
			buttonHeaderType: ['text'],
		},
	}),
	interactiveFooterTextField('footerText', 'Footer Text', {
		show: {
			resource: ['message'],
			operation: ['sendButtons', 'sendList', 'sendCtaUrl', 'sendProductList'],
		},
	}),
	listButtonTextField({
		show: {
			resource: ['message'],
			operation: ['sendList'],
		},
	}),
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
					listSectionTitleField(),
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
								values: [listRowIdField(), listRowTitleField(), listRowDescriptionField()],
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
		displayName: 'Language Name or ID',
		name: 'languageCode',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getTemplateLanguages',
			loadOptionsDependsOn: ['templateName', 'phoneNumberId'],
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
		displayName: 'Template Header Format Name or ID',
		name: 'templateDetectedHeaderFormat',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplateDetectedHeaderFormat',
			loadOptionsDependsOn: ['phoneNumberId', 'templateName', 'languageCode'],
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
		displayName: 'Template Component Mode Name or ID',
		name: 'templateDetectedComponentMode',
		type: 'options',
		default: '',
		typeOptions: {
			loadOptionsMethod: 'getTemplateDetectedComponentMode',
			loadOptionsDependsOn: ['phoneNumberId', 'templateName', 'languageCode'],
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
		displayName: 'Body Text Parameters',
		name: 'templateBodyParametersMapper',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
			},
		},
		typeOptions: {
			loadOptionsDependsOn: ['phoneNumberId', 'templateName', 'languageCode'],
			resourceMapper: {
				resourceMapperMethod: 'getTemplateBodyParameterFields',
				mode: 'add',
				addAllFields: true,
				supportAutoMap: false,
				fieldWords: {
					singular: 'parameter',
					plural: 'parameters',
				},
				noFieldsError: 'Select a template with body variables before mapping body parameters.',
			},
		},
		description: 'Fill the body variables defined by the selected template',
	},
	interactiveHeaderTextField('templateHeaderText', 'Header Text', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['text'],
		},
	}),
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
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['image'],
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
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['video'],
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
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['document'],
			},
		},
	},
	{
		displayName: 'Header Media URL',
		name: 'templateHeaderMediaUrl',
		type: 'string',
		default: '',
		validateType: 'url',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['image'],
				templateHeaderMediaSource: ['link'],
			},
		},
	},
	{
		displayName: 'Header Media URL',
		name: 'templateHeaderMediaUrl',
		type: 'string',
		default: '',
		validateType: 'url',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['video'],
				templateHeaderMediaSource: ['link'],
			},
		},
	},
	{
		displayName: 'Header Media URL',
		name: 'templateHeaderMediaUrl',
		type: 'string',
		default: '',
		validateType: 'url',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['document'],
				templateHeaderMediaSource: ['link'],
			},
		},
	},
	mediaIdStringField('templateHeaderMediaId', 'Header Media ID', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['image'],
			templateHeaderMediaSource: ['id'],
		},
	}, false),
	mediaIdStringField('templateHeaderMediaId', 'Header Media ID', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['video'],
			templateHeaderMediaSource: ['id'],
		},
	}, false),
	mediaIdStringField('templateHeaderMediaId', 'Header Media ID', {
		show: {
			resource: ['message'],
			operation: ['sendTemplate'],
			templateDetectedComponentMode: ['standard'],
			templateDetectedHeaderFormat: ['document'],
			templateHeaderMediaSource: ['id'],
		},
	}, false),
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
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
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
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
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
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
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
				templateDetectedComponentMode: ['standard'],
				templateDetectedHeaderFormat: ['location'],
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
				templateDetectedComponentMode: ['carousel'],
			},
		},
		description:
			'Each card must match the approved template carousel card count and card_index order. Header type is inferred from the template.',
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
						description: 'Public media URL when Header Media Source is Public Link',
					},
					mediaIdStringField('cardHeaderMediaId', 'Header Media ID', undefined, false),
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
						typeOptions: {
							multipleValues: true,
							multipleValueButtonText: 'Add Button',
						},
						default: {},
						options: templateButtonParameterCollectionOptions,
					},
				],
			},
		],
	},
	{
		displayName: 'Button Parameters',
		name: 'templateButtonParametersMapper',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendTemplate'],
				templateDetectedComponentMode: ['standard'],
			},
		},
		typeOptions: {
			loadOptionsDependsOn: ['phoneNumberId', 'templateName', 'languageCode'],
			resourceMapper: {
				resourceMapperMethod: 'getTemplateButtonParameterFields',
				mode: 'add',
				addAllFields: true,
				supportAutoMap: false,
				fieldWords: {
					singular: 'button parameter',
					plural: 'button parameters',
				},
				noFieldsError: 'Select a template with dynamic button parameters before mapping button values.',
			},
		},
		description:
			'Fill dynamic button values for the selected template. MPM sections JSON expects an array of `{ "title": "...", "product_items": [{ "product_retailer_id": "..." }] }`.',
	},
	wamidStringField('reactionMessageId', 'React To Message ID', {
		show: {
			resource: ['message'],
			operation: ['sendReaction'],
		},
	}),
	{
		displayName: 'Reaction Action',
		name: 'reactionMode',
		type: 'options',
		default: 'react',
		required: true,
		options: [
			{
				name: 'Add or Change Emoji',
				value: 'react',
				description:
					'Send an emoji reaction, or replace an existing reaction on this message with a different emoji',
			},
			{
				name: 'Remove Reaction',
				value: 'remove',
				description: 'Remove your business reaction from this message',
			},
		],
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['sendReaction'],
			},
		},
	},
	emojiStringField({
		show: {
			resource: ['message'],
			operation: ['sendReaction'],
			reactionMode: ['react'],
		},
	}),
	wamidStringField('messageId', 'Message ID', {
		show: {
			resource: ['message'],
			operation: ['get', 'markRead'],
		},
	}),
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
