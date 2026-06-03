import { INodeProperties, INodePropertyModeTypeOptions } from 'n8n-workflow';
import { CUSTOM_API_CALL } from '../actions/operations';
import {
	e164PhoneResourceLocatorField,
	FILTER_STRING_MAX,
	httpUrlStringField,
	limitedTextResourceLocatorField,
	maxLengthRegexValidation,
	mediaIdStringField,
	metaPhoneResourceLocatorField,
	uuidResourceLocatorIdMode,
	uuidStringField,
	DOWNLOAD_TOKEN_MAX,
	CUSTOM_RELATIVE_PATH_MAX,
} from './fieldConstraints';
import {
	KAPSO_DOCS,
	withKapsoDoc,
} from './expressionHints';
import { broadcastFields } from './broadcast.fields';
import { optionalLabel } from './displayNames';

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
	validation: [maxLengthRegexValidation(FILTER_STRING_MAX, { label: 'ID' })],
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
		requiresDataPath: 'single',
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['uploadBinary'],
			},
		},
		description: 'Input binary property that contains the file to upload to WhatsApp',
	},
	limitedTextResourceLocatorField('downloadToken', 'Download Token', DOWNLOAD_TOKEN_MAX, {
		required: true,
		password: true,
		modeName: 'token',
		modeDisplayName: 'Download Token',
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['download'],
			},
		},
		description:
			'Short-lived download_url token returned by Get Media URL (not the media ID itself)',
	}),
	{
		displayName: 'Output Binary Property',
		name: 'outputBinaryProperty',
		type: 'string',
		default: 'data',
		required: true,
		requiresDataPath: 'single',
		displayOptions: {
			show: {
				resource: ['media'],
				operation: ['download'],
			},
		},
		description: 'Output binary property name where the downloaded file is stored',
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
		description: withKapsoDoc(
			'Contact UUID, phone number, or WhatsApp ID. Search shows 5 recent contacts',
			KAPSO_DOCS.inboxMessaging,
			'Contacts',
		),
	},
	...broadcastFields,
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
		description: 'HTTP method for the custom Kapso API request',
	},
	limitedTextResourceLocatorField('customPath', 'Custom Relative Path', CUSTOM_RELATIVE_PATH_MAX, {
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
			},
		},
		required: true,
		placeholder: '/whatsapp/contacts',
		description: withKapsoDoc(
			'Relative path under the selected API surface. For WhatsApp API with Phone Number set, use paths such as /messages and the phone ID is prefixed automatically',
			KAPSO_DOCS.customApi,
			'API',
		),
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
	e164PhoneResourceLocatorField(
		'contactWaId',
		'Contact Phone Number',
		{
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
		'E.164 phone number with leading +. Kapso stores it as the contact wa_id for WhatsApp messaging.',
	),
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
		description: 'WhatsApp profile name shown in the Kapso inbox',
	},
	{
		displayName: optionalLabel('Display Name'),
		name: 'contactDisplayName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create', 'update'],
			},
		},
		description: 'Optional Kapso display name override for the contact',
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
		displayName: optionalLabel('Metadata JSON'),
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
			'WhatsApp account that stores the ingested media. Loaded from your connected Kapso numbers. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	httpUrlStringField('ingestSourceUrl', 'Source URL', {
		show: {
			resource: ['media'],
			operation: ['uploadFromUrl'],
		},
	}, {
		placeholder: 'https://example.com/image.png',
		description: 'Public URL of the media file to ingest into the selected WhatsApp account media store',
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
		description: 'Whether Kapso stores the file as Meta media or a resumable upload asset',
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
		description: 'Block or unblock WhatsApp users for this phone number',
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
		displayName: optionalLabel('Body JSON'),
		name: 'bodyJson',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				operation: [CUSTOM_API_CALL],
				customMethod: ['POST', 'PATCH', 'PUT', 'DELETE'],
			},
		},
		description: 'Optional JSON request body for Custom API Call',
	},
];
