import { ApplicationError } from 'n8n-workflow';
import { vi } from 'vitest';
import type { TemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateDefinition';

export function buildMockSendTemplateContext(definition: TemplateDefinition) {
	return {
		identity: { name: definition.name, language: definition.language },
		definition,
	};
}

export function createHoistedTemplateFetchMock(
	defaultDefinition?: TemplateDefinition,
) {
	const fetchSelectedTemplateDefinition = vi.fn(async () => defaultDefinition);
	const resolveSelectedTemplateIdentity = vi.fn(async () => ({
		name: defaultDefinition?.name ?? 'order_update',
		language: defaultDefinition?.language ?? 'en_US',
	}));
	const resolveSendTemplateContext = vi.fn(async (_ef: unknown, _itemIndex: number) => {
		const definition = (await fetchSelectedTemplateDefinition()) as TemplateDefinition | undefined;
		if (!definition) {
			throw new ApplicationError('Could not resolve the selected template name and language.');
		}

		return buildMockSendTemplateContext(definition);
	});

	return {
		fetchSelectedTemplateDefinition,
		resolveSelectedTemplateIdentity,
		resolveSendTemplateContext,
	};
}
