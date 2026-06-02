import { ApplicationError, IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { kapsoApiRequest } from '../transport/request';
import { parseTemplateDefinition, TemplateDefinition } from './templateDefinition';
import { kapsoLoadOptionsRequest } from './helpers';
import { readNodeParameterString } from './resourceLocatorHelpers';

type TemplateSelectionContext = ILoadOptionsFunctions | IExecuteFunctions;

function readBroadcastId(context: TemplateSelectionContext, itemIndex = 0): string {
	if ('getCurrentNodeParameter' in context) {
		return readNodeParameterString(context, 'broadcastId');
	}

	const raw = context.getNodeParameter('broadcastId', itemIndex);
	if (raw && typeof raw === 'object' && 'value' in raw) {
		return String((raw as { value?: string }).value ?? '').trim();
	}

	return String(raw ?? '').trim();
}

export async function fetchBroadcastEntry(
	context: TemplateSelectionContext,
	broadcastId?: string,
	itemIndex = 0,
): Promise<IDataObject | undefined> {
	const id = broadcastId ?? readBroadcastId(context, itemIndex);
	if (!id) {
		return undefined;
	}

	if ('helpers' in context && 'request' in context.helpers) {
		const response = await kapsoLoadOptionsRequest(context as ILoadOptionsFunctions, {
			api: 'platform',
			method: 'GET',
			path: `/whatsapp/broadcasts/${encodeURIComponent(id)}`,
		});

		return ((response as IDataObject).data as IDataObject | undefined) ?? (response as IDataObject);
	}

	const response = await kapsoApiRequest(
		context as IExecuteFunctions,
		{
			api: 'platform',
			method: 'GET',
			path: `/whatsapp/broadcasts/${encodeURIComponent(id)}`,
		},
		itemIndex,
	);

	return ((response as IDataObject).data as IDataObject | undefined) ?? (response as IDataObject);
}

export function parseBroadcastTemplateDefinition(broadcast: IDataObject | undefined): TemplateDefinition | undefined {
	const template = broadcast?.whatsapp_template;
	if (!template || typeof template !== 'object') {
		return undefined;
	}

	return parseTemplateDefinition(template as IDataObject);
}

export async function fetchBroadcastTemplateDefinition(
	context: TemplateSelectionContext,
	itemIndex = 0,
): Promise<TemplateDefinition | undefined> {
	const broadcast = await fetchBroadcastEntry(context, undefined, itemIndex);
	return parseBroadcastTemplateDefinition(broadcast);
}

export async function loadBroadcastTemplateDefinition(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<TemplateDefinition> {
	const definition = await fetchBroadcastTemplateDefinition(ef, itemIndex);

	if (!definition) {
		throw new ApplicationError(
			'Could not load the broadcast template. Select a broadcast that includes whatsapp_template metadata.',
		);
	}

	return definition;
}

export async function fetchBroadcastTemplateDefinitionForLoadOptions(
	context: ILoadOptionsFunctions,
): Promise<TemplateDefinition | undefined> {
	return fetchBroadcastTemplateDefinition(context);
}

export function broadcastTemplateSummary(definition: TemplateDefinition): string {
	const header =
		definition.componentMode === 'carousel'
			? `carousel · ${definition.carouselCards.length} card(s)`
			: definition.headerFormat === 'none'
				? 'no header'
				: `${definition.headerFormat} header`;
	const bodyCount = definition.bodyVariables.length;
	const buttonCount = definition.buttonSlots.filter((slot) => slot.dynamicKind).length;

	return `${definition.name} (${definition.language}) · ${header} · ${bodyCount} body · ${buttonCount} dynamic button(s)`;
}
