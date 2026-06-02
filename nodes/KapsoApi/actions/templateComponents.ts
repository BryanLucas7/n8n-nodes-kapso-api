import { ApplicationError, IDataObject } from 'n8n-workflow';
import { parseJsonValue } from '../transport/json';
import type {
	TemplateBodyVariable,
	TemplateParameterFormat,
} from '../loadOptions/templateDefinition';
import { assertProductListShape, parseCoordinate, validateDocumentFilename, validateFlowToken, validateProductRetailerId } from './validation';

export type TemplateBodyParameterInput = {
	parameterName?: string;
	parameterText?: string;
	valueType?: 'text' | 'currency' | 'date_time';
	currency?: {
		code: string;
		amount_1000: number;
		fallback_value: string;
	};
	dateTime?: {
		fallback_value: string;
		timestamp?: number;
	};
};

export type TemplateButtonParameterInput = {
	templateButtonKind?: string;
	buttonSubType?: string;
	buttonIndex?: number;
	buttonParameterType?: string;
	buttonText?: string;
	buttonPayload?: string;
	flowToken?: string;
	flowActionData?: {
		fieldValues?: Array<{
			key: string;
			value: string;
		}>;
	};
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
	parameterFormat?: TemplateParameterFormat;
	headerType?: string;
	headerText?: string;
	headerVariable?: TemplateBodyVariable;
	headerMediaSource?: string;
	headerMediaUrl?: string;
	headerMediaId?: string;
	headerDocumentFilename?: string;
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
	documentFilename?: string,
): IDataObject {
	const mediaObject: IDataObject = {
		[source === 'id' ? 'id' : 'link']: value,
	};

	if (mediaType === 'document' && documentFilename?.trim()) {
		mediaObject.filename = validateDocumentFilename(documentFilename, 'Header Document Filename');
	}

	return {
		type: mediaType,
		[mediaType]: mediaObject,
	};
}

function buildTemplateHeaderParameters(input: {
	headerType?: string;
	headerText?: string;
	headerVariable?: TemplateBodyVariable;
	parameterFormat?: TemplateParameterFormat;
	headerMediaSource?: string;
	headerMediaUrl?: string;
	headerMediaId?: string;
	headerDocumentFilename?: string;
	headerLatitude?: string;
	headerLongitude?: string;
	headerLocationName?: string;
	headerLocationAddress?: string;
}): IDataObject[] | undefined {
	if (input.headerType === 'text' && input.headerText) {
		const parameter: IDataObject = { type: 'text', text: input.headerText };

		if (input.parameterFormat === 'named' && input.headerVariable?.parameterName) {
			parameter.parameter_name = input.headerVariable.parameterName;
		}

		return [parameter];
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
			return [
				buildTemplateMediaParameter(
					'document',
					input.headerMediaSource || 'link',
					value,
					input.headerDocumentFilename,
				),
			];
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
			if (parameter.valueType === 'currency' && parameter.currency) {
				const value: IDataObject = {
					type: 'currency',
					currency: {
						code: parameter.currency.code,
						fallback_value: parameter.currency.fallback_value,
						amount_1000: parameter.currency.amount_1000,
					},
				};

				if (parameter.parameterName) {
					value.parameter_name = parameter.parameterName;
				}

				return value;
			}

			if (parameter.valueType === 'date_time' && parameter.dateTime) {
				const dateTime: IDataObject = {
					fallback_value: parameter.dateTime.fallback_value,
				};

				if (parameter.dateTime.timestamp !== undefined) {
					dateTime.timestamp = parameter.dateTime.timestamp;
				}

				const value: IDataObject = {
					type: 'date_time',
					date_time: dateTime,
				};

				if (parameter.parameterName) {
					value.parameter_name = parameter.parameterName;
				}

				return value;
			}

			const value: IDataObject = {
				type: 'text',
				text: parameter.parameterText ?? '',
			};

			if (parameter.parameterName) {
				value.parameter_name = parameter.parameterName;
			}

			return value;
		}),
	};
}

function buildFlowActionData(button: TemplateButtonParameterInput): IDataObject | undefined {
	const fields = button.flowActionData?.fieldValues ?? [];

	if (fields.length === 0) {
		return undefined;
	}

	const actionData: IDataObject = {};

	for (const field of fields) {
		if (field.key) {
			actionData[field.key] = field.value ?? '';
		}
	}

	return Object.keys(actionData).length > 0 ? actionData : undefined;
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
			validateMpmTemplateSections(button.mpmSections);
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
			action.flow_token = validateFlowToken(button.flowToken);
		}

		const flowActionData = buildFlowActionData(button);
		if (flowActionData) {
			action.flow_action_data = flowActionData;
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

	if (button.buttonSubType === 'quick_reply') {
		if (button.buttonParameterType === 'payload') {
			const payload = button.buttonPayload?.trim();
			if (!payload) {
				throw new ApplicationError('Quick Reply (Payload) requires a payload value.');
			}
			return { type: 'payload', payload };
		}

		const text = button.buttonText?.trim();
		if (!text) {
			throw new ApplicationError('Quick Reply (Text) requires a text value.');
		}
		return { type: 'text', text };
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
		.map((item) => (item.productRetailerId ? validateProductRetailerId(item.productRetailerId) : ''))
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

	const mpmSections = sectionValues.map((section) => ({
		sectionTitle: section.sectionTitle,
		productRetailerIds: extractMpmProductRetailerIds(section.productValues),
	}));

	validateMpmTemplateSections(mpmSections);

	return {
		...button,
		mpmSections,
	};
}

function validateMpmTemplateSections(sections: Array<{ sectionTitle: string; productRetailerIds: string[] }>): void {
	if (sections.length === 0) {
		return;
	}

	assertProductListShape(sections);
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
): IDataObject[] | undefined {
	const trimmed = json.trim();
	if (!trimmed || trimmed === '[]') {
		return undefined;
	}

	const parsed = parseJsonValue(trimmed, label);

	if (!Array.isArray(parsed)) {
		throw new ApplicationError(`${label} must be a JSON array.`);
	}

	if (parsed.length === 0) {
		return undefined;
	}

	return parsed as IDataObject[];
}

export function buildMetaTemplateComponents(
	input: TemplateComponentsInput,
): IDataObject[] | undefined {
	const advancedJson = input.advancedComponentsJson?.trim();
	if (advancedJson) {
		const parsedAdvanced = parseTemplateComponentsArray(advancedJson, 'Advanced Components JSON');
		if (parsedAdvanced) {
			return parsedAdvanced;
		}
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
