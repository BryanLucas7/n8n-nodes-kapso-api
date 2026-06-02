import { describe, expect, it, vi, afterEach } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import {
	assertHeaderValuesForTemplate,
	assertTemplateStructureSelection,
	bodyParametersForCarouselCard,
	loadSendTemplateDefinition,
	readTemplateHeaderValues,
	resolveBodyParametersForTemplate,
	resolveButtonParametersForTemplate,
} from '../../nodes/KapsoApi/actions/templateMapperInput';
import { fetchSelectedTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateFetch';
import * as templateParameters from '../../nodes/KapsoApi/resourceMapping/templateParameters';
import { TemplateButtonDynamicKind } from '../../nodes/KapsoApi/loadOptions/templateDefinition';
import {
	carouselPromoDefinition,
	dynamicButtonsDefinition,
	imageHeaderDefinition,
	locationHeaderDefinition,
	mpmSectionsJson,
	namedOrderUpdateDefinition,
	noBodyVariablesDefinition,
	positionalReminderDefinition,
	quickReplyPayloadButtonDefinition,
	definitionWithButtonSlots,
} from '../fixtures/metaTemplates';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', () => ({
	fetchSelectedTemplateDefinition: vi.fn(),
	resolveSelectedTemplateIdentity: vi.fn(async () => ({
		name: 'order_update',
		language: 'en_US',
	})),
}));

function mapperValue(entries: Record<string, string>) {
	return {
		mappingMode: 'defineBelow',
		value: entries,
	};
}

describe('resolveBodyParametersForTemplate', () => {
	it('maps named body variables from the resource mapper', () => {
		const ef = createMockExecuteFunctions({
			templateBodyParametersMapper: mapperValue({
				first_name: 'Jessica',
				order_id: '12345',
			}),
		});

   expect(resolveBodyParametersForTemplate(ef, 0, namedOrderUpdateDefinition)).toEqual([
    { parameterName: 'first_name', parameterText: 'Jessica', valueType: 'text' },
    { parameterName: 'order_id', parameterText: '12345', valueType: 'text' },
   ]);
	});

	it('maps positional body variables from the resource mapper', () => {
		const ef = createMockExecuteFunctions({
			templateBodyParametersMapper: mapperValue({
				param_1: 'Monday',
				param_2: '10:00 AM',
			}),
		});

   expect(resolveBodyParametersForTemplate(ef, 0, positionalReminderDefinition)).toEqual([
    { parameterName: undefined, parameterText: 'Monday', valueType: 'text' },
    { parameterName: undefined, parameterText: '10:00 AM', valueType: 'text' },
   ]);
	});

	it('returns an empty array when the template has no body variables', () => {
		const ef = createMockExecuteFunctions({
			templateBodyParametersMapper: mapperValue({ ignored: 'value' }),
		});

		expect(resolveBodyParametersForTemplate(ef, 0, noBodyVariablesDefinition)).toEqual([]);
	});

	it('rejects missing required body parameters', () => {
		const ef = createMockExecuteFunctions({
			templateBodyParametersMapper: mapperValue({ first_name: 'Jessica' }),
		});

		expect(() => resolveBodyParametersForTemplate(ef, 0, namedOrderUpdateDefinition)).toThrow(
			'Body parameter "order_id" is required for this template.',
		);
	});

	it('rejects unexpected body parameter keys', () => {
		const ef = createMockExecuteFunctions({
			templateBodyParametersMapper: mapperValue({
				first_name: 'Jessica',
				order_id: '12345',
				extra_field: 'nope',
			}),
		});

		expect(() => resolveBodyParametersForTemplate(ef, 0, namedOrderUpdateDefinition)).toThrow(
			'Unexpected body parameter "extra_field" for the selected template.',
		);
	});
});

describe('bodyParametersForCarouselCard', () => {
	it('maps prefixed text fields for a carousel card', () => {
		const card = carouselPromoDefinition.carouselCards[0];

		expect(
			bodyParametersForCarouselCard(
				{
					card_0_param_1: 'Summer deal',
					card_0_param_1__parameter_type: 'text',
				},
				card,
			),
		).toEqual([
			{
				parameterName: undefined,
				valueType: 'text',
				parameterText: 'Summer deal',
			},
		]);
	});
});

