import { INodeProperties } from 'n8n-workflow';
import { resourceOptions } from '../actions/operations';
import { messageFields } from './message.fields';
import {
	advancedOptionsField,
	operationProperties,
	paginationFields,
	phoneNumberIdField,
} from './shared.fields';
import { resourceFields } from './resource.fields';

export const kapsoNodeProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: resourceOptions,
		default: 'message',
	},
	...operationProperties(),
	phoneNumberIdField,
	...messageFields,
	...resourceFields,
	...paginationFields,
	advancedOptionsField,
];
