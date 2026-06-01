import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import {
	buildRecipientTemplateComponentsInput,
	buildSendTemplateComponentsInput,
} from '../../nodes/KapsoApi/actions/templateInput';
import { fetchSelectedTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateFetch';
import { TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY } from '../../nodes/KapsoApi/properties/templateShared.fields';
import {
	carouselPromoDefinition,
	dynamicButtonsDefinition,
	imageHeaderDefinition,
	mpmSectionsJson,
	namedOrderUpdateDefinition,
} from '../fixtures/metaTemplates';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', () => ({
	fetchSelectedTemplateDefinition: vi.fn(),
}));

function mapperValue(entries: Record<string, string>) {
	return {
		mappingMode: 'defineBelow',
		value: entries,
	};
}

describe('buildSendTemplateComponentsInput', () => {
	beforeEach(() => {
		vi.mocked(fetchSelectedTemplateDefinition).mockReset();
	});

	it('builds standard template components from inferred structure and mappers', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		const ef = createMockExecuteFunctions({
			templateDetectedHeaderFormat: 'text',
			templateDetectedComponentMode: 'standard',
			templateHeaderText: 'Order shipped',
			templateBodyParametersMapper: mapperValue({
				first_name: 'Jessica',
				order_id: '12345',
			}),
		});

		await expect(buildSendTemplateComponentsInput(ef, 0)).resolves.toMatchObject({
			componentMode: 'standard',
			headerType: 'text',
			headerText: 'Order shipped',
			bodyParameters: [
				{ parameterName: 'first_name', parameterText: 'Jessica' },
				{ parameterName: 'order_id', parameterText: '12345' },
			],
			buttonParameters: [],
			carouselCards: [],
		});
	});

	it('builds dynamic button parameters and image header media values', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(dynamicButtonsDefinition);

		const ef = createMockExecuteFunctions({
			templateDetectedHeaderFormat: 'none',
			templateDetectedComponentMode: 'standard',
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
				btn_1_flow_token: 'flow-token-abc',
				btn_2_copy_code: 'SAVE50',
				btn_3_catalog_thumbnail: 'SKU_THUMB',
				btn_4_mpm: mpmSectionsJson,
			}),
		});

		const input = await buildSendTemplateComponentsInput(ef, 0);

		expect(input.buttonParameters).toHaveLength(5);
		expect(input.headerType).toBe('none');
	});

	it('infers carousel card header types from the approved template definition', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		const ef = createMockExecuteFunctions({
			templateDetectedHeaderFormat: 'none',
			templateDetectedComponentMode: 'carousel',
			templateCarouselCards: {
				cardValues: [
					{
						cardIndex: 0,
						cardHeaderMediaSource: 'link',
						cardHeaderMediaUrl: 'https://cdn.example.com/card-0.jpg',
						cardBodyParameters: {
							parameterValues: [{ parameterText: 'Summer deal' }],
						},
					},
					{
						cardIndex: 1,
						cardHeaderMediaSource: 'id',
						cardHeaderMediaId: 'video-media-id',
						cardBodyParameters: {
							parameterValues: [{ parameterText: 'Video deal' }],
						},
					},
				],
			},
		});

		const input = await buildSendTemplateComponentsInput(ef, 0);

		expect(input.carouselCards).toEqual([
			expect.objectContaining({
				cardIndex: 0,
				headerType: 'image',
				headerMediaUrl: 'https://cdn.example.com/card-0.jpg',
			}),
			expect.objectContaining({
				cardIndex: 1,
				headerType: 'video',
				headerMediaId: 'video-media-id',
			}),
		]);
	});

	it('rejects carousel card count mismatches', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		const ef = createMockExecuteFunctions({
			templateDetectedHeaderFormat: 'none',
			templateDetectedComponentMode: 'carousel',
			templateCarouselCards: {
				cardValues: [{ cardIndex: 0 }],
			},
		});

		await expect(buildSendTemplateComponentsInput(ef, 0)).rejects.toThrow(
			'This template requires 2 carousel card(s), but 1 were provided.',
		);
	});

	it('rejects unknown carousel card indices', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		const ef = createMockExecuteFunctions({
			templateDetectedHeaderFormat: 'none',
			templateDetectedComponentMode: 'carousel',
			templateCarouselCards: {
				cardValues: [
					{ cardIndex: 0 },
					{ cardIndex: 9 },
				],
			},
		});

		await expect(buildSendTemplateComponentsInput(ef, 0)).rejects.toThrow(
			'Carousel card index 9 is not defined in the selected template.',
		);
	});

	it('rejects header format mismatches at execute time', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(imageHeaderDefinition);

		const ef = createMockExecuteFunctions({
			templateDetectedHeaderFormat: 'text',
			templateDetectedComponentMode: 'standard',
		});

		await expect(buildSendTemplateComponentsInput(ef, 0)).rejects.toThrow(ApplicationError);
	});
});

describe('buildRecipientTemplateComponentsInput', () => {
	it('maps broadcast recipient template overrides and carousel cards', () => {
		expect(
			buildRecipientTemplateComponentsInput({
				headerType: 'image',
				headerMediaSource: 'link',
				headerMediaUrl: 'https://cdn.example.com/banner.jpg',
				bodyParameters: {
					bodyParameterValues: [{ parameterName: 'first_name', parameterText: 'John' }],
				},
				buttonParameters: {
					[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]: [
						{ templateButtonKind: 'url', buttonIndex: 0, buttonText: 'promo-code' },
					],
				},
				carouselCards: {
					cardValues: [
						{
							cardIndex: 0,
							cardHeaderType: 'image',
							cardHeaderMediaUrl: 'https://cdn.example.com/card.jpg',
							cardBodyParameters: {
								bodyParameterValues: [{ parameterText: 'Card body' }],
							},
							cardButtonParameters: {
								[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]: [
									{ templateButtonKind: 'url', buttonIndex: 0, buttonText: 'buy-now' },
								],
							},
						},
					],
				},
				recipientComponentsJson: '{"type":"body"}',
			}),
		).toMatchObject({
			advancedComponentsJson: '{"type":"body"}',
			headerType: 'image',
			headerMediaUrl: 'https://cdn.example.com/banner.jpg',
			bodyParameters: [{ parameterName: 'first_name', parameterText: 'John' }],
			buttonParameters: [
				expect.objectContaining({
					buttonSubType: 'url',
					buttonText: 'promo-code',
				}),
			],
			carouselCards: [
				expect.objectContaining({
					cardIndex: 0,
					headerType: 'image',
					bodyParameters: [{ parameterText: 'Card body' }],
				}),
			],
		});
	});

	it('maps carousel card body parameters from bodyParameterValues', () => {
		expect(
			buildRecipientTemplateComponentsInput({
				carouselCards: {
					cardValues: [
						{
							cardIndex: 0,
							cardBodyParameters: {
								bodyParameterValues: [{ parameterText: 'From bodyParameterValues' }],
							},
						},
					],
				},
			}).carouselCards,
		).toEqual([
			expect.objectContaining({
				bodyParameters: [{ parameterText: 'From bodyParameterValues' }],
			}),
		]);
	});

	it('defaults carousel card body parameters to an empty array', () => {
		expect(
			buildRecipientTemplateComponentsInput({
				carouselCards: {
					cardValues: [{ cardIndex: 0 }],
				},
			}).carouselCards?.[0]?.bodyParameters,
		).toEqual([]);
	});
});
