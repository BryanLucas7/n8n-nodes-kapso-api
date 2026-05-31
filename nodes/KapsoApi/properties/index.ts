import { INodeProperties } from 'n8n-workflow';
import { resourceOptions } from '../actions/operations';
import { messageFields } from './message.fields';
import { messageExtendedFields } from './messageExtended.fields';
import {
	advancedOptionsField,
	operationProperties,
	paginationFields,
	phoneNumberIdField,
} from './shared.fields';
import { resourceFields } from './resource.fields';
import { platformListOptionsField } from './platformList.fields';
import { platformMessageFields } from './platformMessage.fields';
import { broadcastListOptionsField } from './broadcastList.fields';

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
	...messageExtendedFields,
	...resourceFields,
	...platformMessageFields,
	...paginationFields,
	platformListOptionsField,
	broadcastListOptionsField,
	advancedOptionsField,
];