describe('resolveButtonParametersForTemplate', () => {
	it('returns an empty array when the template has no dynamic buttons', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: { mappingMode: 'defineBelow', value: {} },
		});

		expect(resolveButtonParametersForTemplate(ef, 0, namedOrderUpdateDefinition)).toEqual([]);
	});

	it('maps url, flow, copy_code, catalog, and mpm button parameters', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
				btn_1_flow_token: 'flow-token-abc',
				btn_2_copy_code: 'SAVE50',
				btn_3_catalog_thumbnail: 'SKU_THUMB',
				btn_4_mpm: mpmSectionsJson,
			}),
		});

		expect(resolveButtonParametersForTemplate(ef, 0, dynamicButtonsDefinition)).toEqual([
			{
				buttonSubType: 'url',
				buttonIndex: 0,
				buttonText: 'promo-123',
			},
			{
				buttonSubType: 'flow',
				buttonIndex: 1,
				flowToken: 'flow-token-abc',
			},
			{
				buttonSubType: 'copy_code',
				buttonIndex: 2,
				buttonText: 'SAVE50',
			},
			{
				buttonSubType: 'catalog',
				buttonIndex: 3,
				catalogThumbnailProductRetailerId: 'SKU_THUMB',
			},
			{
				buttonSubType: 'mpm',
				buttonIndex: 4,
				mpmSections: [
					{
						sectionTitle: 'Popular',
						productRetailerIds: ['SKU_1', 'SKU_2'],
					},
				],
			},
		]);
	});

	it('maps quick reply text and payload button parameters', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_quick_reply_payload: 'TRACK-123',
				btn_1_quick_reply_text: 'Yes',
			}),
		});

		expect(resolveButtonParametersForTemplate(ef, 0, quickReplyPayloadButtonDefinition)).toEqual([
			{
				buttonSubType: 'quick_reply',
				buttonParameterType: 'payload',
				buttonIndex: 0,
				buttonPayload: 'TRACK-123',
			},
			{
				buttonSubType: 'quick_reply',
				buttonParameterType: 'text',
				buttonIndex: 1,
				buttonText: 'Yes',
			},
		]);
	});

	it('rejects unexpected button parameter field ids', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
				btn_99_url_suffix: 'extra',
			}),
		});

		expect(() => resolveButtonParametersForTemplate(ef, 0, dynamicButtonsDefinition)).toThrow(
			'Unexpected button parameter "btn_99_url_suffix" for the selected template.',
		);
	});

	it('rejects missing required dynamic button values', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
			}),
		});

		expect(() => resolveButtonParametersForTemplate(ef, 0, dynamicButtonsDefinition)).toThrow(
			'Button 1 (flow) is missing required send parameters.',
		);
	});

	it('rejects invalid mpm sections json', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
				btn_1_flow_token: 'flow-token-abc',
				btn_2_copy_code: 'SAVE50',
				btn_3_catalog_thumbnail: '',
				btn_4_mpm: '{"not":"array"}',
			}),
		});

		expect(() => resolveButtonParametersForTemplate(ef, 0, dynamicButtonsDefinition)).toThrow(
			'Button 4 MPM sections JSON must be an array.',
		);
	});

	it('rejects invalid mpm section objects', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
				btn_1_flow_token: 'flow-token-abc',
				btn_2_copy_code: 'SAVE50',
				btn_3_catalog_thumbnail: '',
				btn_4_mpm: '[null]',
			}),
		});

		expect(() => resolveButtonParametersForTemplate(ef, 0, dynamicButtonsDefinition)).toThrow(
			'Button 4 MPM section 0 must be an object.',
		);
	});
});

describe('assertTemplateStructureSelection', () => {
	it('allows carousel templates to skip header format validation', () => {
		expect(() =>
			assertTemplateStructureSelection(carouselPromoDefinition, 'text', 'carousel'),
		).not.toThrow();
	});

	it('rejects component mode mismatches', () => {
		expect(() =>
			assertTemplateStructureSelection(namedOrderUpdateDefinition, 'none', 'carousel'),
		).toThrow(
			'Selected component mode "carousel" does not match the template (standard). Refresh template options.',
		);
	});

	it('rejects header format mismatches for standard templates', () => {
		expect(() =>
			assertTemplateStructureSelection(imageHeaderDefinition, 'text', 'standard'),
		).toThrow(
			'Selected header format "text" does not match the template (image). Refresh template options.',
		);
	});
});

