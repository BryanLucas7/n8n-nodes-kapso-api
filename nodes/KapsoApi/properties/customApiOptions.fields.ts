import { INodeProperties } from 'n8n-workflow';
import { CUSTOM_API_CALL } from '../actions/operations';
import { optionalLabel } from './displayNames';

export const customApiOptionsField: INodeProperties = {
	displayName: 'Custom API Options',
	name: 'customApiOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description: 'Optional query string parameters for custom Kapso API requests',
	displayOptions: {
		show: {
			resource: [CUSTOM_API_CALL],
			operation: [CUSTOM_API_CALL],
		},
	},
	options: [
		{
			displayName: optionalLabel('Query Parameters'),
			name: 'customQueryParameters',
			type: 'fixedCollection',
			placeholder: 'Add Parameter',
			typeOptions: {
				multipleValues: true,
				sortable: true,
			},
			default: {},
			description: 'Query string parameters appended to the custom API request',
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
							description: 'Query parameter name',
						},
						{
							displayName: 'Value',
							name: 'value',
							type: 'string',
							default: '',
							required: true,
							placeholder: '1',
							description: 'Query parameter value',
						},
					],
				},
			],
		},
	],
};
