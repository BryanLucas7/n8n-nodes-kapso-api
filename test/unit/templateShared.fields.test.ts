import { describe, expect, it } from 'vitest';
import {
	TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY,
	templateButtonParameterCollectionOptions,
	templateButtonParametersField,
} from '../../nodes/KapsoApi/properties/templateShared.fields';

function findOption(displayName: string) {
	return templateButtonParameterCollectionOptions?.find((option) => option?.displayName === displayName);
}

describe('templateShared.fields', () => {
	it('uses explicit add labels for MPM nested collections', () => {
		const mpmOption = findOption('MPM');
		const mpmSections = mpmOption?.values?.find((field) => field.name === 'mpmSectionValues');
		const products = mpmSections?.options?.[0]?.values?.find((field) => field.name === 'productValues');

		expect(mpmSections?.placeholder).toBe('Add Section');
		expect(mpmSections?.typeOptions?.multipleValueButtonText).toBe('Add Section');
		expect(products?.placeholder).toBe('Add Product');
		expect(products?.typeOptions?.multipleValueButtonText).toBe('Add Product');
	});

	it('uses short button type labels in the parameter picker', () => {
		const labels = templateButtonParameterCollectionOptions?.map((option) => option?.displayName);

		expect(labels).toEqual([
			'URL',
			'Quick Reply (Text)',
			'Quick Reply (Payload)',
			'Flow',
			'Copy Code',
			'Catalog',
			'MPM',
		]);
	});

	it('documents button parameter collection intent', () => {
		const field = templateButtonParametersField('templateButtonParameters');

		expect(field.placeholder).toBe('Add Button Parameter');
		expect(field.typeOptions?.sortable).toBe(true);
		expect(field.description).toContain('Index auto-fills');
	});

	it('uses resource locators for template button dynamic values', () => {
		const urlOption = findOption('URL');
		const quickReply = findOption('Quick Reply (Text)');
		const copyCode = findOption('Copy Code');
		const flowOption = findOption('Flow');

		expect(urlOption?.values?.find((field) => field.name === 'buttonText')?.type).toBe(
			'resourceLocator',
		);
		expect(quickReply?.values?.find((field) => field.name === 'buttonText')?.type).toBe(
			'resourceLocator',
		);
		expect(copyCode?.values?.find((field) => field.name === 'buttonText')?.type).toBe(
			'resourceLocator',
		);
		expect(flowOption?.values?.find((field) => field.name === 'flowActionData')?.type).toBe(
			'fixedCollection',
		);
		const flowActionKey = flowOption?.values
			?.find((field) => field.name === 'flowActionData')
			?.options?.[0]?.values?.find((field) => field.name === 'key');
		expect(flowActionKey?.type).toBe('resourceLocator');
	});
});
