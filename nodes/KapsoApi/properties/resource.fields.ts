import { INodeProperties, INodePropertyModeTypeOptions } from 'n8n-workflow';
import { CUSTOM_API_CALL } from '../actions/operations';
import {
	e164PhoneResourceLocatorField,
	FILTER_STRING_MAX,
	httpUrlStringField,
	interactiveHeaderTextField,
	limitedStringField,
	mediaIdStringField,
	metaPhoneResourceLocatorField,
	uuidResourceLocatorIdMode,
	uuidStringField,
	DOWNLOAD_TOKEN_MAX,
	CUSTOM_RELATIVE_PATH_MAX,
} from './fieldConstraints';
import {
	templateButtonParameterCollectionOptions,
	templateButtonParametersField,
} from './templateShared.fields';

const listSearchMode = (searchListMethod: string) => ({
	displayName: 'From List',
	name: 'list',
	type: 'list' as const,
	typeOptions: {
		searchListMethod,
		searchable: true,
		searchFilterRequired: false,
	},
});

const idMode = (placeholder: string) => ({
	displayName: 'By ID',
	name: 'id',
	type: 'string' as const,
	placeholder,
	typeOptions: {
		maxLength: FILTER_STRING_MAX,
	} as unknown as INodePropertyModeTypeOptions,
});

