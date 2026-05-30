export type KapsoWebhookEvent = {
	name: string;
	value: string;
};

export const KAPSO_WEBHOOK_EVENTS: KapsoWebhookEvent[] = [
	{ name: 'Message Received', value: 'whatsapp.message.received' },
	{ name: 'Message Sent', value: 'whatsapp.message.sent' },
	{ name: 'Message Delivered', value: 'whatsapp.message.delivered' },
	{ name: 'Message Read', value: 'whatsapp.message.read' },
	{ name: 'Message Failed', value: 'whatsapp.message.failed' },
	{ name: 'Conversation Created', value: 'whatsapp.conversation.created' },
	{ name: 'Conversation Ended', value: 'whatsapp.conversation.ended' },
	{ name: 'Conversation Inactive', value: 'whatsapp.conversation.inactive' },
];
