import { INodeProperties } from 'n8n-workflow';
import {
	CUSTOM_API_CALL,
	messageSendOperations,
	operationOptionsByResource,
	resourcesWithPagination,
} from '../actions/operations';

function operationKeysToOperations(keys: string[]): string[] {
	return [...new Set(keys.map((key) => key.split(':')[1]))];
}

const paginatedOperations = operationKeysToOperations(resourcesWithPagination);

const messagePhoneNumberIdOperations = [
	...messageSendOperations,
	'getCatalog',
	'markRead',
	'list',
	'get',
];

const phoneNumberIdOperations = [
	...messagePhoneNumberIdOperations,
	'uploadBinary',
	'getUrl',
	'delete',
	'block',
	'unblock',
	'create',
];

const phoneNumberIdShowRules: Array<NonNullable<INodeProperties['displayOptions']>> = [
	{
		show: {
			resource: ['message', 'media', 'blockUser', 'broadcast'],
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
		'Connected Kapso WhatsApp number for this operation. Loaded from your Kapso project and used for sends, templates, flows, catalogs, and media. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
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
