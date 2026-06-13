import { INodeProperties } from 'n8n-workflow';
import { messageReplyOperations } from '../actions/operations';
import { KAPSO_DOCS, withKapsoDoc } from './expressionHints';
import {
	BIZ_OPAQUE_CALLBACK_DATA_MAX,
	limitedTextResourceLocatorField,
	wamidExpressionStringField,
} from './fieldConstraints';

export const messageSendOptionsField: INodeProperties = {
	displayName: 'Message Send Options',
	name: 'messageSendOptions',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	description: 'Optional outbound message settings. Reply context works on most send operations — not on Send Template (Meta ignores the quote bubble) or Send Reaction (uses React To Message ID instead).',
	displayOptions: {
		show: {
			resource: ['message'],
			operation: [...messageReplyOperations],
		},
	},
	options: [
		wamidExpressionStringField('replyToMessageId', 'Reply To Message ID', undefined, {
			optional: true,
			description: withKapsoDoc(
				'WAMID of the message to reply to. Use message.id from Kapso Trigger, List Messages, or Get Message',
				KAPSO_DOCS.sendText,
				'Messages',
			),
		}),
		limitedTextResourceLocatorField(
			'bizOpaqueCallbackData',
			'Callback Data',
			BIZ_OPAQUE_CALLBACK_DATA_MAX,
			{
				optional: true,
				description: withKapsoDoc(
					`Opaque metadata Meta returns in message status webhooks (biz_opaque_callback_data, max ${BIZ_OPAQUE_CALLBACK_DATA_MAX} characters). Use it for your own correlation IDs; it is not shown to recipients`,
					KAPSO_DOCS.sendText,
					'Messages',
				),
			},
		),
	],
};