describe('assertHeaderValuesForTemplate', () => {
	it('skips header validation for carousel and none headers', () => {
		expect(() =>
			assertHeaderValuesForTemplate(carouselPromoDefinition, {}),
		).not.toThrow();
		expect(() => assertHeaderValuesForTemplate(noBodyVariablesDefinition, {})).not.toThrow();
	});

	it('requires header text when the approved template header has a variable', () => {
		const definition = {
			...namedOrderUpdateDefinition,
			headerTextHasVariable: true,
		};

		expect(() => assertHeaderValuesForTemplate(definition, {})).toThrow(
			'Header text is required for this template.',
		);
	});

	it('requires location coordinates for location headers', () => {
		expect(() => assertHeaderValuesForTemplate(locationHeaderDefinition, {})).toThrow(
			'Header latitude and longitude are required for this template.',
		);
	});

	it('requires image media by link or id', () => {
		expect(() =>
			assertHeaderValuesForTemplate(imageHeaderDefinition, {
				headerMediaSource: 'link',
			}),
		).toThrow('Header image media is required for this template.');

		expect(() =>
			assertHeaderValuesForTemplate(imageHeaderDefinition, {
				headerMediaSource: 'id',
				headerMediaId: 'media-123',
			}),
		).not.toThrow();
	});
});

