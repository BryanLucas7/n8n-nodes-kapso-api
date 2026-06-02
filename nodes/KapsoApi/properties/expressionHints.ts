import { INodeProperties } from 'n8n-workflow';

export const KAPSO_DOCS = {
	webhookPayload: 'https://docs.kapso.ai/docs/platform/webhooks/event-types',
	webhookOverview: 'https://docs.kapso.ai/docs/platform/webhooks/overview',
	webhookSecurity: 'https://docs.kapso.ai/docs/platform/webhooks/security',
	templateSimple: 'https://docs.kapso.ai/docs/whatsapp/templates/simple-text',
	templateButtons: 'https://docs.kapso.ai/docs/whatsapp/templates/buttons',
	templateAdvanced: 'https://docs.kapso.ai/docs/whatsapp/templates/advanced',
	templateCarousel: 'https://docs.kapso.ai/docs/whatsapp/templates/carousel',
	templateMediaHeader: 'https://docs.kapso.ai/docs/whatsapp/templates/media-header',
	templateLocationHeader: 'https://docs.kapso.ai/docs/whatsapp/templates/location-header',
	sendText: 'https://docs.kapso.ai/docs/whatsapp/send-messages/text',
	sendMedia: 'https://docs.kapso.ai/docs/whatsapp/send-messages/media',
	sendMessage: 'https://docs.kapso.ai/api/meta/whatsapp/messages/send-a-message',
	sendLocation: 'https://docs.kapso.ai/docs/whatsapp/send-messages/location',
	locationRequest: 'https://docs.kapso.ai/docs/whatsapp/send-messages/location-request',
	sendButtons: 'https://docs.kapso.ai/docs/whatsapp/send-messages/buttons',
	sendContact: 'https://docs.kapso.ai/docs/whatsapp/send-messages/contact',
	sendFlow: 'https://docs.kapso.ai/docs/whatsapp/flows/sending-flows',
	flowsOverview: 'https://docs.kapso.ai/docs/whatsapp/flows/overview',
	sendReaction: 'https://docs.kapso.ai/docs/whatsapp/send-messages/reaction',
	markRead: 'https://docs.kapso.ai/docs/whatsapp/send-messages/mark-read',
	mediaUpload: 'https://docs.kapso.ai/api/meta/whatsapp/media/upload-media',
	inboxMessaging: 'https://docs.kapso.ai/docs/platform/inbox/messaging',
	broadcastApi: 'https://docs.kapso.ai/docs/platform/broadcasts-api',
	blockUsers: 'https://docs.kapso.ai/api/meta/whatsapp/block-users/block-users',
	customApi: 'https://docs.kapso.ai/docs/introduction',
} as const;

export function kapsoDocLink(url: string, label = 'Docs'): string {
	return `<a href="${url}" target="_blank">${label}</a>`;
}

/** Append a Kapso doc link to field description (?). */
export function withKapsoDoc(text: string, url: string, label: string): string {
	const trimmed = text.trim().replace(/\.\s*$/, '');
	return `${trimmed}. ${kapsoDocLink(url, label)}`;
}

export function noticeField(
	name: string,
	displayName: string,
	displayOptions?: INodeProperties['displayOptions'],
	theme: 'info' | 'warning' = 'info',
): INodeProperties {
	return {
		displayName,
		name,
		type: 'notice',
		default: '',
		typeOptions: { theme },
		...(displayOptions ? { displayOptions } : {}),
	};
}

export function docsNoticeField(
	name: string,
	text: string,
	url: string,
	label: string,
	displayOptions?: INodeProperties['displayOptions'],
): INodeProperties {
	return noticeField(name, withKapsoDoc(text, url, label), displayOptions);
}
