import { INodePropertyOptions } from 'n8n-workflow';

export const CUSTOM_API_CALL = '__CUSTOM_API_CALL__';

export const resourceOptions: INodePropertyOptions[] = [
	{ name: 'Message', value: 'message' },
	{ name: 'Platform Message', value: 'platformMessage' },
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
		{ name: 'Send Sticker', value: 'sendSticker', action: 'Send a sticker message' },
		{ name: 'Send Location', value: 'sendLocation', action: 'Send a location pin' },
		{ name: 'Request Location', value: 'requestLocation', action: 'Ask the user to share their location' },
		{ name: 'Send Buttons', value: 'sendButtons', action: 'Send an interactive button message' },
		{ name: 'Send List', value: 'sendList', action: 'Send an interactive list message' },
		{ name: 'Send CTA URL', value: 'sendCtaUrl', action: 'Send an interactive call-to-action URL button' },
		{ name: 'Send Product', value: 'sendProduct', action: 'Send a single catalog product message' },
		{ name: 'Send Product List', value: 'sendProductList', action: 'Send a multi-product catalog message' },
		{ name: 'Send Catalog', value: 'sendCatalog', action: 'Send a catalog browse message' },
		{ name: 'Send Flow', value: 'sendFlow', action: 'Send a WhatsApp Flow message' },
		{ name: 'Request Call Permission', value: 'sendCallPermission', action: 'Request permission to call the user' },
		{ name: 'Send Contact', value: 'sendContact', action: 'Send a contact card message' },
		{ name: 'Send Template', value: 'sendTemplate', action: 'Send a template message' },
		{ name: 'Send or Remove Reaction', value: 'sendReaction', action: 'Send or remove a message reaction' },
		{ name: 'Mark as Read', value: 'markRead', action: 'Mark a message as read' },
		{ name: 'List Messages', value: 'list', action: 'List messages (advanced)' },
		{ name: 'Get Message', value: 'get', action: 'Get a message (advanced)' },
	],
	platformMessage: [
		{ name: 'List', value: 'list', action: 'List messages across conversations' },
		{ name: 'Get', value: 'get', action: 'Get a message by WAMID' },
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
		{ name: 'List', value: 'list', action: 'List contacts' },
		{ name: 'Create', value: 'create', action: 'Create a contact' },
		{ name: 'Update', value: 'update', action: 'Update a contact' },
		{ name: 'Erase', value: 'erase', action: 'Erase a contact' },
	],
	conversation: [
		{ name: 'Get', value: 'get', action: 'Get a conversation' },
		{ name: 'List', value: 'list', action: 'List conversations' },
		{ name: 'Update Status', value: 'updateStatus', action: 'Update conversation status' },
	],
	broadcast: [
		{ name: 'Create', value: 'create', action: 'Create a broadcast' },
		{ name: 'List', value: 'list', action: 'List broadcasts' },
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

export const resourcesWithPagination = [
	'message:list',
	'platformMessage:list',
	'contact:list',
	'conversation:list',
	'broadcast:list',
	'broadcast:listRecipients',
];

export const resourcesWithCursorPagination = [
	'message:list',
	'platformMessage:list',
	'contact:list',
	'conversation:list',
];

export const resourcesWithPagePagination = ['broadcast:list', 'broadcast:listRecipients'];

export const messageSendOperations = [
	'sendText',
	'sendImage',
	'sendVideo',
	'sendAudio',
	'sendDocument',
	'sendSticker',
	'sendLocation',
	'requestLocation',
	'sendButtons',
	'sendList',
	'sendCtaUrl',
	'sendProduct',
	'sendProductList',
	'sendCatalog',
	'sendFlow',
	'sendCallPermission',
	'sendContact',
	'sendTemplate',
	'sendReaction',
] as const;

export const messageMediaOperations = ['sendImage', 'sendVideo', 'sendAudio', 'sendDocument'] as const;

export const messageStickerOperations = ['sendSticker'] as const;

export const messageReplyOperations = [
	'sendText',
	...messageMediaOperations,
	'sendSticker',
	'sendLocation',
	'sendButtons',
	'sendList',
	'sendCtaUrl',
	'sendProduct',
	'sendProductList',
	'sendCatalog',
	'sendFlow',
] as const;