describe('resolveButtonParametersForTemplate edge cases', () => {
	const urlOnlyDefinition = definitionWithButtonSlots(noBodyVariablesDefinition, [
		{ index: 0, subType: 'url', dynamicKind: 'url_suffix' },
	]);

	it('parses mpm sections from camelCase productItems and productRetailerId', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_mpm: JSON.stringify([
					{
						sectionTitle: 'Popular',
						productItems: [{ productRetailerId: 'SKU_1' }, null, { product_retailer_id: 'SKU_2' }],
					},
				]),
			}),
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)).toEqual([
			{
				buttonSubType: 'mpm',
				buttonIndex: 0,
				mpmSections: [
					{
						sectionTitle: 'Popular',
						productRetailerIds: ['SKU_1', 'SKU_2'],
					},
				],
			},
		]);
	});

	it('accepts mpm sections provided as a parsed array value', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: {
				mappingMode: 'defineBelow',
				value: {
					btn_0_mpm: [{ title: 'Sale', product_items: [{ product_retailer_id: 'SKU_3' }] }],
				},
			},
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections).toEqual([
			{ sectionTitle: 'Sale', productRetailerIds: ['SKU_3'] },
		]);
	});

	it('accepts mpm sections with camelCase productItems only', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_mpm: JSON.stringify([
					{
						sectionTitle: 'Featured',
						productItems: [{ productRetailerId: 'SKU_CAMEL' }],
					},
					{ sectionTitle: 'Empty section' },
				]),
			}),
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections).toEqual([
			{ sectionTitle: 'Featured', productRetailerIds: ['SKU_CAMEL'] },
			{ sectionTitle: 'Empty section', productRetailerIds: [] },
		]);
	});

	it('reads productRetailerId when product_retailer_id is absent', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_mpm: JSON.stringify([
					{
						title: 'Sale',
						product_items: [{ productRetailerId: 'SKU_ONLY_CAMEL' }],
					},
				]),
			}),
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections).toEqual([
			{ sectionTitle: 'Sale', productRetailerIds: ['SKU_ONLY_CAMEL'] },
		]);
	});

	it('reads productRetailerId when product_retailer_id is null', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: {
				mappingMode: 'defineBelow',
				value: {
					btn_0_mpm: [
						{
							title: 'Sale',
							productItems: [{ product_retailer_id: null, productRetailerId: 'SKU_NULL_SNAKE' }],
						},
					],
				},
			},
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections).toEqual([
			{ sectionTitle: 'Sale', productRetailerIds: ['SKU_NULL_SNAKE'] },
		]);
	});

	it('defaults mpm section titles to an empty string', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_mpm: JSON.stringify([{ product_items: [] }]),
			}),
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections).toEqual([
			{ sectionTitle: '', productRetailerIds: [] },
		]);
	});

	it('ignores mpm product items without retailer ids', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_mpm: JSON.stringify([
					{
						title: 'Sale',
						product_items: [{}, { productRetailerId: 'SKU_CAMEL_ONLY' }],
					},
				]),
			}),
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections).toEqual([
			{ sectionTitle: 'Sale', productRetailerIds: ['SKU_CAMEL_ONLY'] },
		]);
	});

	it('accepts null button mapper values and catalog thumbnails without text', () => {
		const catalogOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 3, subType: 'catalog', dynamicKind: 'catalog_thumbnail' },
		]);
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: {
				mappingMode: 'defineBelow',
				value: {
					btn_3_catalog_thumbnail: null,
				},
			},
		});

		expect(resolveButtonParametersForTemplate(ef, 0, catalogOnly)).toEqual([
			{
				buttonSubType: 'catalog',
				buttonIndex: 3,
				catalogThumbnailProductRetailerId: '',
			},
		]);
	});

	it('allows missing catalog thumbnail values during validation', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
				btn_1_flow_token: 'flow-token-abc',
				btn_2_copy_code: 'SAVE50',
				btn_3_catalog_thumbnail: '   ',
				btn_4_mpm: mpmSectionsJson,
			}),
		});

		expect(() => resolveButtonParametersForTemplate(ef, 0, dynamicButtonsDefinition)).not.toThrow();
	});

	it('uses sectionTitle when title is absent in mpm json', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_mpm: JSON.stringify([{ sectionTitle: 'From sectionTitle', product_items: [] }]),
			}),
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections?.[0]?.sectionTitle).toBe(
			'From sectionTitle',
		);
	});

	it('uses title when sectionTitle is absent in mpm json', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_mpm: JSON.stringify([{ title: 'From title', product_items: [] }]),
			}),
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, mpmOnly)[0].mpmSections?.[0]?.sectionTitle).toBe('From title');
	});

	it('rejects null mpm values after coercing them through json parsing', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: {
				mappingMode: 'defineBelow',
				value: {
					btn_0_mpm: null,
				},
			},
		});
		const mpmOnly = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'mpm', dynamicKind: 'mpm' },
		]);

		expect(() => resolveButtonParametersForTemplate(ef, 0, mpmOnly)).toThrow(
			'Button 0 MPM sections JSON must be an array.',
		);
	});

	it('ignores slots with unknown dynamic kinds when building expected field ids', () => {
		const definition = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'url', dynamicKind: 'url_suffix' },
			{ index: 1, subType: 'quick_reply' },
		]);
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
			}),
		});

		expect(resolveButtonParametersForTemplate(ef, 0, definition)).toEqual([
			{ buttonSubType: 'url', buttonIndex: 0, buttonText: 'promo-123' },
		]);
	});

	it.each([
		['url suffix', 'btn_0_url_suffix', 'url_suffix', '   ', 'Button 0 URL suffix is required for this template.'],
		[
			'quick reply text',
			'btn_0_quick_reply_text',
			'quick_reply_text',
			'',
			'Button 0 quick reply text is required for this template.',
		],
		[
			'quick reply payload',
			'btn_0_quick_reply_payload',
			'quick_reply_payload',
			'',
			'Button 0 quick reply payload is required for this template.',
		],
		['flow token', 'btn_0_flow_token', 'flow', '', 'Button 0 flow token is required for this template.'],
		['coupon code', 'btn_0_copy_code', 'copy_code', '', 'Button 0 coupon code is required for this template.'],
	])('rejects empty %s values', (_label, fieldId, slotKind, value, message) => {
		const definition = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: slotKind, dynamicKind: slotKind as TemplateButtonDynamicKind },
		]);

		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({ [fieldId]: value }),
		});

		expect(() => resolveButtonParametersForTemplate(ef, 0, definition)).toThrow(message);
	});

	it('ignores static button slots without dynamic parameters', () => {
		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
			}),
		});
		const definition = definitionWithButtonSlots(noBodyVariablesDefinition, [
			{ index: 0, subType: 'url', dynamicKind: 'url_suffix' },
			{ index: 1, subType: 'quick_reply' },
		]);

		expect(resolveButtonParametersForTemplate(ef, 0, definition)).toEqual([
			{ buttonSubType: 'url', buttonIndex: 0, buttonText: 'promo-123' },
		]);
	});

	it('skips mapper entries when field id helpers cannot resolve the slot', () => {
		const spy = vi.spyOn(templateParameters, 'buttonIndexFromFieldId').mockReturnValue(undefined);

		const ef = createMockExecuteFunctions({
			templateButtonParametersMapper: mapperValue({
				btn_0_url_suffix: 'promo-123',
			}),
		});

		expect(() => resolveButtonParametersForTemplate(ef, 0, urlOnlyDefinition)).toThrow(
			'Button 0 (url) is missing required send parameters.',
		);

		spy.mockRestore();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
});

