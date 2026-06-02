import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	BODY_MAPPER_EMPTY_NOTICE,
	BUTTON_MAPPER_EMPTY_NOTICE,
	CAROUSEL_BODY_MAPPER_EMPTY_NOTICE,
	buttonDynamicKindFromFieldId,
	buttonIndexFromFieldId,
	getTemplateBodyParameterFields,
	getTemplateButtonParameterFields,
	getTemplateCarouselBodyParameterFields,
} from '../../nodes/KapsoApi/resourceMapping/templateParameters';
import { fetchSelectedTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateFetch';
import {
	carouselPromoDefinition,
	dynamicButtonsDefinition,
	namedOrderUpdateDefinition,
	noBodyVariablesDefinition,
	quickReplyPayloadButtonDefinition,
	definitionWithButtonSlots,
} from '../fixtures/metaTemplates';
import { TemplateButtonDynamicKind } from '../../nodes/KapsoApi/loadOptions/templateDefinition';
import { createLoadOptionsContext } from '../fixtures/loadOptionsContext';

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', () => ({
	fetchSelectedTemplateDefinition: vi.fn(),
	resolveSelectedTemplateIdentity: vi.fn(async () => ({
		name: 'order_update',
		language: 'en_US',
	})),
}));

describe('template parameter resource mapping helpers', () => {
	it('derives button index and dynamic kind from mapper field ids', () => {
		expect(buttonIndexFromFieldId('btn_2_url_suffix')).toBe(2);
		expect(buttonDynamicKindFromFieldId('btn_2_url_suffix')).toBe('url_suffix');
		expect(buttonDynamicKindFromFieldId('btn_0_mpm')).toBe('mpm');
		expect(buttonDynamicKindFromFieldId('btn_0_unknown')).toBeUndefined();
		expect(buttonIndexFromFieldId('invalid')).toBeUndefined();
		expect(buttonIndexFromFieldId('btn_notanumber_suffix')).toBeUndefined();
	});

	it('returns undefined when parsed button index is not finite', () => {
		const finiteSpy = vi.spyOn(Number, 'isFinite').mockReturnValue(false);

		expect(buttonIndexFromFieldId('btn_0_url_suffix')).toBeUndefined();

		finiteSpy.mockRestore();
	});
});

describe('getTemplateBodyParameterFields', () => {
	beforeEach(() => {
		vi.mocked(fetchSelectedTemplateDefinition).mockReset();
	});

	it('returns body variable fields for standard templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		const result = await getTemplateBodyParameterFields.call(createLoadOptionsContext());

		expect(result.fields).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'first_name__parameter_type', type: 'options' }),
				expect.objectContaining({ id: 'first_name', displayName: 'first_name · Text' }),
				expect.objectContaining({ id: 'order_id__parameter_type', type: 'options' }),
				expect.objectContaining({ id: 'order_id', displayName: 'order_id · Text' }),
			]),
		);
		expect(result.fields).toHaveLength(4);
	});

	it('shows only currency fields when the mapper type is currency', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		const result = await getTemplateBodyParameterFields.call(
			createLoadOptionsContext({
				parameters: {
					templateBodyParametersMapper: {
						value: {
							first_name__parameter_type: 'currency',
							order_id__parameter_type: 'text',
						},
					},
				},
			}),
		);

		const fieldIds = result.fields?.map((field) => field.id) ?? [];

		expect(fieldIds).toEqual(
			expect.arrayContaining([
				'first_name__parameter_type',
				'first_name__currency_code',
				'first_name__currency_amount',
				'first_name__currency_fallback',
				'order_id__parameter_type',
				'order_id',
			]),
		);
		expect(fieldIds).not.toEqual(expect.arrayContaining(['first_name']));
		expect(fieldIds).toHaveLength(6);
	});

	it('returns an empty mapper notice when the template has no body variables', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(noBodyVariablesDefinition);

		await expect(getTemplateBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice: BODY_MAPPER_EMPTY_NOTICE,
		});
	});

	it('returns an empty mapper notice for carousel templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		await expect(getTemplateBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice: BODY_MAPPER_EMPTY_NOTICE,
		});
	});
});

describe('getTemplateCarouselBodyParameterFields', () => {
	beforeEach(() => {
		vi.mocked(fetchSelectedTemplateDefinition).mockReset();
	});

	it('returns prefixed body fields for each carousel card', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		const result = await getTemplateCarouselBodyParameterFields.call(createLoadOptionsContext());

		expect(result.fields).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'card_0_param_1__parameter_type',
					displayName: 'Card 0 · Parameter 1 · Type',
				}),
				expect.objectContaining({
					id: 'card_0_param_1',
					displayName: 'Card 0 · Parameter 1 · Text',
				}),
				expect.objectContaining({
					id: 'card_1_param_1',
					displayName: 'Card 1 · Parameter 1 · Text',
				}),
			]),
		);
		expect(result.fields).toHaveLength(4);
	});

	it('returns an empty mapper notice for standard templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		await expect(getTemplateCarouselBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice: CAROUSEL_BODY_MAPPER_EMPTY_NOTICE,
		});
	});
});

describe('getTemplateButtonParameterFields', () => {
	beforeEach(() => {
		vi.mocked(fetchSelectedTemplateDefinition).mockReset();
	});

	it('returns fixed button slots for dynamic button types', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(dynamicButtonsDefinition);

		const result = await getTemplateButtonParameterFields.call(createLoadOptionsContext());

		expect(result.fields).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'btn_0_url_suffix', displayName: 'Button 0 · URL suffix' }),
				expect.objectContaining({ id: 'btn_1_flow_token', displayName: 'Button 1 · Flow token' }),
			]),
		);
		expect(result.fields?.some((field) => field.id === 'btn_4_mpm')).toBe(false);
	});

	it('includes quick reply mapper fields when defined by the template', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(quickReplyPayloadButtonDefinition);

		const result = await getTemplateButtonParameterFields.call(createLoadOptionsContext());

		expect(result.fields).toEqual([
			expect.objectContaining({ id: 'btn_0_quick_reply_payload' }),
			expect.objectContaining({ id: 'btn_1_quick_reply_text' }),
		]);
	});

	it('returns an empty mapper notice when there are no dynamic buttons', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		await expect(getTemplateButtonParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice: BUTTON_MAPPER_EMPTY_NOTICE,
		});
	});

	it('returns an empty mapper notice for carousel templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		await expect(getTemplateButtonParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice: BUTTON_MAPPER_EMPTY_NOTICE,
		});
	});

	it('returns an empty mapper notice when template definition is unavailable', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(undefined);

		await expect(getTemplateBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice: BODY_MAPPER_EMPTY_NOTICE,
		});
	});

	it('ignores button slots with unsupported dynamic kinds', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(
			definitionWithButtonSlots(noBodyVariablesDefinition, [
				{ index: 0, subType: 'unknown', dynamicKind: 'unsupported' as TemplateButtonDynamicKind },
				{ index: 1, subType: 'url', dynamicKind: 'url_suffix' },
			]),
		);

		const result = await getTemplateButtonParameterFields.call(createLoadOptionsContext());

		expect(result.fields).toEqual([
			expect.objectContaining({ id: 'btn_1_url_suffix' }),
		]);
	});
});
