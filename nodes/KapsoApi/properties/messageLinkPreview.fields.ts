import { INodeProperties } from 'n8n-workflow';
import { messageLinkPreviewOperations } from '../actions/operations';
import { optionalLabel } from './displayNames';
import { KAPSO_DOCS, withKapsoDoc } from './expressionHints';

/** Top-level field — n8n cannot use displayOptions on collection child parameters. */
export const messageLinkPreviewField: INodeProperties = {
	displayName: optionalLabel('Link Preview'),
	name: 'linkPreview',
	type: 'boolean',
	default: false,
	description: withKapsoDoc(
		'Enable rich link preview cards for URLs in the text body. Meta supports preview_url only on type=text messages — not on media captions',
		KAPSO_DOCS.sendText,
		'Text',
	),
	displayOptions: {
		show: {
			resource: ['message'],
			operation: [...messageLinkPreviewOperations],
		},
	},
};
