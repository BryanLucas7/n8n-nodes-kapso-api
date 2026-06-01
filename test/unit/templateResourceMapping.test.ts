import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buttonDynamicKindFromFieldId,
	buttonIndexFromFieldId,
	getTemplateBodyParameterFields,
	getTemplateButtonParameterFields,
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

		await expect(getTemplateBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [
				expect.objectContaining({ id: 'first_name', displayName: 'first_name', required: true }),
				expect.objectContaining({ id: 'order_id', displayName: 'order_id', required: true }),
			],
		});
	});

	it('returns an empty mapper notice when the template has no body variables', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(noBodyVariablesDefinition);

		await expect(getTemplateBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice:
				'This template has no body text variables. You can continue without filling body parameters.',
		});
	});

	it('returns an empty mapper notice for carousel templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		await expect(getTemplateBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice:
				'This template has no body text variables. You can continue without filling body parameters.',
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
				expect.objectContaining({ id: 'btn_4_mpm', displayName: 'Button 4 · MPM sections JSON' }),
			]),
		);
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
			emptyFieldsNotice: 'This template has no dynamic button parameters at send time.',
		});
	});

	it('returns an empty mapper notice for carousel templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		await expect(getTemplateButtonParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice: 'This template has no dynamic button parameters at send time.',
		});
	});

	it('returns an empty mapper notice when template definition is unavailable', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(undefined);

		await expect(getTemplateBodyParameterFields.call(createLoadOptionsContext())).resolves.toEqual({
			fields: [],
			emptyFieldsNotice:
				'This template has no body text variables. You can continue without filling body parameters.',
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
