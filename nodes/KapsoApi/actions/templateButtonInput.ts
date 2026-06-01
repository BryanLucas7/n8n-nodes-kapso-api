import { TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY } from '../properties/templateShared.fields';
import type { TemplateButtonParameterInput } from './templateComponents';

const TEMPLATE_BUTTON_KIND_DEFAULTS: Record<
	string,
	Pick<TemplateButtonParameterInput, 'buttonSubType' | 'buttonParameterType'>
> = {
	url: { buttonSubType: 'url' },
	quick_reply_text: { buttonSubType: 'quick_reply', buttonParameterType: 'text' },
	quick_reply_payload: { buttonSubType: 'quick_reply', buttonParameterType: 'payload' },
	flow: { buttonSubType: 'flow' },
	copy_code: { buttonSubType: 'copy_code' },
	catalog: { buttonSubType: 'catalog' },
	mpm: { buttonSubType: 'mpm' },
};

export type TemplateButtonParameterCollection = {
	[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]?: TemplateButtonParameterInput[];
};

function hasExplicitButtonIndex(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function normalizeTemplateButtonKind(
	item: TemplateButtonParameterInput,
): Pick<TemplateButtonParameterInput, 'buttonSubType' | 'buttonParameterType'> {
	const kind = item.templateButtonKind;

	if (kind && TEMPLATE_BUTTON_KIND_DEFAULTS[kind]) {
		return TEMPLATE_BUTTON_KIND_DEFAULTS[kind];
	}

	if (item.buttonSubType) {
		return {
			buttonSubType: item.buttonSubType,
			...(item.buttonParameterType ? { buttonParameterType: item.buttonParameterType } : {}),
		};
	}

	return { buttonSubType: 'url' };
}

function normalizeButtonParameterItem(item: TemplateButtonParameterInput): TemplateButtonParameterInput {
	const kindDefaults = normalizeTemplateButtonKind(item);

	return {
		...item,
		...kindDefaults,
	};
}

function resolveUnifiedButtonIndex(
	item: TemplateButtonParameterInput,
	position: number,
): number {
	if (hasExplicitButtonIndex(item.buttonIndex) && item.buttonIndex !== position) {
		return item.buttonIndex;
	}

	return position;
}

export function mergeTemplateButtonParameterGroups(
	collection?: TemplateButtonParameterCollection,
): TemplateButtonParameterInput[] {
	if (!collection) {
		return [];
	}

	const unifiedEntries = collection[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY] ?? [];

	if (unifiedEntries.length === 0) {
		return [];
	}

	const merged = unifiedEntries.map((item, position) => ({
		...normalizeButtonParameterItem(item),
		buttonIndex: resolveUnifiedButtonIndex(item, position),
	}));

	return merged.sort((left, right) => (left.buttonIndex ?? 0) - (right.buttonIndex ?? 0));
}
