import { INodeProperties } from 'n8n-workflow';
import { filterStringField } from './fieldConstraints';

export const contactListOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'contactListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: {
		show: {
			resource: ['contact'],
			operation: ['list'],
		},
	},
	options: [
		filterStringField('listAfter', 'After Cursor', 'Cursor for the next page (from response paging.cursors.after)'),
		filterStringField('listBefore', 'Before Cursor', 'Cursor for the previous page (from response paging.cursors.before)'),
		filterStringField('contactBusinessScopedUserId', 'Business Scoped User ID'),
		{
			displayName: 'Created After',
			name: 'contactCreatedAfter',
			type: 'dateTime',
			default: '',
		},
		{
			displayName: 'Created Before',
			name: 'contactCreatedBefore',
			type: 'dateTime',
			default: '',
		},
		filterStringField('contactCustomerExternalIdFilter', 'Customer External ID'),
		filterStringField('contactCustomerIdFilter', 'Customer ID'),
		{
			displayName: 'Has Customer',
			name: 'contactHasCustomer',
			type: 'options',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Yes', value: 'true' },
				{ name: 'No', value: 'false' },
			],
			default: '',
		},
		filterStringField('contactProfileNameContains', 'Profile Name Contains'),
		filterStringField('contactWaIdContains', 'WhatsApp ID Contains'),
	],
};

export const conversationListOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'conversationListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: {
		show: {
			resource: ['conversation'],
			operation: ['list'],
		},
	},
	options: [
		filterStringField('listAfter', 'After Cursor', 'Cursor for the next page (from response paging.cursors.after)'),
		filterStringField('conversationAssignedUserId', 'Assigned User ID'),
		filterStringField('listBefore', 'Before Cursor', 'Cursor for the previous page (from response paging.cursors.before)'),
		{
			displayName: 'Created After',
			name: 'conversationCreatedAfter',
			type: 'dateTime',
			default: '',
		},
		{
			displayName: 'Created Before',
			name: 'conversationCreatedBefore',
			type: 'dateTime',
			default: '',
		},
		filterStringField('conversationPhoneNumber', 'Filter Phone Number', 'Partial match on contact phone number'),
		filterStringField('conversationPhoneNumberId', 'Filter Phone Number ID'),
		{
			displayName: 'Last Active After',
			name: 'conversationLastActiveAfter',
			type: 'dateTime',
			default: '',
		},
		{
			displayName: 'Last Active Before',
			name: 'conversationLastActiveBefore',
			type: 'dateTime',
			default: '',
		},
		{
			displayName: 'Status',
			name: 'conversationStatusFilter',
			type: 'options',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Active', value: 'active' },
				{ name: 'Ended', value: 'ended' },
			],
			default: '',
		},
		{
			displayName: 'Unassigned Only',
			name: 'conversationUnassigned',
			type: 'boolean',
			default: false,
			description: 'Whether to return only conversations with no assigned user',
		},
	],
};
