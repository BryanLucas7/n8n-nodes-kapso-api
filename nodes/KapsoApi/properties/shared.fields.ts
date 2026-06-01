import { INodeProperties } from 'n8n-workflow';
import {
	messageSendOperations,
	operationOptionsByResource,
	resourcesWithPagination,
	CUSTOM_API_CALL,
} from '../actions/operations';
import { filterStringField, uuidStringField } from './fieldConstraints';

function operationKeysToOperations(keys: string[]): string[] {
	return [...new Set(keys.map((key) => key.split(':')[1]))];
}

const paginatedOperations = operationKeysToOperations(resourcesWithPagination);

const phoneNumberIdOperations = [
	...messageSendOperations,
	'markRead',
	'list',
	'get',
	'uploadBinary',
	'getUrl',
	'delete',
	'block',
	'unblock',
];

const messageOperationsWithoutAdvancedOptions = [
	'sendContact',
	'sendReaction',
	'markRead',
	'requestLocation',
	'sendCallPermission',
] as const;

const phoneNumberIdShowRules: Array<NonNullable<INodeProperties['displayOptions']>> = [
	{
		show: {
			resource: ['message', 'media', 'blockUser'],
			operation: phoneNumberIdOperations,
		},
	},
	{
		show: {
			resource: ['platformMessage'],
			operation: ['list'],
		},
	},
	{
		show: {
			resource: [CUSTOM_API_CALL],
			operation: [CUSTOM_API_CALL],
			customApiSurface: ['whatsapp'],
		},
	},
];

export const phoneNumberIdFields: INodeProperties[] = phoneNumberIdShowRules.map((displayOptions) => ({
	displayName: 'Phone Number Name or ID',
	name: 'phoneNumberId',
	type: 'options',
	default: '',
	typeOptions: {
		loadOptionsMethod: 'getPhoneNumbers',
	},
	displayOptions,
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
}));

export const paginationFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['message', 'platformMessage', 'broadcast', 'contact', 'conversation'],
				operation: paginatedOperations,
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['broadcast'],
				operation: paginatedOperations,
				returnAll: [false],
			},
		},
		description: 'Page number for broadcast list and list recipients (offset pagination)',
	},
	{
		displayName: 'Per Page',
		name: 'perPage',
		type: 'number',
		default: 20,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['message', 'platformMessage', 'broadcast', 'contact', 'conversation'],
				operation: paginatedOperations,
				returnAll: [false],
			},
		},
		description:
			'Results per request. Maps to Kapso `limit` for cursor-paginated lists (max 100) or `per_page` for broadcast lists.',
	},
];

export const advancedOptionsField: INodeProperties = {
	displayName: 'Additional Options',
	name: 'advancedOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: {
		show: {
			resource: ['message', CUSTOM_API_CALL],
		},
		hide: {
			resource: ['message'],
			operation: [...messageOperationsWithoutAdvancedOptions],
		},
	},
	options: [
		{
			displayName: 'Advanced Components JSON',
			name: 'advancedComponentsJson',
			type: 'json',
			default: '[]',
			description: 'Optional raw Meta template components array for sendTemplate',
		},
		{
			displayName: 'After Cursor',
			name: 'messageListAfter',
			type: 'string',
			default: '',
			description: 'Cursor for the next page when listing messages (paging.cursors.after)',
		},
		{
			displayName: 'Before Cursor',
			name: 'messageListBefore',
			type: 'string',
			default: '',
			description: 'Cursor for the previous page when listing messages (paging.cursors.before)',
		},
		uuidStringField('messageListConversationId', 'Conversation ID', {
			description: 'Filter messages by Kapso conversation UUID when listing messages',
		}),
		filterStringField('messageResponseFields', 'Custom Response Fields', 'Optional Meta fields query override for list/get. Replaces the default Kapso extensions field set.'),
		{
			displayName: 'Direction',
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
			displayName: 'Link Preview',
			name: 'linkPreview',
			type: 'boolean',
			default: false,
			description: 'Whether to enable URL link preview when sending text messages',
		},
		{
			displayName: 'Query Parameters',
			name: 'customQueryParameters',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
				sortable: true,
			},
			default: {},
			description: 'Optional query string parameters for custom API requests',
			options: [
				{
					displayName: 'Parameter',
					name: 'parameterValues',
					values: [
						{
							displayName: 'Name',
							name: 'name',
							type: 'string',
							default: '',
							required: true,
							placeholder: 'page',
						},
						{
							displayName: 'Value',
							name: 'value',
							type: 'string',
							default: '',
							required: true,
							placeholder: '1',
						},
					],
				},
			],
		},
		{
			displayName: 'Reply To Message ID',
			name: 'replyToMessageId',
			type: 'string',
			default: '',
			description: 'WhatsApp message ID to reply to',
		},
		{
			displayName: 'Since',
			name: 'messageListSince',
			type: 'dateTime',
			default: '',
			description: 'Include listed messages created on or after this time (ISO 8601)',
		},
		{
			displayName: 'Status',
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
			displayName: 'Until',
			name: 'messageListUntil',
			type: 'dateTime',
			default: '',
			description: 'Include listed messages created on or before this time (ISO 8601)',
		},
	],
};

export function operationProperties(): INodeProperties[] {
	// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
	return Object.entries(operationOptionsByResource).map(([resource, options]) => ({
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [resource],
			},
		},
		options,
		default: options[0].value,
	}));
}
