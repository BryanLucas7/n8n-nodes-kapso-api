/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { KAPSO_WEBHOOK_EVENTS } from './trigger/events';
import { makeKapsoWebhookHandler } from './trigger/trigger';

export class KapsoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kapso Trigger',
		name: 'kapsoTrigger',
		icon: 'file:kapso.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Kapso WhatsApp webhook events are received',
		defaults: {
			name: 'Kapso Trigger',
		},
		inputs: [],
		outputs: Array.from({ length: KAPSO_WEBHOOK_EVENTS.length }, () => NodeConnectionTypes.Main),
		outputNames: KAPSO_WEBHOOK_EVENTS.map((event) => event.name),
		credentials: [
			{
				name: 'kapsoApi',
				required: false,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'kapso',
			},
		],
		properties: [
			{
				displayName:
					'Configure this webhook URL in the Kapso dashboard. Kapso sends the event type in the X-Webhook-Event header.',
				name: 'kapsoWebhookNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Documentation',
				name: 'kapsoWebhookDocs',
				type: 'notice',
				default: '',
				typeOptions: {
					openUrl: true,
				},
				description:
					'Open https://docs.kapso.ai/docs/platform/webhooks/phone-numbers',
			},
			{
				displayName:
					'Chain to Kapso API with expression defaults for phone number, recipient, and message identifiers from the webhook payload.',
				name: 'kapsoChainNotice',
				type: 'notice',
				default: '',
				description:
					'See Kapso docs for recommended expression defaults on the Kapso API node after this trigger',
			},
		],
	};

	webhook = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
}
