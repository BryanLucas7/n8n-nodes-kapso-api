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

const messageOperationsWithoutAdvancedOptions = [
	'sendContact',
	'sendReaction',
	'markRead',
	'requestLocation',
	'sendCallPermission',
] as const;

const phoneNumberIdDisplayOptions = {
	show: [
		{
			resource: ['message', 'media', 'blockUser'],
			operation: phoneNumberIdOperations,
		},
		{
			resource: ['platformMessage'],
			operation: ['list'],
		},
		{
			resource: [CUSTOM_API_CALL],
			operation: [CUSTOM_API_CALL],
			customApiSurface: ['whatsapp'],
		},
	],
} as unknown as INodeProperties['displayOptions'];

export const phoneNumberIdField: INodeProperties = {
	displayName: 'Phone Number Name or ID',
	name: 'phoneNumberId',
	type: 'options',
	default: '',
	typeOptions: {
		loadOptionsMethod: 'getPhoneNumbers',
	},
	displayOptions: phoneNumberIdDisplayOptions,
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
				'Optional Meta `fields` query override. When set, it replaces the default Kapso extensions field set.',
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
