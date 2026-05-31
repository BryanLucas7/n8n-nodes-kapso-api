import { ApplicationError, IDataObject } from 'n8n-workflow';
import { parseJsonObject, parseJsonValue } from '../transport/json';
import { parseCoordinate } from './validation';

export type TemplateBodyParameterInput = {
	parameterName?: string;
	parameterText: string;
};

export type TemplateButtonParameterInput = {
	buttonSubType?: string;
	buttonIndex?: number;
	buttonParameterType?: string;
	buttonText?: string;
	buttonPayload?: string;
	flowToken?: string;
	flowActionDataJson?: string;
	catalogThumbnailProductRetailerId?: string;
	mpmThumbnailProductRetailerId?: string;
	mpmSections?: Array<{
		sectionTitle: string;
		productRetailerIds: string[];
	}>;
};

export type TemplateCarouselCardInput = {
	cardIndex: number;
	headerType?: string;
	headerMediaSource?: string;
	headerMediaUrl?: string;
	headerMediaId?: string;
	bodyParameters?: TemplateBodyParameterInput[];
	buttonParameters?: TemplateButtonParameterInput[];
};

export type TemplateComponentsInput = {
	advancedComponentsJson?: string;
	componentMode?: string;
	headerType?: string;
	headerText?: string;
	headerMediaSource?: string;
	headerMediaUrl?: string;
	headerMediaId?: string;
	headerLatitude?: string;
	headerLongitude?: string;
	headerLocationName?: string;
	headerLocationAddress?: string;
	bodyParameters?: TemplateBodyParameterInput[];
	buttonParameters?: TemplateButtonParameterInput[];
	carouselCards?: TemplateCarouselCardInput[];
};

function buildTemplateMediaParameter(
	mediaType: 'image' | 'video' | 'document',
	source: string,
	value: string,
): IDataObject {
	return {
		type: mediaType,
		[mediaType]: {
			[source === 'id' ? 'id' : 'link']: value,
		},
	};
}

function buildTemplateHeaderParameters(input: {
	headerType?: string;
	headerText?: string;
	headerMediaSource?: string;
	headerMediaUrl?: string;
	headerMediaId?: string;
	headerLatitude?: string;
	headerLongitude?: string;
	headerLocationName?: string;
	headerLocationAddress?: string;
}): IDataObject[] | undefined {
	if (input.headerType === 'text' && input.headerText) {
		return [{ type: 'text', text: input.headerText }];
	}

	if (input.headerType === 'image') {
		const value =
			input.headerMediaSource === 'id' ? input.headerMediaId : input.headerMediaUrl;
		if (value) {
			return [buildTemplateMediaParameter('image', input.headerMediaSource || 'link', value)];
		}
	}

	if (input.headerType === 'video') {
		const value =
			input.headerMediaSource === 'id' ? input.headerMediaId : input.headerMediaUrl;
		if (value) {
			return [buildTemplateMediaParameter('video', input.headerMediaSource || 'link', value)];
		}
	}

	if (input.headerType === 'document') {
		const value =
			input.headerMediaSource === 'id' ? input.headerMediaId : input.headerMediaUrl;
		if (value) {
			return [buildTemplateMediaParameter('document', input.headerMediaSource || 'link', value)];
		}
	}

	if (
		input.headerType === 'location' &&
		input.headerLatitude &&
		input.headerLongitude
	) {
		const location: IDataObject = {
			latitude: parseCoordinate(input.headerLatitude, 'Header latitude'),
			longitude: parseCoordinate(input.headerLongitude, 'Header longitude'),
		};

		if (input.headerLocationName) {
			location.name = input.headerLocationName;
		}

		if (input.headerLocationAddress) {
			location.address = input.headerLocationAddress;
		}

		return [{ type: 'location', location }];
	}

	return undefined;
}

function buildTemplateBodyParameters(
	bodyParameters?: TemplateBodyParameterInput[],
): IDataObject | undefined {
	if (!bodyParameters || bodyParameters.length === 0) {
		return undefined;
	}

	return {
		type: 'body',
		parameters: bodyParameters.map((parameter) => {
			const value: IDataObject = {
				type: 'text',
				text: parameter.parameterText,
			};

			if (parameter.parameterName) {
				value.parameter_name = parameter.parameterName;
			}

			return value;
		}),
	};
}

