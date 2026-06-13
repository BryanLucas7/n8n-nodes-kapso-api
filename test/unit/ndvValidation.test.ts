import { describe, expect, it } from 'vitest';
import { getParameterIssues } from 'n8n-workflow';
import { kapsoNodeProperties } from '../../nodes/KapsoApi/properties';
import {
	LIST_ROW_DESCRIPTION_MAX,
	LIST_ROW_TITLE_MAX,
	LOCATION_TEXT_MAX,
	TEMPLATE_COPY_CODE_MAX,
	TEMPLATE_QUICK_REPLY_TEXT_MAX,
	URL_FIELD_MAX,
	httpUrlRegexValidation,
	limitedTextResourceLocatorField,
	listRowDescriptionField,
	listRowTitleField,
	templateCopyCodeField,
	templateQuickReplyTextField,
	publicUrlStringField,
} from '../../nodes/KapsoApi/properties/fieldConstraints';

function findProperty(name: string, properties = kapsoNodeProperties): unknown {
	for (const property of properties) {
		if (property.name === name) {
			return property;
		}
		if (property.options) {
			for (const option of property.options) {
				if ('values' in option && option.values) {
					const found = findProperty(name, option.values);
					if (found) {
						return found;
					}
				}
			}
		}
	}
	return undefined;
}

describe('NDV max-length issues (resourceLocator in fixedCollection)', () => {
	it('flags Row Title longer than Meta limit inside sendList sections', () => {
		const longTitle = 'Quero saber mais sobre a assinatura! 📱'; // > 24 chars
		expect(longTitle.length).toBeGreaterThan(LIST_ROW_TITLE_MAX);

		const rowTitleProperty = findProperty('rowTitle');
		expect(rowTitleProperty).toBeDefined();
		expect(listRowTitleField().type).toBe('resourceLocator');

		const issues = getParameterIssues(
			rowTitleProperty as never,
			{
				sections: {
					sectionValues: [
						{
							sectionTitle: { mode: 'text', value: 'Menu' },
							rowValues: {
								row: [
									{
										rowId: { mode: 'id', value: 'menu-principal1' },
										rowTitle: { mode: 'text', value: longTitle },
									},
								],
							},
						},
					],
				},
			},
			'sections.sectionValues[0].rowValues.row[0]',
		);

		expect(issues.parameters?.rowTitle?.length).toBeGreaterThan(0);
		expect(issues.parameters?.rowTitle?.[0]).toContain(String(LIST_ROW_TITLE_MAX));
	});

	it('flags Row Description longer than Meta limit when provided', () => {
		const longDescription = 'C'.repeat(LIST_ROW_DESCRIPTION_MAX + 10);
		const rowDescriptionProperty = findProperty('rowDescription');
		expect(listRowDescriptionField().type).toBe('resourceLocator');

		const issues = getParameterIssues(
			rowDescriptionProperty as never,
			{
				sections: {
					sectionValues: [
						{
							sectionTitle: { mode: 'text', value: 'Menu' },
							rowValues: {
								row: [
									{
										rowId: { mode: 'id', value: 'menu-principal1' },
										rowTitle: { mode: 'text', value: 'OK' },
										rowDescription: { mode: 'text', value: longDescription },
									},
								],
							},
						},
					],
				},
			},
			'sections.sectionValues[0].rowValues.row[0]',
		);

		expect(issues.parameters?.rowDescription?.length).toBeGreaterThan(0);
		expect(issues.parameters?.rowDescription?.[0]).toContain(String(LIST_ROW_DESCRIPTION_MAX));
	});

	it('does not flag legacy plain-string rowTitle values (execute still reads them)', () => {
		const rowTitleProperty = findProperty('rowTitle');
		const issues = getParameterIssues(
			rowTitleProperty as never,
			{
				sections: {
					sectionValues: [
						{
							sectionTitle: 'Menu',
							rowValues: {
								row: [{ rowId: 'id', rowTitle: 'Short title' }],
							},
						},
					],
				},
			},
			'sections.sectionValues[0].rowValues.row[0]',
		);

		expect(issues.parameters?.rowTitle).toBeUndefined();
	});

	it('flags Send Template location name longer than Meta limit', () => {
		const longName = 'N'.repeat(LOCATION_TEXT_MAX + 5);
		const property = limitedTextResourceLocatorField(
			'templateHeaderLocationName',
			'Header Location Name',
			LOCATION_TEXT_MAX,
			{ optional: true },
		);

		const issues = getParameterIssues(
			property,
			{
				templateHeaderLocationName: { mode: 'text', value: longName },
			},
			'',
		);

		expect(issues.parameters?.templateHeaderLocationName?.[0]).toContain(String(LOCATION_TEXT_MAX));
	});

	it('flags public media URL longer than Meta limit', () => {
		const longUrl = `https://example.com/${'a'.repeat(URL_FIELD_MAX)}`;
		const property = publicUrlStringField('mediaUrl', 'Public URL', { show: {} });

		const issues = getParameterIssues(
			property,
			{
				mediaUrl: { mode: 'url', value: longUrl },
			},
			'',
		);

		expect(issues.parameters?.mediaUrl?.length).toBeGreaterThan(0);
	});

	it('flags invalid public media URL format', () => {
		const property = publicUrlStringField('mediaUrl', 'Public URL', { show: {} });
		const issues = getParameterIssues(
			property,
			{
				mediaUrl: { mode: 'url', value: 'not-a-url' },
			},
			'',
		);

		expect(issues.parameters?.mediaUrl?.[0]).toBe(httpUrlRegexValidation.properties.errorMessage);
	});

	it('flags template copy code longer than Meta limit inside button parameters', () => {
		const issues = getParameterIssues(
			templateCopyCodeField(),
			{
				templateButtonParameters: {
					buttonParameterValues: [
						{
							templateButtonKind: 'copy_code',
							buttonIndex: 0,
							buttonText: { mode: 'code', value: 'X'.repeat(TEMPLATE_COPY_CODE_MAX + 3) },
						},
					],
				},
			},
			'templateButtonParameters.buttonParameterValues[0]',
		);

		expect(issues.parameters?.buttonText?.[0]).toContain(String(TEMPLATE_COPY_CODE_MAX));
	});

	it('flags template quick reply text longer than Meta limit', () => {
		const issues = getParameterIssues(
			templateQuickReplyTextField(),
			{
				templateButtonParameters: {
					buttonParameterValues: [
						{
							templateButtonKind: 'quick_reply_text',
							buttonIndex: 0,
							buttonText: { mode: 'text', value: 'Y'.repeat(TEMPLATE_QUICK_REPLY_TEXT_MAX + 5) },
						},
					],
				},
			},
			'templateButtonParameters.buttonParameterValues[0]',
		);

		expect(issues.parameters?.buttonText?.[0]).toContain(String(TEMPLATE_QUICK_REPLY_TEXT_MAX));
	});
});
