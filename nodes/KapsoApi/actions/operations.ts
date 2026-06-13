import { INodePropertyOptions } from 'n8n-workflow';
import { SEND_AND_WAIT_OPERATION } from 'n8n-workflow';

export const CUSTOM_API_CALL = '__CUSTOM_API_CALL__';

export const resourceOptions: INodePropertyOptions[] = [
	{
		name: 'Message',
		value: 'message',
		description: 'Send text, media, interactive messages, templates, flows, and catalog messages to a recipient',
	},
	{
		name: 'Platform Messages',
		value: 'platformMessage',
		description: 'List or get inbox messages across Kapso conversations by WAMID or filters',
	},
	{
		name: 'Media',
		value: 'media',
		description: 'Upload, download, or delete WhatsApp media for the selected phone number',
	},
	{
		name: 'Contact',
		value: 'contact',
		description: 'Create, update, list, or erase Kapso contact records tied to WhatsApp numbers',
	},
	{
		name: 'Conversation',
		value: 'conversation',
		description: 'Get, list, or update Kapso inbox conversation status',
	},
	{
		name: 'Broadcast',
		value: 'broadcast',
		description: 'Create draft campaigns, add recipients, send or schedule template broadcasts',
	},
	{
		name: 'Block User',
		value: 'blockUser',
		description: 'Block or unblock WhatsApp users for the selected business phone number',
	},
	{
		name: 'Custom API Call',
		value: CUSTOM_API_CALL,
		description: 'Call any documented Kapso or Meta-compatible endpoint with a custom path and body',
	},
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
		{ name: 'Send Buttons (Quick Reply)', value: 'sendButtons', action: 'Send a quick-reply interactive message (1-3 reply buttons)' },
		{ name: 'Send List', value: 'sendList', action: 'Send an interactive list message' },
		{ name: 'Send CTA', value: 'sendCta', action: 'Send an interactive call-to-action button (URL or phone)' },
		{ name: 'Send Product', value: 'sendProduct', action: 'Send a single catalog product message' },
		{ name: 'Get Catalogs', value: 'getCatalog', action: 'List WhatsApp product catalogs for the WABA' },
		{ name: 'Send Product List', value: 'sendProductList', action: 'Send a multi-product catalog message' },
		{ name: 'Send Catalog', value: 'sendCatalog', action: 'Send a catalog browse message' },
		{ name: 'Send Flow', value: 'sendFlow', action: 'Send a WhatsApp Flow message' },
		{ name: 'Request Call Permission', value: 'sendCallPermission', action: 'Request permission to call the user' },
		{ name: 'Send Contact', value: 'sendContact', action: 'Send a contact card message' },
		{ name: 'Send Template', value: 'sendTemplate', action: 'Send a template message' },
		{
			name: 'Send and Wait for Response',
			value: SEND_AND_WAIT_OPERATION,
			action: 'Send a message and wait for response',
		},
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
		{ name: 'Create Draft Broadcast', value: 'create', action: 'Create a draft broadcast campaign' },
		{ name: 'List', value: 'list', action: 'List broadcasts' },
		{
			name: 'Add Recipients to Broadcast',
			value: 'addRecipients',
			action: 'Add recipients to a draft broadcast',
		},
		{ name: 'Send Broadcast Now', value: 'send', action: 'Send a draft broadcast immediately' },
		{ name: 'Schedule Broadcast', value: 'schedule', action: 'Schedule a draft broadcast' },
		{ name: 'Get', value: 'get', action: 'Get a broadcast' },
		{ name: 'List Recipients', value: 'listRecipients', action: 'List broadcast recipients' },
		{
			name: 'Cancel Scheduled Broadcast',
			value: 'cancel',
			action: 'Cancel a scheduled broadcast and return it to draft',
		},
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
	'sendCta',
	'sendProduct',
	'sendProductList',
	'sendCatalog',
	'sendFlow',
	'sendCallPermission',
	'sendContact',
	'sendTemplate',
	SEND_AND_WAIT_OPERATION,
	'sendReaction',
] as const;

export const messageMediaOperations = ['sendImage', 'sendVideo', 'sendAudio', 'sendDocument'] as const;

export const messageStickerOperations = ['sendSticker'] as const;

export const messageLinkPreviewOperations = ['sendText'] as const;

export const messageReplyOperations = [
	'sendText',
	...messageMediaOperations,
	'sendSticker',
	'sendLocation',
	'sendButtons',
	'sendList',
	'sendCta',
	'sendProduct',
	'sendProductList',
	'sendCatalog',
	'sendFlow',
	'sendContact',
	'requestLocation',
	'sendCallPermission',
	SEND_AND_WAIT_OPERATION,
] as const;
