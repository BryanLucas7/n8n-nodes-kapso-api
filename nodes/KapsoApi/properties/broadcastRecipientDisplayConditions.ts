import { INodeProperties } from 'n8n-workflow';

type ShowRules = NonNullable<INodeProperties['displayOptions']>;

function standardShow(headerFormat?: string): ShowRules {
	const show: Record<string, string[]> = {
		broadcastDetectedComponentMode: ['standard'],
	};

	if (headerFormat) {
		show.broadcastDetectedHeaderFormat = [headerFormat];
	}

	return { show };
}

function carouselShow(): ShowRules {
	return {
		show: {
			broadcastDetectedComponentMode: ['carousel'],
		},
	};
}

export function broadcastRecipientBodyMapperShow(): ShowRules {
	return {
		show: {
			broadcastDetectedComponentMode: ['standard'],
			broadcastHasBodyVariables: ['yes'],
		},
	};
}

export function broadcastRecipientButtonMapperShow(): ShowRules {
	return {
		show: {
			broadcastDetectedComponentMode: ['standard'],
			broadcastHasButtonParameters: ['yes'],
		},
	};
}

export function broadcastRecipientHeaderTextShow(): ShowRules {
	return standardShow('text');
}

export function broadcastRecipientHeaderMediaSourceShow(headerFormat: 'image' | 'video' | 'document'): ShowRules {
	return standardShow(headerFormat);
}

export function broadcastRecipientHeaderMediaUrlShow(
	headerFormat: 'image' | 'video' | 'document',
): ShowRules {
	return {
		show: {
			broadcastDetectedComponentMode: ['standard'],
			broadcastDetectedHeaderFormat: [headerFormat],
			recipientHeaderMediaSource: ['link'],
		},
	};
}

export function broadcastRecipientHeaderMediaIdShow(
	headerFormat: 'image' | 'video' | 'document',
): ShowRules {
	return {
		show: {
			broadcastDetectedComponentMode: ['standard'],
			broadcastDetectedHeaderFormat: [headerFormat],
			recipientHeaderMediaSource: ['id'],
		},
	};
}

export function broadcastRecipientLocationFieldShow(): ShowRules {
	return standardShow('location');
}

export function broadcastRecipientCarouselShow(): ShowRules {
	return carouselShow();
}

export function broadcastRecipientCarouselBodyMapperShow(): ShowRules {
	return carouselShow();
}

export function broadcastRecipientMpmButtonsNoticeShow(): ShowRules {
	return {
		show: {
			broadcastDetectedComponentMode: ['standard'],
			broadcastMpmButtonHint: ['yes'],
		},
	};
}

export function broadcastRecipientStructuredButtonParametersShow(): ShowRules {
	return {
		show: {
			broadcastDetectedComponentMode: ['standard'],
			broadcastMpmButtonHint: ['yes'],
		},
	};
}
