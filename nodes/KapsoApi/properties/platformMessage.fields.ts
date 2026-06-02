import { INodeProperties } from 'n8n-workflow';
import { optionalLabel } from './displayNames';

export const platformMessageFields: INodeProperties[] = [
	{
		displayName: 'Message ID',
		name: 'platformMessageId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['platformMessage'],
				operation: ['get'],
			},
		},
		description:
			'WhatsApp message ID (WAMID) from Kapso Trigger, Message List, or Platform Message List',
	},
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
			{
				displayName: optionalLabel('After Cursor'),
				name: 'listAfter',
				type: 'string',
				default: '',
				description: 'Cursor for the next page (from response paging.cursors.after)',
			},
			{
				displayName: optionalLabel('Before Cursor'),
				name: 'listBefore',
				type: 'string',
				default: '',
				description: 'Cursor for the previous page (from response paging.cursors.before)',
			},
			{
				displayName: optionalLabel('Business Scoped User ID'),
				name: 'platformMessageBusinessScopedUserId',
				type: 'string',
				default: '',
				description:
					'Filter by Meta business-scoped user ID (business_scoped_user_id on the Kapso contact record)',
			},
			{
				displayName: optionalLabel('Contact Phone Number'),
				name: 'platformMessagePhoneNumber',
				type: 'string',
				default: '',
				description: 'Partial match on contact phone number',
			},
			{
				displayName: optionalLabel('Conversation ID'),
				name: 'platformMessageConversationId',
				type: 'string',
				default: '',
				description: 'Filter by Kapso conversation UUID',
			},
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
			{
				displayName: optionalLabel('Message Type'),
				name: 'platformMessageType',
				type: 'string',
				default: '',
				placeholder: 'text',
				description: 'Filter by WhatsApp message type (for example text, image, template)',
			},
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
