import { INodeProperties } from 'n8n-workflow';
import { resourceOptions } from '../actions/operations';
import {
	messageInteractiveContentFields,
	messagePrimaryFields,
	messageTemplateAndAdminFields,
} from './message.fields';
import { messageBodyFields } from './messageBody.fields';
import {
	messageInteractiveActionFields,
	messageInteractiveHeaderFields,
	messageMediaAndLocationFields,
} from './messageExtended.fields';
import { messageInteractiveFooterFields } from './messageInteractiveFooter.fields';
import { messageSendOptionsField } from './messageSendOptions.fields';
import { messageLinkPreviewField } from './messageLinkPreview.fields';
import { messageListOptionsField } from './messageListOptions.fields';
import { messageMetaLimitPreflightField } from './messageMetaLimitPreflight.fields';
import { templateAdvancedOptionsField } from './templateAdvancedOptions.fields';
import { customApiOptionsField } from './customApiOptions.fields';
import {
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
		description:
			'Kapso API area to work in. Message covers customer sends and templates; Platform Message is cross-conversation inbox history; Broadcast manages template campaigns.',
	},
	...operationProperties(),
	...phoneNumberIdFields,
	messageMetaLimitPreflightField,
	// Message: recipient → headers/setup → body → action content → footer → optional send options
	...messagePrimaryFields,
	...messageInteractiveHeaderFields,
	...messageMediaAndLocationFields,
	...messageBodyFields,
	...messageInteractiveContentFields,
	...messageInteractiveActionFields,
	...messageInteractiveFooterFields,
	...messageTemplateAndAdminFields,
	...resourceFields,
	...platformMessageFields,
	...paginationFields,
	messageLinkPreviewField,
	messageSendOptionsField,
	messageListOptionsField,
	templateAdvancedOptionsField,
	contactListOptionsField,
	conversationListOptionsField,
	broadcastListOptionsField,
	customApiOptionsField,
];
