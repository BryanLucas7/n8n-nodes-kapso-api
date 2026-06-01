import { INodeProperties } from 'n8n-workflow';
import { resourceOptions } from '../actions/operations';
import { messageFields } from './message.fields';
import { messageExtendedFields } from './messageExtended.fields';
import {
	advancedOptionsField,
	operationProperties,
	paginationFields,
	phoneNumberIdFields,
} from './shared.fields';
import { resourceFields } from './resource.fields';
import { contactListOptionsField, conversationListOptionsField } from './platformList.fields';
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
	...phoneNumberIdFields,
	...messageFields,
	...messageExtendedFields,
	...resourceFields,
	...platformMessageFields,
	...paginationFields,
	contactListOptionsField,
	conversationListOptionsField,
	broadcastListOptionsField,
	advancedOptionsField,
];
