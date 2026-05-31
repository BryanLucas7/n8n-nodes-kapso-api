import { INodeProperties } from 'n8n-workflow';

export const platformListOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'platformListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: {
		show: {
			resource: ['contact', 'conversation'],
			operation: ['list'],
		},
	},
	options: [
		{
			displayName: 'After Cursor',
			name: 'listAfter',
			type: 'string',
			default: '',
			description: 'Cursor for the next page (from response paging.cursors.after)',
		},
		{
			displayName: 'Assigned User ID',
			name: 'conversationAssignedUserId',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Before Cursor',
			name: 'listBefore',
			type: 'string',
			default: '',
			description: 'Cursor for the previous page (from response paging.cursors.before)',
		},
		{
			displayName: 'Business Scoped User ID',
			name: 'contactBusinessScopedUserId',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Created After',
			name: 'contactCreatedAfter',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Created After',
			name: 'conversationCreatedAfter',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Created Before',
			name: 'contactCreatedBefore',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Created Before',
			name: 'conversationCreatedBefore',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Customer External ID',
			name: 'contactCustomerExternalIdFilter',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Customer ID',
			name: 'contactCustomerIdFilter',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Filter Phone Number',
			name: 'conversationPhoneNumber',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
			description: 'Partial match on contact phone number',
		},
		{
			displayName: 'Filter Phone Number ID',
			name: 'conversationPhoneNumberId',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
		},
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
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Last Active After',
			name: 'conversationLastActiveAfter',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Last Active Before',
			name: 'conversationLastActiveBefore',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Profile Name Contains',
			name: 'contactProfileNameContains',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
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
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Unassigned Only',
			name: 'conversationUnassigned',
			type: 'boolean',
			default: false,
			displayOptions: {
				show: {
					'/resource': ['conversation'],
					'/operation': ['list'],
				},
			},
			description: 'Whether to return only conversations with no assigned user',
		},
		{
			displayName: 'WhatsApp ID Contains',
			name: 'contactWaIdContains',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['contact'],
					'/operation': ['list'],
				},
			},
		},
	],
};
