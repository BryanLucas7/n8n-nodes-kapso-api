import { INodeProperties } from 'n8n-workflow';
import {
	messageSendOperations,
	messageReplyOperations,
	operationOptionsByResource,
	resourcesWithPagination,
	CUSTOM_API_CALL,
} from '../actions/operations';

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

const messageReplyOperationValues = [...messageReplyOperations];

export const phoneNumberIdField: INodeProperties = {
	displayName: 'Phone Number Name or ID',
	name: 'phoneNumberId',
	type: 'options',
	default: '',
	typeOptions: {
		loadOptionsMethod: 'getPhoneNumbers',
	},
	displayOptions: {
		show: {
			resource: ['message', 'media', 'blockUser', 'conversation'],
			operation: [...phoneNumberIdOperations, 'get', 'updateStatus'],
		},
	},
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
};

export const paginationFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['message', 'broadcast'],
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
		description: 'Page number for platform paginated endpoints such as broadcast list recipients',
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
				resource: ['message', 'broadcast'],
				operation: paginatedOperations,
			},
		},
		description:
			'Results per request. For List Messages this maps to the Kapso `limit` query parameter (max 100).',
	},
];

const messageOperationsWithoutAdvancedOptions = ['sendContact', 'sendReaction', 'markRead'] as const;

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
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['sendTemplate'],
				},
			},
			description: 'Optional raw Meta template components array for expert use',
		},
		{
			displayName: 'After Cursor',
			name: 'messageListAfter',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list'],
				},
			},
			description: 'Cursor for the next page (from the previous response paging.cursors.after)',
		},
		{
			displayName: 'Before Cursor',
			name: 'messageListBefore',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list'],
				},
			},
			description: 'Cursor for the previous page (from the previous response paging.cursors.before)',
		},
		{
			displayName: 'Conversation ID',
			name: 'messageListConversationId',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list'],
				},
			},
			description: 'Filter messages by Kapso conversation UUID',
		},
		{
			displayName: 'Custom Response Fields',
			name: 'messageResponseFields',
			type: 'string',
			default: '',
			placeholder: 'kapso(direction,status,processing_status)',
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list', 'get'],
				},
			},
			description:
				'Optional Meta `fields` query override. When set, it replaces the Include Kapso Extensions toggle.',
		},
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
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Include Kapso Extensions',
			name: 'includeKapsoExtensions',
			type: 'boolean',
			default: true,
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list', 'get'],
				},
			},
			description:
				'Whether to request Kapso-specific message fields via `fields=kapso()`. Disable to use only Meta fields, or override with Custom Response Fields.',
		},
		{
			displayName: 'Link Preview',
			name: 'linkPreview',
			type: 'boolean',
			default: false,
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['sendText'],
				},
			},
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
			displayOptions: {
				show: {
					'/resource': [CUSTOM_API_CALL],
					'/operation': [CUSTOM_API_CALL],
				},
			},
			description: 'Optional query string parameters appended to the custom API request',
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
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': messageReplyOperationValues,
				},
			},
		},
		{
			displayName: 'Request Body JSON (Advanced)',
			name: 'bodyJson',
			type: 'json',
			default: '{}',
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['sendRaw'],
				},
			},
			description: 'Full Meta-compatible message JSON body',
		},
		{
			displayName: 'Since',
			name: 'messageListSince',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list'],
				},
			},
			description: 'Include messages created on or after this time (ISO 8601)',
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
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list'],
				},
			},
		},
		{
			displayName: 'Until',
			name: 'messageListUntil',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					'/resource': ['message'],
					'/operation': ['list'],
				},
			},
			description: 'Include messages created on or before this time (ISO 8601)',
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
