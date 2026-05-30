import { INodePropertyOptions } from 'n8n-workflow';

export const CUSTOM_API_CALL = '__CUSTOM_API_CALL__';

export const resourceOptions: INodePropertyOptions[] = [
	{ name: 'Message', value: 'message' },
	{ name: 'Media', value: 'media' },
	{ name: 'Contact', value: 'contact' },
	{ name: 'Conversation', value: 'conversation' },
	{ name: 'Broadcast', value: 'broadcast' },
	{ name: 'Block User', value: 'blockUser' },
	{ name: 'Custom API Call', value: CUSTOM_API_CALL },
];

export const operationOptionsByResource: Record<string, INodePropertyOptions[]> = {
	message: [
		{ name: 'Send Text', value: 'sendText', action: 'Send a text message' },
		{ name: 'Send Image', value: 'sendImage', action: 'Send an image message' },
		{ name: 'Send Video', value: 'sendVideo', action: 'Send a video message' },
		{ name: 'Send Audio', value: 'sendAudio', action: 'Send an audio message' },
		{ name: 'Send Document', value: 'sendDocument', action: 'Send a document message' },
		{ name: 'Send Buttons', value: 'sendButtons', action: 'Send an interactive button message' },
		{ name: 'Send List', value: 'sendList', action: 'Send an interactive list message' },
		{ name: 'Send Contact', value: 'sendContact', action: 'Send a contact card message' },
		{ name: 'Send Template', value: 'sendTemplate', action: 'Send a template message' },
		{ name: 'Send Reaction', value: 'sendReaction', action: 'Send a message reaction' },
		{ name: 'Mark as Read', value: 'markRead', action: 'Mark a message as read' },
		{ name: 'Send Raw JSON', value: 'sendRaw', action: 'Send a raw Meta-compatible message body' },
		{ name: 'List Messages', value: 'list', action: 'List messages (advanced)' },
		{ name: 'Get Message', value: 'get', action: 'Get a message (advanced)' },
	],
	media: [
		{ name: 'Upload Binary', value: 'uploadBinary', action: 'Upload media from binary data' },
		{ name: 'Upload From URL', value: 'uploadFromUrl', action: 'Upload media from a URL' },
		{ name: 'Get URL', value: 'getUrl', action: 'Get media URL' },
		{ name: 'Download', value: 'download', action: 'Download media' },
		{ name: 'Delete', value: 'delete', action: 'Delete media' },
	],
	contact: [
		{ name: 'Get', value: 'get', action: 'Get a contact' },
		{ name: 'Create', value: 'create', action: 'Create a contact' },
		{ name: 'Update', value: 'update', action: 'Update a contact' },
		{ name: 'Erase', value: 'erase', action: 'Erase a contact' },
	],
	conversation: [
		{ name: 'Get', value: 'get', action: 'Get a conversation' },
		{ name: 'Update Status', value: 'updateStatus', action: 'Update conversation status' },
	],
	broadcast: [
		{ name: 'Create', value: 'create', action: 'Create a broadcast' },
		{ name: 'Add Recipients', value: 'addRecipients', action: 'Add broadcast recipients' },
		{ name: 'Send', value: 'send', action: 'Send a broadcast' },
		{ name: 'Schedule', value: 'schedule', action: 'Schedule a broadcast' },
		{ name: 'Get', value: 'get', action: 'Get a broadcast' },
		{ name: 'List Recipients', value: 'listRecipients', action: 'List broadcast recipients' },
		{ name: 'Cancel Scheduled Broadcast', value: 'cancel', action: 'Cancel a scheduled broadcast' },
	],
	blockUser: [
		{ name: 'Block Users', value: 'block', action: 'Block users' },
		{ name: 'Unblock Users', value: 'unblock', action: 'Unblock users' },
	],
	[CUSTOM_API_CALL]: [{ name: 'Custom API Call', value: CUSTOM_API_CALL, action: 'Call a custom Kapso API path' }],
};

export const resourcesWithPagination = ['message:list', 'broadcast:listRecipients'];

export const operationsRequiringJsonBody = [`${CUSTOM_API_CALL}:${CUSTOM_API_CALL}`];

export const messageSendOperations = [
	'sendText',
	'sendImage',
	'sendVideo',
	'sendAudio',
	'sendDocument',
	'sendButtons',
	'sendList',
	'sendContact',
	'sendTemplate',
	'sendReaction',
	'sendRaw',
] as const;

export const messageMediaOperations = ['sendImage', 'sendVideo', 'sendAudio', 'sendDocument'] as const;

export const messageReplyOperations = [
	'sendText',
	...messageMediaOperations,
	'sendButtons',
	'sendList',
] as const;

export const messageAdvancedOperations = [
	'sendText',
	...messageMediaOperations,
	'sendButtons',
	'sendList',
	'sendTemplate',
	'sendRaw',
	'list',
	'get',
] as const;