describe('resolveBodyParametersForTemplate edge cases', () => {
	it('treats null mapper values as empty strings', () => {
		const ef = createMockExecuteFunctions({
			templateBodyParametersMapper: {
				mappingMode: 'defineBelow',
				value: null,
			},
		});

		expect(() => resolveBodyParametersForTemplate(ef, 0, namedOrderUpdateDefinition)).toThrow(
			'Body parameter "first_name" is required for this template.',
		);
	});

	it('allows an empty body mapper object', () => {
		const ef = createMockExecuteFunctions({
			templateBodyParametersMapper: {
				mappingMode: 'defineBelow',
				value: {},
			},
		});

		expect(() => resolveBodyParametersForTemplate(ef, 0, namedOrderUpdateDefinition)).toThrow(
			'Body parameter "first_name" is required for this template.',
		);
	});
});

describe('assertHeaderValuesForTemplate edge cases', () => {
	it('allows text headers without variables when header text is empty', () => {
		expect(() =>
			assertHeaderValuesForTemplate(namedOrderUpdateDefinition, { headerText: '' }),
		).not.toThrow();
	});

	it('rejects header text when the template header is static', () => {
		expect(() =>
			assertHeaderValuesForTemplate(namedOrderUpdateDefinition, { headerText: 'Extra header' }),
		).toThrow(/static text header/i);
	});

	it('requires header text when the template header has a variable and text is omitted', () => {
		const definition = {
			...namedOrderUpdateDefinition,
			headerTextHasVariable: true,
		};

		expect(() => assertHeaderValuesForTemplate(definition, {})).toThrow(
			'Header text is required for this template.',
		);
		expect(() => assertHeaderValuesForTemplate(definition, { headerText: '   ' })).toThrow(
			'Header text is required for this template.',
		);
	});

	it('requires video header media by id', () => {
		const videoDefinition = { ...imageHeaderDefinition, headerFormat: 'video' as const };

		expect(() =>
			assertHeaderValuesForTemplate(videoDefinition, {
				headerMediaSource: 'id',
				headerMediaId: 'video-media-id',
			}),
		).not.toThrow();

		expect(() =>
			assertHeaderValuesForTemplate(videoDefinition, {
				headerMediaSource: 'id',
			}),
		).toThrow('Header video media is required for this template.');
	});

	it('requires document header media by link', () => {
		const documentDefinition = { ...imageHeaderDefinition, headerFormat: 'document' as const };

		expect(() =>
			assertHeaderValuesForTemplate(documentDefinition, {
				headerMediaSource: 'link',
				headerMediaUrl: 'https://cdn.example.com/doc.pdf',
			}),
		).not.toThrow();
	});

	it('requires both latitude and longitude for location headers', () => {
		expect(() =>
			assertHeaderValuesForTemplate(locationHeaderDefinition, {
				headerLatitude: '-23.5',
			}),
		).toThrow('Header latitude and longitude are required for this template.');

		expect(() =>
			assertHeaderValuesForTemplate(locationHeaderDefinition, {
				headerLongitude: '-46.6',
			}),
		).toThrow('Header latitude and longitude are required for this template.');

		expect(() =>
			assertHeaderValuesForTemplate(locationHeaderDefinition, {
				headerLatitude: '-23.5',
				headerLongitude: '-46.6',
			}),
		).not.toThrow();
	});
});

describe('assertTemplateStructureSelection edge cases', () => {
	it('allows empty detected header and component mode values', () => {
		expect(() => assertTemplateStructureSelection(namedOrderUpdateDefinition, '', '')).not.toThrow();
	});
});

describe('loadSendTemplateDefinition', () => {
	it('reads template header values from node parameters', () => {
		const ef = createMockExecuteFunctions({
			templateHeaderText: 'Hello',
			templateHeaderMediaSource: 'id',
			templateHeaderMediaId: 'media-42',
			templateHeaderLatitude: '-23.5',
			templateHeaderLongitude: '-46.6',
			templateHeaderLocationName: 'Store',
			templateHeaderLocationAddress: 'Main street',
		});

		expect(readTemplateHeaderValues(ef, 0)).toEqual({
			headerText: 'Hello',
			headerMediaSource: 'id',
			headerMediaUrl: '',
			headerMediaId: 'media-42',
			headerDocumentFilename: '',
			headerLatitude: '-23.5',
			headerLongitude: '-46.6',
			headerLocationName: 'Store',
			headerLocationAddress: 'Main street',
		});
	});

	it('throws when the selected template definition cannot be loaded', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(undefined);

		const ef = createMockExecuteFunctions({
			templateName: 'order_update',
			languageCode: 'en_US',
		});

		await expect(loadSendTemplateDefinition(ef, 0)).rejects.toThrow(ApplicationError);
   await expect(loadSendTemplateDefinition(ef, 0)).rejects.toThrow(
    'Could not load the selected template definition. Check phone number and template selection.',
   );
	});
});
