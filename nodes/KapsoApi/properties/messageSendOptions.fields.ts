import { INodeProperties } from 'n8n-workflow';
import { messageReplyOperations } from '../actions/operations';
import { optionalLabel } from './displayNames';
import { KAPSO_DOCS, withKapsoDoc } from './expressionHints';

export const messageSendOptionsField: INodeProperties = {
	displayName: 'Message Send Options',
	name: 'messageSendOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description:
		'Optional outbound message settings. Reply context works on most send operations — not on Send Template (Meta ignores the quote bubble) or Send Reaction (uses React To Message ID instead)',
	displayOptions: {
		show: {
			resource: ['message'],
			operation: [...messageReplyOperations],
		},
	},
	options: [
		{
			displayName: optionalLabel('Reply To Message ID'),
			name: 'replyToMessageId',
			type: 'string',
			default: '',
			description: withKapsoDoc(
				'WAMID of the message to reply to. Use message.id from Kapso Trigger, List Messages, or Get Message',
				KAPSO_DOCS.sendText,
				'Messages',
			),
		},
	],
};
