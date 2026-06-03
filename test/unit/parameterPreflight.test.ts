import { describe, expect, it } from 'vitest';
import { NodeOperationError } from 'n8n-workflow';
import {
	assertKapsoMetaFieldLimits,
	collectKapsoMetaLimitIssues,
	formatKapsoFieldLimitIssues,
} from '../../nodes/KapsoApi/actions/parameterPreflight';
import {
	BUTTON_TITLE_MAX,
	LIST_BUTTON_TEXT_MAX,
	LIST_ROW_TITLE_MAX,
	LIST_SECTION_TITLE_MAX,
} from '../../nodes/KapsoApi/properties/fieldConstraints';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const longRowTitle = 'A'.repeat(LIST_ROW_TITLE_MAX + 4);
const longSectionTitle = 'B'.repeat(LIST_SECTION_TITLE_MAX + 3);
const longListButtonText = 'C'.repeat(LIST_BUTTON_TEXT_MAX + 5);

describe('parameterPreflight', () => {
	it('returns no issues when sendList fields are within Meta limits', () => {
		const issues = collectKapsoMetaLimitIssues({
			resource: 'message',
			operation: 'sendList',
			bodyText: 'Choose an option',
			listButtonText: 'View options',
			listHeaderType: 'none',
			sections: {
				sectionValues: [
					{
						sectionTitle: 'Delivery',
						rowValues: {
							row: [{ rowId: 'standard', rowTitle: 'Standard', rowDescription: '3-5 days' }],
						},
					},
				],
			},
		});

		expect(issues).toHaveLength(0);
	});

	it('detects over-limit sendList row title, section title, and list button text', () => {
		const issues = collectKapsoMetaLimitIssues({
			resource: 'message',
			operation: 'sendList',
			bodyText: 'Choose an option',
			listButtonText: longListButtonText,
			listHeaderType: 'none',
			sections: {
				sectionValues: [
					{
						sectionTitle: longSectionTitle,
						rowValues: {
							row: [{ rowId: 'plan-premium', rowTitle: longRowTitle, rowDescription: ' ' }],
						},
					},
				],
			},
		});

		expect(issues.length).toBeGreaterThanOrEqual(3);
		expect(issues.some((issue) => issue.label === 'Row Title')).toBe(true);
		expect(issues.some((issue) => issue.label === 'Section Title')).toBe(true);
		expect(issues.some((issue) => issue.label === 'List Button Text')).toBe(true);

		const rowIssue = issues.find((issue) => issue.label === 'Row Title');
		expect(rowIssue?.actual).toBe(longRowTitle.length);
		expect(rowIssue?.max).toBe(LIST_ROW_TITLE_MAX);
	});

	it('formats aggregated error message with multiple issues', () => {
		const issues = collectKapsoMetaLimitIssues({
			resource: 'message',
			operation: 'sendButtons',
			buttonHeaderType: 'none',
			bodyText: 'Pick one',
			buttons: {
				buttonValues: [{ buttonId: 'yes', buttonTitle: 'Y'.repeat(BUTTON_TITLE_MAX + 2) }],
			},
		});

		const message = formatKapsoFieldLimitIssues(issues);
		expect(message).toContain('Meta WhatsApp field limits exceeded');
		expect(message).toContain('Button Title');
	});

	it('throws NodeOperationError before API call when limits are exceeded', () => {
		const ef = createMockExecuteFunctions({
			resource: 'message',
			operation: 'sendList',
			bodyText: 'Choose',
			listButtonText: longListButtonText,
			listHeaderType: 'none',
			sections: {
				sectionValues: [
					{
						sectionTitle: 'OK',
						rowValues: {
							row: [{ rowId: 'x', rowTitle: longRowTitle }],
						},
					},
				],
			},
		});

		expect(() => assertKapsoMetaFieldLimits(ef, 0)).toThrow(NodeOperationError);
	});

	it('does not throw for non-message resources', () => {
		const ef = createMockExecuteFunctions({
			resource: 'contact',
			operation: 'list',
		});

		expect(() => assertKapsoMetaFieldLimits(ef, 0)).not.toThrow();
	});
});
