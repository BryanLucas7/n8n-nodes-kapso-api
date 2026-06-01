import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getTemplateDetectedComponentMode,
	getTemplateDetectedHeaderFormat,
} from '../../nodes/KapsoApi/loadOptions/templateStructureOptions';
import { fetchSelectedTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateFetch';
import {
	carouselPromoDefinition,
	imageHeaderDefinition,
	namedOrderUpdateDefinition,
} from '../fixtures/metaTemplates';
import { createLoadOptionsContext } from '../fixtures/loadOptionsContext';

vi.mock('../../nodes/KapsoApi/loadOptions/templateFetch', () => ({
	fetchSelectedTemplateDefinition: vi.fn(),
}));

describe('template structure loadOptions', () => {
	beforeEach(() => {
		vi.mocked(fetchSelectedTemplateDefinition).mockReset();
	});

	it('auto-detects header format for standard templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(imageHeaderDefinition);

		await expect(getTemplateDetectedHeaderFormat.call(createLoadOptionsContext())).resolves.toEqual([
			{ name: 'Image', value: 'image' },
		]);
	});

	it('returns none for carousel templates', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(carouselPromoDefinition);

		await expect(getTemplateDetectedHeaderFormat.call(createLoadOptionsContext())).resolves.toEqual([
			{ name: 'None', value: 'none' },
		]);
	});

	it('auto-detects component mode labels', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValueOnce(namedOrderUpdateDefinition);
		await expect(getTemplateDetectedComponentMode.call(createLoadOptionsContext())).resolves.toEqual([
			{ name: 'Standard', value: 'standard' },
		]);

		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValueOnce(carouselPromoDefinition);
		await expect(getTemplateDetectedComponentMode.call(createLoadOptionsContext())).resolves.toEqual([
			{ name: 'Carousel', value: 'carousel' },
		]);
	});

	it('defaults to standard mode when no template definition is available', async () => {
		vi.mocked(fetchSelectedTemplateDefinition).mockResolvedValue(undefined);

		await expect(getTemplateDetectedComponentMode.call(createLoadOptionsContext())).resolves.toEqual([
			{ name: 'Standard', value: 'standard' },
		]);
	});

	it('requires credentials and dependencies before loading structure options', async () => {
		const context = createLoadOptionsContext({
			credentialsError: new Error('Node does not have any credentials set'),
		});

		await expect(getTemplateDetectedHeaderFormat.call(context)).rejects.toThrow(
			'Node does not have any credentials set',
		);
	});

	it('requires a phone number before loading structure options', async () => {
		const context = createLoadOptionsContext({
			parameters: { phoneNumberId: '' },
		});

		await expect(getTemplateDetectedHeaderFormat.call(context)).rejects.toThrow(
			'Select a phone number first to load options.',
		);
	});
});
