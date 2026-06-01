import { INodeProperties } from 'n8n-workflow';
import type { KapsoWebhookEvent } from './events';

export const KAPSO_WEBHOOK_DOCS_URL =
	'https://docs.kapso.ai/docs/platform/webhooks/overview';

export const KAPSO_WEBHOOK_DASHBOARD_URL = 'https://app.kapso.ai';

export const configureWebhookNotice: INodeProperties = {
	displayName:
		'Copy this webhook URL into Kapso under <b>Integrate → API &amp; Webhooks → WhatsApp webhooks</b>, then set the Webhook Secret on the Kapso API credential.<br/>Open the <a href="' +
		KAPSO_WEBHOOK_DASHBOARD_URL +
		'" target="_blank">Kapso dashboard</a> or read the <a href="' +
		KAPSO_WEBHOOK_DOCS_URL +
		'" target="_blank">webhook documentation</a>.',
	name: 'kapsoSetupNotice',
	type: 'notice',
	typeOptions: {
		theme: 'info',
	},
	default: '',
};

export function makeKapsoEventNotice(events: KapsoWebhookEvent[]): INodeProperties {
	const parts = ['<b>Events</b>:'];
	for (const event of events) {
		parts.push(`- ${event.name}`);
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
