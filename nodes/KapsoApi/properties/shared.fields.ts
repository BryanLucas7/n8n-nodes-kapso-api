import { INodeProperties } from 'n8n-workflow';
import {
	messageMediaOperations,
	messageSendOperations,
	operationOptionsByResource,
	resourceOptions,
	resourcesWithPagination,
} from '../actions/operations';

const allResourceValues = resourceOptions.map((option) => option.value as string);

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
	'block',
	'unblock',
];

const messageReplyOperations = [
	'sendText',
	...messageMediaOperations,
	'sendButtons',
	'sendList',
];

const queryJsonOperations = [
	...paginatedOperations,
	'get',
	'list',
	'markRead',
	'getUrl',
	'erase',
	'cancel',
	'send',
];

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
				resource: allResourceValues,
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
				resource: allResourceValues,
				operation: paginatedOperations,
				returnAll: [false],
			},
		},
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
				resource: allResourceValues,
				operation: paginatedOperations,
			},
		},
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
			resource: allResourceValues,
		},
	},
	options: [
		{
			displayName: 'Options',
			name: 'options',
			values: [
				{
					displayName: 'Additional Query Parameters',
					name: 'queryJson',
					type: 'json',
					default: '{}',
					displayOptions: {
						show: {
							'/operation': queryJsonOperations,
						},
					},
					description:
						'Optional query parameters as JSON for documented filters such as fields, status, page, and per_page',
				},
				{
					displayName: 'Reply To Message ID',
					name: 'replyToMessageId',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							resource: ['message'],
							'/operation': messageReplyOperations,
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
							resource: ['message'],
							'/operation': ['sendText'],
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
							resource: ['message'],
							'/operation': ['sendRaw'],
						},
					},
					description: 'Full Meta-compatible message JSON body',
				},
				{
					displayName: 'Advanced Components JSON',
					name: 'advancedComponentsJson',
					type: 'json',
					default: '[]',
					displayOptions: {
						show: {
							resource: ['message'],
							'/operation': ['sendTemplate'],
						},
					},
					description: 'Optional raw Meta template components array for expert use',
				},
			],
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
