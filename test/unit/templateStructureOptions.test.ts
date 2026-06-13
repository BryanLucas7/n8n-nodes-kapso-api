import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTemplateSummary } from '../../nodes/KapsoApi/loadOptions/templateStructureOptions';
import { fetchSelectedTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateFetch';
import {
	carouselPromoDefinition,
	imageHeaderDefinition,
	namedOrderUpdateDefinition,
} from '../fixtures/metaTemplates';
import { createLoadOptionsContext } from '../fixtures/loadOptionsContext';

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', () => ({
	fetchSelectedTemplateDefinition: vi.fn(),
	resolveSelectedTemplateIdentity: vi.fn(async () => ({
		name: 'order_update',
		language: 'en_US',
	})),
}));

describe('getTemplateSummary', () => {
	beforeEach(() => {
		vi.mocked(fetchSelectedTemplateDefinition).mockReset();
	});

	it('summarizes a standard template with image header', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(imageHeaderDefinition);

		const [option] = await getTemplateSummary.call(createLoadOptionsContext());
		expect(option.value).toBe('detected');
		expect(option.name).toContain('layout Standard');
		expect(option.name).toContain('header Image');
	});

	it('summarizes carousel templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		const [option] = await getTemplateSummary.call(createLoadOptionsContext());
		expect(option.name).toContain('layout Carousel');
		expect(option.name).toContain('header None');
	});

	it('lists named body variables in the summary', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(namedOrderUpdateDefinition);

		const [option] = await getTemplateSummary.call(createLoadOptionsContext());
		expect(option.name).toMatch(/body \d+ (named|positional)/);
	});

	it('returns a pending placeholder when no template is selected', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(undefined);

		const [option] = await getTemplateSummary.call(createLoadOptionsContext());
		expect(option.value).toBe('pending');
	});
});
