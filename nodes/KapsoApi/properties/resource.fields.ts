import { INodeProperties } from 'n8n-workflow';
import { CUSTOM_API_CALL } from '../actions/operations';

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
});

export const resourceFields: INodeProperties[] = [
	{
		displayName: 'Media ID',
		name: 'mediaId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['getUrl', 'delete'],
			},
		},
	},
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
		typeOptions: { password: true },
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
		modes: [listSearchMode('searchConversations'), idMode('conversation-uuid')],
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
		modes: [listSearchMode('searchBroadcasts'), idMode('broadcast-uuid')],
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
	{
		displayName: 'Custom Relative Path',
		name: 'customPath',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
			},
		},
		placeholder: '/whatsapp/contacts',
		description:
			'Relative documented Kapso path under the selected API surface. Full URLs are rejected.',
	},
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
	{
		displayName: 'WhatsApp ID',
		name: 'contactWaId',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+15551234567',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
		description: 'Contact phone number in E.164 format',
	},
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
	{
		displayName: 'Customer ID',
		name: 'contactCustomerId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
		description: 'Optional Kapso customer UUID',
	},
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
		type: 'string',
		default: '',
		required: true,
		placeholder: '784203120908608',
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: ['create'],
			},
		},
		description: 'Meta template ID (preferred) or Kapso template UUID',
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
					{
						displayName: 'Phone Number',
						name: 'phoneNumber',
						type: 'string',
						default: '',
						placeholder: '+15551234567',
						description: 'E.164 phone number (required unless Contact ID is set)',
					},
					{
						displayName: 'Contact ID',
						name: 'whatsappContactId',
						type: 'string',
						default: '',
						description: 'Optional existing Kapso contact UUID',
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
	{
		displayName: 'Source URL',
		name: 'ingestSourceUrl',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com/image.png',
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['uploadFromUrl'],
			},
		},
		description: 'Public URL of the media file to ingest',
	},
	{
		displayName: 'Delivery',
		name: 'ingestDelivery',
		type: 'options',
		options: [
			{ name: 'Meta Media', value: 'meta_media' },
			{ name: 'Kapso Media', value: 'kapso_media' },
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
					{
						displayName: 'User Phone',
						name: 'user',
						type: 'string',
						default: '',
						required: true,
						placeholder: '15551234567',
						description: 'WhatsApp user phone number without plus sign',
					},
				],
			},
		],
	},
	{
		displayName: 'Body JSON',
		name: 'bodyJson',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
			},
		},
		description: 'Documented Kapso or Meta-compatible JSON request body for Custom API Call',
	},
];
