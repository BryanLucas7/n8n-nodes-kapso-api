import { INodeProperties } from 'n8n-workflow';
import { filterStringField, uuidStringField } from './fieldConstraints';
import { optionalLabel } from './displayNames';

export const messageListOptionsField: INodeProperties = {
	displayName: 'Message List Options',
	name: 'messageListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description: 'Optional filters, cursors, and response fields when listing or getting messages',
	displayOptions: {
		show: {
			resource: ['message'],
			operation: ['list', 'get'],
		},
	},
	options: [
		filterStringField(
			'messageListAfter',
			'After Cursor',
			'Cursor for the next page when listing messages (paging.cursors.after)',
		),
		filterStringField(
			'messageListBefore',
			'Before Cursor',
			'Cursor for the previous page when listing messages (paging.cursors.before)',
		),
		uuidStringField('messageListConversationId', 'Conversation ID', {
			description: 'Filter messages by Kapso conversation UUID when listing messages',
		}),
		filterStringField(
			'messageResponseFields',
			'Custom Response Fields',
			'Optional Meta fields query override for list/get. Replaces the default Kapso extensions field set.',
		),
		{
			displayName: optionalLabel('Direction'),
			name: 'messageListDirection',
			type: 'options',
			options: [
				{ name: 'All', value: '' },
				{ name: 'Inbound', value: 'inbound' },
				{ name: 'Outbound', value: 'outbound' },
			],
			default: '',
			description: 'Filter listed messages by direction',
		},
		{
			displayName: optionalLabel('Since'),
			name: 'messageListSince',
			type: 'dateTime',
			default: '',
			description: 'Include listed messages created on or after this time (ISO 8601)',
		},
		{
			displayName: optionalLabel('Status'),
			name: 'messageListStatus',
			type: 'options',
			options: [
				{ name: 'All', value: '' },
				{ name: 'Pending', value: 'pending' },
				{ name: 'Sent', value: 'sent' },
				{ name: 'Delivered', value: 'delivered' },
				{ name: 'Read', value: 'read' },
				{ name: 'Failed', value: 'failed' },
			],
			default: '',
			description: 'Filter listed messages by delivery status',
		},
		{
			displayName: optionalLabel('Until'),
			name: 'messageListUntil',
			type: 'dateTime',
			default: '',
			description: 'Include listed messages created on or before this time (ISO 8601)',
		},
	],
};
