import { INodeProperties } from 'n8n-workflow';
import { interactiveBodyField, promptMessageField } from './fieldConstraints';
import { KAPSO_DOCS, withKapsoDoc } from './expressionHints';

/** Body text fields placed after headers/setup and before action buttons or sections. */
export const messageBodyFields: INodeProperties[] = [
	interactiveBodyField('bodyText', 'Body Text', {
		show: {
			resource: ['message'],
			operation: [
				'sendButtons',
				'sendList',
				'sendCta',
				'sendProductList',
				'sendFlow',
			],
		},
	}),
	interactiveBodyField('bodyText', 'Body Text', {
		show: {
			resource: ['message'],
			operation: ['sendProduct', 'sendCatalog'],
		},
	}, { required: false, description: 'Body text above the product or catalog content' }),
	promptMessageField(
		'bodyText',
		'Location Request Prompt',
		{
			show: {
				resource: ['message'],
				operation: ['requestLocation'],
			},
		},
		{
			placeholder: 'Please share your location so we can continue',
			description: withKapsoDoc(
				'Plain-text message shown above the Share Location button. Not JSON — one short sentence is enough',
				KAPSO_DOCS.locationRequest,
				'Location request',
			),
		},
	),
	promptMessageField(
		'bodyText',
		'Call Permission Prompt',
		{
			show: {
				resource: ['message'],
				operation: ['sendCallPermission'],
			},
		},
		{
			placeholder: 'May we call you on WhatsApp about your order?',
			description: withKapsoDoc(
				'Plain-text message shown before the call-permission request. Not JSON — one short sentence is enough',
				KAPSO_DOCS.sendButtons,
				'Buttons',
			),
		},
	),
];
