import { INodeProperties } from 'n8n-workflow';
import { KAPSO_DOCS, withKapsoDoc } from './expressionHints';

export const flowModeField: INodeProperties = {
	displayName: 'Flow Mode',
	name: 'flowMode',
	type: 'options',
	default: '',
	options: [
		{
			name: 'Auto (Published)',
			value: '',
			description: 'Use published flows by default; draft mode applies automatically when a draft Flow is selected',
		},
		{
			name: 'Draft',
			value: 'draft',
			description: 'Search and send draft flows only (for testing before publish)',
		},
		{
			name: 'Published',
			value: 'published',
			description: 'Search and send published flows only, even if a draft Flow was previously selected',
		},
	],
	displayOptions: {
		show: {
			resource: ['message'],
			operation: ['sendFlow'],
		},
	},
	description: withKapsoDoc(
		'Choose which Flow lifecycle stage to search and send. Set Draft before picking a draft Flow from Kapso Dashboard > WhatsApp > Flows',
		KAPSO_DOCS.sendFlow,
		'Send Flow',
	),
};
