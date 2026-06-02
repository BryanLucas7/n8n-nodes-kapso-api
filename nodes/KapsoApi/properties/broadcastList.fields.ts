import { INodeProperties } from 'n8n-workflow';
import { optionalLabel } from './displayNames';

export const broadcastListOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'broadcastListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description: 'Optional filters and pagination when listing broadcasts',
	displayOptions: {
		show: {
			resource: ['broadcast'],
			operation: ['list'],
		},
	},
	options: [
		{
			displayName: optionalLabel('Created After'),
			name: 'broadcastCreatedAfter',
			type: 'dateTime',
			default: '',
			description: 'Include broadcasts created on or after this time (ISO 8601)',
		},
		{
			displayName: optionalLabel('Created Before'),
			name: 'broadcastCreatedBefore',
			type: 'dateTime',
			default: '',
			description: 'Include broadcasts created on or before this time (ISO 8601)',
		},
		{
			displayName: optionalLabel('Filter Phone Number ID'),
			name: 'broadcastListPhoneNumberId',
			type: 'string',
			default: '',
			description: 'Filter by Kapso phone number UUID',
		},
		{
			displayName: optionalLabel('Status'),
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
