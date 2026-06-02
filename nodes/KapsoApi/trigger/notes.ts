import { INodeProperties } from 'n8n-workflow';
import type { KapsoWebhookEvent } from './events';
import { KAPSO_DOCS, kapsoDocLink } from '../properties/expressionHints';

export const KAPSO_WEBHOOK_DOCS_URL = KAPSO_DOCS.webhookOverview;

export const KAPSO_WEBHOOK_DASHBOARD_URL = 'https://app.kapso.ai';

export const configureWebhookNotice: INodeProperties = {
	displayName:
		'Copy the n8n <b>Test URL</b> while testing, or the <b>Production URL</b> after activating the workflow, into Kapso Dashboard > Integrate > API &amp; Webhooks > WhatsApp webhooks. Set the same <b>Webhook Secret</b> on the Kapso API credential. ' +
		kapsoDocLink(KAPSO_DOCS.webhookPayload, 'Event types') +
		' · <a href="' +
		KAPSO_WEBHOOK_DASHBOARD_URL +
		'" target="_blank">Dashboard</a> · <a href="' +
		KAPSO_WEBHOOK_DOCS_URL +
		'" target="_blank">Webhooks</a>',
	name: 'kapsoSetupNotice',
	type: 'notice',
	typeOptions: {
		theme: 'info',
	},
	default: '',
};

const EVENT_OUTPUT_HINTS: Record<string, string> = {
	'whatsapp.message.received': 'inbound customer message',
	'whatsapp.message.sent': 'outbound message accepted by Meta',
	'whatsapp.message.delivered': 'delivery confirmation',
	'whatsapp.message.read': 'read receipt',
	'whatsapp.message.failed': 'send or delivery failure',
	'whatsapp.conversation.created': 'new inbox conversation',
	'whatsapp.conversation.ended': 'conversation closed',
	'whatsapp.conversation.inactive': 'conversation inactive timeout',
	__kapso_unknown__: 'any unrecognized Kapso event type',
};

export function makeKapsoEventNotice(events: KapsoWebhookEvent[]): INodeProperties {
	const parts = [
		'Each output maps to one Kapso event type. Unrecognized events go to <b>Other Event</b>. Each item includes the original payload, <code>kapso_event</code>, and normalized Kapso fields such as <code>content</code>, <code>message_id</code>, <code>conversation_id</code>, and contact data when available.',
		'<b>Events</b>:',
	];
	for (const event of events) {
		const hint = EVENT_OUTPUT_HINTS[event.value];
		parts.push(hint ? `- ${event.name}: ${hint}` : `- ${event.name}`);
	}

	return {
		displayName: parts.join('<br>'),
		name: 'kapsoEventsNotice',
		type: 'notice',
		typeOptions: {
			theme: 'info',
		},
		default: '',
	};
}
