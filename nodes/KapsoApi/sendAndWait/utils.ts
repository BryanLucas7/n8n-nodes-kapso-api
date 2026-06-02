import type { IExecuteFunctions, INodeProperties, IWebhookFunctions } from 'n8n-workflow';
import { SEND_AND_WAIT_OPERATION, updateDisplayOptions } from 'n8n-workflow';

import { limitWaitTimeOption } from './descriptions';
import { getReplyToMessageId } from '../actions/nodeHelpers';
import { KAPSO_DOCS, withKapsoDoc } from '../properties/expressionHints';
export type SendAndWaitConfig = {
	message: string;
	options: Array<{ label: string; url: string }>;
	appendAttribution?: boolean;
	replyToMessageId?: string;
};

const ACTION_RECORDED_PAGE =
	'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Response recorded</title></head><body><p>Thanks — your response was recorded. You can close this page.</p></body></html>';

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function isMicrosoftPreviewService(userAgent?: string): boolean {
	if (!userAgent) {
		return true;
	}

	const normalized = userAgent.toLowerCase();
	return ['teams', 'skype', 'preview'].some((token) => normalized.includes(token));
}

function isLikelyBot(userAgent?: string): boolean {
	if (!userAgent) {
		return false;
	}

	const normalized = userAgent.toLowerCase();
	return ['bot', 'crawl', 'spider', 'preview', 'facebookexternalhit'].some((token) =>
		normalized.includes(token),
	);
}

export function getSendAndWaitConfig(context: IExecuteFunctions): SendAndWaitConfig {
	const message = escapeHtml(String(context.getNodeParameter('message', 0, '')).trim())
		.replace(/\\n/g, '\n')
		.replace(/<br>/g, '\n');
	const approvalOptions = context.getNodeParameter('approvalOptions.values', 0, {}) as {
		approvalType?: 'single' | 'double';
		approveLabel?: string;
		disapproveLabel?: string;
	};
	const options = context.getNodeParameter('options', 0, {}) as { appendAttribution?: boolean };

	const config: SendAndWaitConfig = {
		message,
		options: [],
		appendAttribution: options.appendAttribution === true,
		replyToMessageId: getReplyToMessageId(context, 0),
	};

	const approvedSignedResumeUrl = context.getSignedResumeUrl({ approved: 'true' });

	if (approvalOptions.approvalType === 'double') {
		const disapprovedSignedResumeUrl = context.getSignedResumeUrl({ approved: 'false' });
		config.options.push({
			label: escapeHtml(approvalOptions.disapproveLabel || '✗ Decline'),
			url: disapprovedSignedResumeUrl,
		});
		config.options.push({
			label: escapeHtml(approvalOptions.approveLabel || '✓ Approve'),
			url: approvedSignedResumeUrl,
		});
	} else {
		config.options.push({
			label: escapeHtml(approvalOptions.approveLabel || '✓ Approve'),
			url: approvedSignedResumeUrl,
		});
	}

	return config;
}

export function getSendAndWaitApprovalType(context: IExecuteFunctions): 'single' | 'double' {
	const approvalOptions = context.getNodeParameter('approvalOptions.values', 0, {}) as {
		approvalType?: 'single' | 'double';
	};
	return approvalOptions.approvalType === 'double' ? 'double' : 'single';
}

export async function sendAndWaitWebhook(this: IWebhookFunctions) {
	const req = this.getRequestObject();

	if (isLikelyBot(req.headers['user-agent']) || isMicrosoftPreviewService(req.headers['user-agent'])) {
		return { noWebhookResponse: true };
	}

	const query = req.query as { approved?: string };
	const approved = query.approved !== 'false';

	return {
		webhookResponse: ACTION_RECORDED_PAGE,
		workflowData: [[{ json: { data: { approved } } }]],
	};
}

export function getSendAndWaitProperties(): INodeProperties[] {
	const sendAndWait: INodeProperties[] = [
		{
			displayName: withKapsoDoc(
				'Sends a WhatsApp text message through Kapso, then pauses until the recipient opens an approval link. Your n8n webhook URL must be reachable by the recipient. Text Links support approve/decline; CTA URL Button supports one approve action inside the 24-hour session window',
				KAPSO_DOCS.sendText,
				'Send Text',
			),
			name: 'sendAndWaitDocsNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Message',
			name: 'message',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				rows: 4,
			},
			description: withKapsoDoc(
				'Plain text sent before the workflow waits for approval',
				KAPSO_DOCS.sendText,
				'Send Text',
			),
		},
		{
			displayName: 'Approval Options',
			name: 'approvalOptions',
			type: 'fixedCollection',
			placeholder: 'Add option',
			default: {},
			description: 'Configure single or double approval and button labels',
			options: [
				{
					displayName: 'Values',
					name: 'values',
					values: [
						{
							displayName: 'Type of Approval',
							name: 'approvalType',
							type: 'options',
							default: 'single',
							description: 'Whether the recipient can only approve or approve and decline',
							options: [
								{ name: 'Approve Only', value: 'single' },
								{ name: 'Approve and Disapprove', value: 'double' },
							],
						},
						{
							displayName: 'Approve Button Label',
							name: 'approveLabel',
							type: 'string',
							default: '✓ Approve',
							description: 'Label shown on the approve link or CTA button',
							displayOptions: {
								show: {
									approvalType: ['single', 'double'],
								},
							},
						},
						{
							displayName: 'Disapprove Button Label',
							name: 'disapproveLabel',
							type: 'string',
							default: '✗ Decline',
							description: 'Label shown on the decline link when double approval is enabled',
							displayOptions: {
								show: {
									approvalType: ['double'],
								},
							},
						},
					],
				},
			],
		},
		{
			displayName: 'Delivery Mode',
			name: 'sendAndWaitDeliveryMode',
			type: 'options',
			default: 'textLinks',
			description: 'How approval links are delivered to the recipient',
			options: [
				{
					name: 'Text Links',
					value: 'textLinks',
					description:
						'Send approval links in the message body. Works anytime, including double approval.',
				},
				{
					name: 'CTA URL Button (Session Only)',
					value: 'ctaButton',
					description:
						'Send one tappable URL button inside the 24-hour customer service window (single approval only).',
				},
			],
		},
		{
			displayName:
				'Double approval requires Text Links delivery because WhatsApp CTA buttons support only one action and n8n resumes the workflow when the recipient opens the signed link.',
			name: 'sendAndWaitDoubleApprovalNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Options',
			name: 'options',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			description: 'Optional wait timeout and n8n attribution settings',
			options: [
				limitWaitTimeOption,
				{
					displayName: 'Append n8n Attribution',
					name: 'appendAttribution',
					type: 'boolean',
					default: false,
					description:
						'Whether to include the phrase "This message was sent automatically with n8n" and a link at the end of the message',
				},
			],
		},
	];

	return updateDisplayOptions(
		{
			show: {
				resource: ['message'],
				operation: [SEND_AND_WAIT_OPERATION],
			},
		},
		sendAndWait,
	);
}

const sendAndWaitWaitingTooltip = (parameters: { operation?: string }) => {
	if (parameters?.operation === SEND_AND_WAIT_OPERATION) {
		return "Execution will continue after the user's response";
	}
	return '';
};

export const SEND_AND_WAIT_WAITING_TOOLTIP = `={{ (${sendAndWaitWaitingTooltip})($parameter) }}`;
