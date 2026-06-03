import { IDataObject } from 'n8n-workflow';
import {
	applyBizOpaqueCallbackData,
	buildCtaUrlMessage,
	buildTextMessage,
} from '../actions/messagePayloads';
import { createUtmCampaignLink, KAPSO_SEND_AND_WAIT_NODE_TYPE } from './attribution';
import type { SendAndWaitConfig } from './utils';

export type SendAndWaitDeliveryMode = 'textLinks' | 'ctaButton';

export function buildKapsoSendAndWaitTextBody(config: SendAndWaitConfig, instanceId: string): string {
	const buttons = config.options.map((option) => `*${option.label}:*\n_${option.url}_\n\n`);

	let attribution = '';
	if (config.appendAttribution === true) {
		const link = createUtmCampaignLink(KAPSO_SEND_AND_WAIT_NODE_TYPE, instanceId);
		attribution = `\n\nThis message was sent automatically with ${link}`;
	}

	return `${config.message}\n\n${buttons.join('')}${attribution}`.trim();
}

export function resolveSendAndWaitDeliveryMode(
	requestedMode: string,
	approvalType: 'single' | 'double',
): SendAndWaitDeliveryMode {
	if (requestedMode === 'ctaButton' && approvalType === 'single') {
		return 'ctaButton';
	}

	return 'textLinks';
}

export function buildSendAndWaitMessagePayload(
	to: string,
	config: SendAndWaitConfig,
	deliveryMode: SendAndWaitDeliveryMode,
	instanceId: string,
): IDataObject {
	if (deliveryMode === 'ctaButton') {
		const option = config.options[0];
		let bodyText = config.message;

		if (config.appendAttribution === true) {
			const link = createUtmCampaignLink(KAPSO_SEND_AND_WAIT_NODE_TYPE, instanceId);
			bodyText = `${config.message}\n\nThis message was sent automatically with ${link}`;
		}

		return applyBizOpaqueCallbackData(
			buildCtaUrlMessage(
				to,
				bodyText,
				option.label,
				option.url,
				'none',
				undefined,
				'link',
				undefined,
				undefined,
				undefined,
				undefined,
				config.replyToMessageId,
			),
			config.bizOpaqueCallbackData,
		);
	}

	return applyBizOpaqueCallbackData(
		buildTextMessage(
			to,
			buildKapsoSendAndWaitTextBody(config, instanceId),
			false,
			config.replyToMessageId,
		),
		config.bizOpaqueCallbackData,
	);
}
