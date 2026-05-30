import { INodeProperties } from 'n8n-workflow';
import { CUSTOM_API_CALL, operationsRequiringJsonBody } from '../actions/operations';

function operationKeysToOperations(keys: string[]): string[] {
	return [...new Set(keys.map((key) => key.split(':')[1]))];
}

const bodyOperations = operationKeysToOperations(operationsRequiringJsonBody);

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
		displayName: 'Body JSON',
		name: 'bodyJson',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				operation: bodyOperations,
			},
		},
		description: 'Documented Kapso or Meta-compatible JSON request body',
	},
];