export const resourceFields: INodeProperties[] = [
	mediaIdStringField('mediaId', 'Media ID', {
		show: {
			resource: ['media'],
			operation: ['getUrl', 'delete'],
		},
	}),
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['uploadBinary'],
			},
		},
		description: 'Input binary property that contains the file to upload to WhatsApp',
	},
	{
		displayName: 'Download Token',
		name: 'downloadToken',
		type: 'string',
		typeOptions: {
			maxLength: DOWNLOAD_TOKEN_MAX,
			password: true,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['download'],
			},
		},
		description: 'Short-lived token returned by the media URL endpoint download_url',
	},
	{
		displayName: 'Output Binary Property',
		name: 'outputBinaryProperty',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['download'],
			},
		},
	},
	{
		displayName: 'Conversation',
		name: 'conversationId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [listSearchMode('searchConversations'), uuidResourceLocatorIdMode('conversation-uuid')],
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['get', 'updateStatus'],
			},
		},
		description:
			'Kapso conversation. Search shows the 5 most recent matches; type to filter. Or paste an ID from the Kapso Trigger payload.',
	},
	{
		displayName: 'Contact',
		name: 'contactIdentifier',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [listSearchMode('searchContacts'), idMode('contact-uuid-or-phone')],
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['get', 'update', 'erase'],
			},
		},
		description: 'Contact UUID, phone number, or WhatsApp ID. Search shows 5 recent contacts.',
	},
	{
		displayName: 'Broadcast',
		name: 'broadcastId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [listSearchMode('searchBroadcasts'), uuidResourceLocatorIdMode('broadcast-uuid')],
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['get', 'addRecipients', 'listRecipients', 'send', 'schedule', 'cancel'],
			},
		},
		description: 'Broadcast campaign. Search shows 5 recent campaigns; type to filter.',
	},
	{
		displayName: 'Custom API Surface',
		name: 'customApiSurface',
		type: 'options',
		default: 'platform',
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
			},
		},
		options: [
			{ name: 'Platform Api', value: 'platform', description: '/platform/v1' },
			{ name: 'WhatsApp API', value: 'whatsapp', description: '/meta/whatsapp/v24.0' },
			{ name: 'Media Download Api', value: 'mediaDownload', description: '/meta/whatsapp' },
		],
		description: 'Kapso API prefix to apply before the custom relative path',
	},
	{
		displayName: 'Custom Method',
		name: 'customMethod',
		type: 'options',
		default: 'GET',
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
			},
		},
		options: [
			{ name: 'GET', value: 'GET' },
			{ name: 'POST', value: 'POST' },
			{ name: 'PATCH', value: 'PATCH' },
			{ name: 'PUT', value: 'PUT' },
			{ name: 'DELETE', value: 'DELETE' },
		],
	},
	limitedStringField('customPath', 'Custom Relative Path', CUSTOM_RELATIVE_PATH_MAX, {
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
			},
		},
		required: true,
		placeholder: '/whatsapp/contacts',
		description:
			'Relative path under the selected API surface. For WhatsApp API with Phone Number set, use paths such as /messages and the phone ID is prefixed automatically.',
	}),
	{
		displayName: 'Status',
		name: 'conversationStatus',
		type: 'options',
		options: [
			{ name: 'Active', value: 'active' },
			{ name: 'Ended', value: 'ended' },
		],
		default: 'ended',
		required: true,
		displayOptions: {
			show: {
				resource: ['conversation'],
				operation: ['updateStatus'],
			},
		},
		description: 'Kapso conversation status (`active` reopens, `ended` closes)',
	},
	e164PhoneResourceLocatorField('contactWaId', 'WhatsApp ID', {
		show: {
			resource: ['contact'],
			operation: ['create'],
		},
	}),
	{
		displayName: 'Profile Name',
		name: 'contactProfileName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Display Name',
		name: 'contactDisplayName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
	},
	uuidStringField('contactCustomerId', 'Customer ID', {
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
		description: 'Optional Kapso customer UUID',
	}),
	{
		displayName: 'Metadata JSON',
		name: 'contactMetadataJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
		description: 'Optional custom metadata object',
	},
	{
		displayName: 'Broadcast Name',
		name: 'broadcastName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Phone Number Name or ID',
		name: 'broadcastPhoneNumberId',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getPhoneNumbers',
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['create'],
			},
		},
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Template Name or ID',
		name: 'broadcastTemplateId',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getBroadcastTemplates',
			loadOptionsDependsOn: ['broadcastPhoneNumberId'],
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['create'],
			},
		},
		description:
			'Approved template Meta ID from the selected phone number. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Scheduled At',
		name: 'scheduledAt',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['schedule'],
			},
		},
		description: 'ISO 8601 datetime when the broadcast should send',
	},
	{
		displayName: 'Recipients',
		name: 'broadcastRecipients',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
			},
		},
		options: [
			{
				displayName: 'Recipient',
				name: 'recipientValues',
				values: [
					e164PhoneResourceLocatorField('phoneNumber', 'Phone Number', undefined, undefined, false),
					uuidStringField('whatsappContactId', 'Contact ID', {
						description: 'Optional existing Kapso contact UUID',
					}),
					{
						displayName: 'Body Parameters',
						name: 'bodyParameters',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								displayName: 'Parameter',
								name: 'bodyParameterValues',
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
						name: 'componentMode',
						type: 'options',
						options: [
							{ name: 'Standard', value: 'standard' },
							{ name: 'Carousel', value: 'carousel' },
						],
						default: 'standard',
					},
					{
						displayName: 'Header Type',
						name: 'headerType',
						type: 'options',
						options: [
							{ name: 'None', value: 'none' },
							{ name: 'Text', value: 'text' },
							{ name: 'Image', value: 'image' },
							{ name: 'Video', value: 'video' },
							{ name: 'Document', value: 'document' },
							{ name: 'Location', value: 'location' },
						],
						default: 'none',
						description: 'Standard template header type (ignored when Component Mode is Carousel)',
					},
					interactiveHeaderTextField('headerText', 'Header Text'),
					{
						displayName: 'Header Media Source',
						name: 'headerMediaSource',
						type: 'options',
						options: [
							{ name: 'Public Link', value: 'link' },
							{ name: 'Media ID', value: 'id' },
						],
						default: 'link',
						description: 'Media source when Header Type is Image, Video, or Document',
					},
					{
						displayName: 'Header Media URL',
						name: 'headerMediaUrl',
						type: 'string',
						default: '',
						placeholder: 'https://cdn.example.com/banner.jpg',
						description: 'Public media URL when Header Media Source is Public Link',
					},
					mediaIdStringField('headerMediaId', 'Header Media ID', undefined, false),
					{
						displayName: 'Header Latitude',
						name: 'headerLatitude',
						type: 'string',
						default: '',
						description: 'Location latitude when Header Type is Location',
					},
					{
						displayName: 'Header Longitude',
						name: 'headerLongitude',
						type: 'string',
						default: '',
						description: 'Location longitude when Header Type is Location',
					},
					{
						displayName: 'Header Location Name',
						name: 'headerLocationName',
						type: 'string',
						default: '',
						description: 'Location name when Header Type is Location',
					},
					{
						displayName: 'Header Location Address',
						name: 'headerLocationAddress',
						type: 'string',
						default: '',
						description: 'Location address when Header Type is Location',
					},
					templateButtonParametersField('buttonParameters'),
					{
						displayName: 'Carousel Cards',
						name: 'carouselCards',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description:
							'Carousel cards when Component Mode is Carousel. Card count must match the approved template.',
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
										placeholder: 'Add Button Parameter',
										typeOptions: {
											multipleValues: true,
											multipleValueButtonText: 'Add Button Parameter',
										},
										default: {},
										description:
											'Add one entry per carousel card button index. Pick the type that matches that button.',
										options: templateButtonParameterCollectionOptions,
									},
								],
							},
						],
					},
					{
						displayName: 'Advanced Components JSON',
						name: 'recipientComponentsJson',
						type: 'json',
						default: '',
						description:
							'Optional raw Meta components array for this recipient. Overrides the body, header, and button fields above.',
					},
				],
			},
		],
	},
	{
		displayName: 'Recipients Body JSON (Advanced)',
		name: 'recipientsBodyJson',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['addRecipients'],
			},
		},
		description:
			'Optional full Kapso request body with `whatsapp_broadcast.recipients` and Meta template components. When set, it overrides the Recipients builder.',
	},
	{
		displayName: 'Phone Number Name or ID',
		name: 'ingestPhoneNumberId',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getPhoneNumbers',
		},
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['uploadFromUrl'],
			},
		},
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	httpUrlStringField('ingestSourceUrl', 'Source URL', {
		show: {
			resource: ['media'],
			operation: ['uploadFromUrl'],
		},
	}, {
		placeholder: 'https://example.com/image.png',
		description: 'Public URL of the media file to ingest',
	}),
	{
		displayName: 'Delivery',
		name: 'ingestDelivery',
		type: 'options',
		options: [
			{ name: 'Meta Media', value: 'meta_media' },
			{ name: 'Meta Resumable Asset', value: 'meta_resumable_asset' },
		],
		default: 'meta_media',
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['uploadFromUrl'],
			},
		},
	},
	{
		displayName: 'Users',
		name: 'blockedUsers',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: ['blockUser'],
				operation: ['block', 'unblock'],
			},
		},
		options: [
			{
				displayName: 'User',
				name: 'userValues',
				values: [
					metaPhoneResourceLocatorField(
						'user',
						'User Phone',
						undefined,
						'WhatsApp user phone number without plus sign (Meta block_users API)',
					),
				],
			},
		],
	},
	{
		displayName: 'Body JSON',
		name: 'bodyJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
				customMethod: ['POST', 'PATCH', 'PUT', 'DELETE'],
			},
		},
		description: 'Optional Kapso or Meta-compatible JSON request body for Custom API Call',
	},
];
