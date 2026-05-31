import { INodeProperties } from 'n8n-workflow';

export const broadcastListOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'broadcastListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: {
		show: {
			resource: ['broadcast'],
			operation: ['list'],
		},
	},
	options: [
		{
			displayName: 'Created After',
			name: 'broadcastCreatedAfter',
			type: 'dateTime',
			default: '',
		},
		{
			displayName: 'Created Before',
			name: 'broadcastCreatedBefore',
			type: 'dateTime',
			default: '',
		},
		{
			displayName: 'Filter Phone Number ID',
			name: 'broadcastListPhoneNumberId',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Status',
			name: 'broadcastStatusFilter',
			type: 'options',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Draft', value: 'draft' },
				{ name: 'Sending', value: 'sending' },
				{ name: 'Completed', value: 'completed' },
				{ name: 'Failed', value: 'failed' },
			],
			default: '',
		},
	],
};
