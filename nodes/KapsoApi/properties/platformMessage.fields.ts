import { INodeProperties } from 'n8n-workflow';
import { optionalLabel } from './displayNames';
import { filterStringField, uuidStringField, wamidStringField } from './fieldConstraints';

export const platformMessageFields: INodeProperties[] = [
	wamidStringField(
		'platformMessageId',
		'Message ID',
		{
			show: {
				resource: ['platformMessage'],
				operation: ['get'],
			},
		},
		{
			description:
				'WhatsApp message ID (WAMID) from Kapso Trigger, Message List, or Platform Message List',
		},
	),
	{
		displayName: 'Additional Options',
		name: 'platformMessageListOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Optional filters and pagination when listing platform messages',
		displayOptions: {
			show: {
				resource: ['platformMessage'],
				operation: ['list'],
			},
		},
		options: [
			filterStringField('listAfter', 'After Cursor', 'Cursor for the next page (from response paging.cursors.after)'),
			filterStringField('listBefore', 'Before Cursor', 'Cursor for the previous page (from response paging.cursors.before)'),
			filterStringField(
				'platformMessageBusinessScopedUserId',
				'Business Scoped User ID',
				'Filter by Meta business-scoped user ID (business_scoped_user_id on the Kapso contact record)',
			),
			filterStringField('platformMessagePhoneNumber', 'Contact Phone Number', 'Partial match on contact phone number'),
			uuidStringField('platformMessageConversationId', 'Conversation ID', {
				description: 'Filter by Kapso conversation UUID',
			}),
			{
				displayName: optionalLabel('Direction'),
				name: 'platformMessageDirection',
				type: 'options',
				options: [
					{ name: 'All', value: '' },
					{ name: 'Inbound', value: 'inbound' },
					{ name: 'Outbound', value: 'outbound' },
				],
				default: '',
			},
			{
				displayName: optionalLabel('Has Media'),
				name: 'platformMessageHasMedia',
				type: 'options',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Yes', value: 'true' },
					{ name: 'No', value: 'false' },
				],
				default: '',
			},
			filterStringField('platformMessageType', 'Message Type', 'Filter by WhatsApp message type (for example text, image, template)'),
			{
				displayName: optionalLabel('Status'),
				name: 'platformMessageStatus',
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
			},
		],
	},
];