function buildTemplateButtonParameterValue(button: TemplateButtonParameterInput): IDataObject {
	if (button.buttonSubType === 'catalog') {
		const action: IDataObject = {};

		if (button.catalogThumbnailProductRetailerId) {
			action.thumbnail_product_retailer_id = button.catalogThumbnailProductRetailerId;
		}

		return { type: 'action', action };
	}

	if (button.buttonSubType === 'mpm') {
		const action: IDataObject = {};

		if (button.mpmThumbnailProductRetailerId) {
			action.thumbnail_product_retailer_id = button.mpmThumbnailProductRetailerId;
		}

		if (button.mpmSections && button.mpmSections.length > 0) {
			action.sections = button.mpmSections.map((section) => ({
				title: section.sectionTitle,
				product_items: section.productRetailerIds.map((productRetailerId) => ({
					product_retailer_id: productRetailerId,
				})),
			}));
		}

		return { type: 'action', action };
	}

	if (button.buttonSubType === 'flow') {
		const action: IDataObject = {};

		if (button.flowToken) {
			action.flow_token = button.flowToken;
		}

		const flowData = button.flowActionDataJson?.trim();
		if (flowData && flowData !== '{}') {
			action.flow_action_data = parseJsonObject(flowData, 'Flow Action Data JSON');
		}

		return { type: 'action', action };
	}

	if (button.buttonSubType === 'copy_code') {
		const code = button.buttonText?.trim();

		if (!code) {
			throw new ApplicationError('Copy-code button requires a coupon/OTP code value.');
		}

		return { type: 'coupon_code', coupon_code: code };
	}

	if (button.buttonParameterType === 'payload' && button.buttonPayload) {
		return { type: 'payload', payload: button.buttonPayload };
	}

	return { type: 'text', text: button.buttonText || '' };
}

function extractMpmProductRetailerIds(productValues: unknown): string[] {
	if (!productValues || typeof productValues !== 'object') {
		return [];
	}

	const items = (productValues as { productItems?: Array<{ productRetailerId?: string }> })
		.productItems;

	return (items ?? [])
		.map((item) => item.productRetailerId)
		.filter((value): value is string => Boolean(value));
}

function normalizeTemplateButtonInput(
	button: TemplateButtonParameterInput & {
		mpmSectionValues?: {
			sectionValues?: Array<{
				sectionTitle: string;
				productValues?: { productItems?: Array<{ productRetailerId: string }> };
			}>;
		};
	},
): TemplateButtonParameterInput {
	if (button.buttonSubType !== 'mpm') {
		return button;
	}

	const sectionValues = button.mpmSectionValues?.sectionValues ?? [];

	if (sectionValues.length === 0 && button.mpmSections) {
		return button;
	}

	return {
		...button,
		mpmSections: sectionValues.map((section) => ({
			sectionTitle: section.sectionTitle,
			productRetailerIds: extractMpmProductRetailerIds(section.productValues),
		})),
	};
}

function resolveTemplateButtonSubType(buttonSubType?: string): string {
	if (buttonSubType === 'copy_code') {
		return 'copy_code';
	}

	return buttonSubType || 'url';
}

function buildTemplateButtonComponents(
	buttonParameters?: TemplateButtonParameterInput[],
): IDataObject[] {
	return (buttonParameters ?? []).map((button) => {
		const normalized = normalizeTemplateButtonInput(button);

		return {
			type: 'button',
			sub_type: resolveTemplateButtonSubType(normalized.buttonSubType),
			index: String(normalized.buttonIndex ?? 0),
			parameters: [buildTemplateButtonParameterValue(normalized)],
		};
	});
}

function buildTemplateCardComponents(card: TemplateCarouselCardInput): IDataObject[] {
	const components: IDataObject[] = [];

	const headerParameters = buildTemplateHeaderParameters({
		headerType: card.headerType,
		headerMediaSource: card.headerMediaSource,
		headerMediaUrl: card.headerMediaUrl,
		headerMediaId: card.headerMediaId,
	});

	if (headerParameters) {
		components.push({
			type: 'header',
			parameters: headerParameters,
		});
	}

	const body = buildTemplateBodyParameters(card.bodyParameters);
	if (body) {
		components.push(body);
	}

	components.push(...buildTemplateButtonComponents(card.buttonParameters));

	return components;
}

function parseTemplateComponentsArray(
	json: string,
	label: string,
): IDataObject[] {
	const parsed = parseJsonValue(json, label);

	if (!Array.isArray(parsed)) {
		throw new ApplicationError(`${label} must be a JSON array.`);
	}

	if (parsed.length === 0) {
		throw new ApplicationError(`${label} must be a non-empty JSON array.`);
	}

	return parsed as IDataObject[];
}

export function buildMetaTemplateComponents(
	input: TemplateComponentsInput,
): IDataObject[] | undefined {
	const advancedJson = input.advancedComponentsJson?.trim();
	if (advancedJson) {
		return parseTemplateComponentsArray(advancedJson, 'Advanced Components JSON');
	}

	if (input.componentMode === 'carousel') {
		if (!input.carouselCards || input.carouselCards.length === 0) {
			throw new ApplicationError('Carousel template mode requires at least one carousel card.');
		}

		return [
			{
				type: 'carousel',
				cards: input.carouselCards.map((card) => ({
					card_index: card.cardIndex,
					components: buildTemplateCardComponents(card),
				})),
			},
		];
	}

	const components: IDataObject[] = [];

	const headerParameters = buildTemplateHeaderParameters(input);
	if (headerParameters) {
		components.push({
			type: 'header',
			parameters: headerParameters,
		});
	}

	const body = buildTemplateBodyParameters(input.bodyParameters);
	if (body) {
		components.push(body);
	}

	components.push(...buildTemplateButtonComponents(input.buttonParameters));

	return components.length > 0 ? components : undefined;
}
