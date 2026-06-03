import { INodeProperties } from 'n8n-workflow';
import { filterStringField, uuidStringField } from './fieldConstraints';
import { optionalLabel } from './displayNames';

export const contactListOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'contactListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description: 'Optional filters and pagination when listing contacts',
	displayOptions: {
		show: {
			resource: ['contact'],
			operation: ['list'],
		},
	},
	options: [
		filterStringField('listAfter', 'After Cursor', 'Cursor for the next page (from response paging.cursors.after)'),
		filterStringField('listBefore', 'Before Cursor', 'Cursor for the previous page (from response paging.cursors.before)'),
		filterStringField(
			'contactBusinessScopedUserId',
			'Business Scoped User ID',
			'Filter by Meta business-scoped user ID (business_scoped_user_id on the contact record)',
		),
		{
			displayName: optionalLabel('Created After'),
			name: 'contactCreatedAfter',
			type: 'dateTime',
			default: '',
			description: 'Include contacts created on or after this time (ISO 8601)',
		},
		{
			displayName: optionalLabel('Created Before'),
			name: 'contactCreatedBefore',
			type: 'dateTime',
			default: '',
			description: 'Include contacts created on or before this time (ISO 8601)',
		},
		filterStringField(
			'contactCustomerExternalIdFilter',
			'Customer External ID',
			'Filter by Kapso customer external ID',
		),
		uuidStringField('contactCustomerIdFilter', 'Customer ID', {
			description: 'Filter by Kapso customer UUID',
		}),
		{
			displayName: optionalLabel('Has Customer'),
			name: 'contactHasCustomer',
			type: 'options',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Yes', value: 'true' },
				{ name: 'No', value: 'false' },
			],
			default: '',
		},
		filterStringField('contactProfileNameContains', 'Profile Name Contains', 'Partial match on WhatsApp profile name'),
		filterStringField('contactWaIdContains', 'WhatsApp ID Contains', 'Partial match on WhatsApp ID (wa_id)'),
	],
};

export const conversationListOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'conversationListOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description: 'Optional filters and pagination when listing conversations',
	displayOptions: {
		show: {
			resource: ['conversation'],
			operation: ['list'],
		},
	},
	options: [
		filterStringField('listAfter', 'After Cursor', 'Cursor for the next page (from response paging.cursors.after)'),
		uuidStringField('conversationAssignedUserId', 'Assigned User ID', {
			description: 'Filter by Kapso user UUID assigned to the conversation',
		}),
		filterStringField('listBefore', 'Before Cursor', 'Cursor for the previous page (from response paging.cursors.before)'),
		{
			displayName: optionalLabel('Created After'),
			name: 'conversationCreatedAfter',
			type: 'dateTime',
			default: '',
			description: 'Include conversations created on or after this time (ISO 8601)',
		},
		{
			displayName: optionalLabel('Created Before'),
			name: 'conversationCreatedBefore',
			type: 'dateTime',
			default: '',
			description: 'Include conversations created on or before this time (ISO 8601)',
		},
		filterStringField(
			'conversationPhoneNumber',
			'Filter Phone Number',
			'Partial match on contact phone number',
		),
		uuidStringField('conversationPhoneNumberId', 'Filter Phone Number ID', {
			description: 'Filter by Kapso phone number UUID',
		}),
		{
			displayName: optionalLabel('Last Active After'),
			name: 'conversationLastActiveAfter',
			type: 'dateTime',
			default: '',
			description: 'Include conversations last active on or after this time (ISO 8601)',
		},
		{
			displayName: optionalLabel('Last Active Before'),
			name: 'conversationLastActiveBefore',
			type: 'dateTime',
			default: '',
			description: 'Include conversations last active on or before this time (ISO 8601)',
		},
		{
			displayName: optionalLabel('Status'),
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
			displayName: optionalLabel('Unassigned Only'),
			name: 'conversationUnassigned',
			type: 'boolean',
			default: false,
			description: 'Whether to return only conversations with no assigned user',
		},
	],
};
