/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { KAPSO_WEBHOOK_EVENTS } from './trigger/events';
import {
	configureWebhookNotice,
	KAPSO_WEBHOOK_DOCS_URL,
	makeKapsoEventNotice,
} from './trigger/notes';
import { makeKapsoWebhookHandler } from './trigger/trigger';

export class KapsoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kapso Trigger',
		name: 'kapsoTrigger',
		icon: 'file:kapso.svg',
		group: ['trigger'],
		version: 1,
		description:
			'Starts the workflow when Kapso WhatsApp webhook events are received. Copy the n8n webhook URL into Kapso and set the matching Webhook Secret on the Kapso API credential.',
		documentationUrl: KAPSO_WEBHOOK_DOCS_URL,
		defaults: {
			name: 'Kapso Trigger',
		},
		inputs: [],
		outputs: Array.from({ length: KAPSO_WEBHOOK_EVENTS.length }, () => NodeConnectionTypes.Main),
		outputNames: KAPSO_WEBHOOK_EVENTS.map((event) => event.name),
		credentials: [
			{
				name: 'kapsoApi',
				required: true,
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
		properties: [configureWebhookNotice, makeKapsoEventNotice(KAPSO_WEBHOOK_EVENTS)],
	};

	webhook = makeKapsoWebhookHandler(KAPSO_WEBHOOK_EVENTS);
}
