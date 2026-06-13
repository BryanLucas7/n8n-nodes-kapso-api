import {
	IExecuteFunctions,
	INodeParameters,
	NodeOperationError,
} from 'n8n-workflow';
import {
	BUTTON_ID_MAX,
	BUTTON_TITLE_MAX,
	BIZ_OPAQUE_CALLBACK_DATA_MAX,
	CTA_BUTTON_LABEL_MAX,
	FLOW_CTA_MAX,
	FLOW_TOKEN_MAX,
	INTERACTIVE_BODY_MAX,
	INTERACTIVE_FOOTER_MAX,
	INTERACTIVE_HEADER_MAX,
	LIST_BUTTON_TEXT_MAX,
	LIST_ROW_DESCRIPTION_MAX,
	LIST_ROW_ID_MAX,
	LIST_ROW_TITLE_MAX,
	LIST_SECTION_TITLE_MAX,
	MEDIA_CAPTION_MAX,
	metaVisibleTextLength,
	PRODUCT_RETAILER_ID_MAX,
	TEXT_MESSAGE_MAX,
} from '../properties/fieldConstraints';
import { extractListRows } from './listRowHelpers';
import { readStringParameterValue } from './nodeHelpers';

export type KapsoFieldLimitIssue = {
	path: string;
	label: string;
	max: number;
	actual: number;
	preview: string;
};

type ParameterReader = (name: string) => unknown;

const MESSAGE_META_LIMIT_OPERATIONS = new Set([
	'sendText',
	'sendImage',
	'sendVideo',
	'sendDocument',
	'sendButtons',
	'sendList',
	'sendCta',
	'sendProduct',
	'sendProductList',
	'sendCatalog',
	'sendFlow',
	'requestLocation',
	'sendCallPermission',
]);

function readParam(reader: ParameterReader, name: string): string {
	return readStringParameterValue(reader(name));
}

function previewText(value: string, maxPreview = 40): string {
	const trimmed = value.trim();
	if (trimmed.length <= maxPreview) {
		return trimmed;
	}

	return `${trimmed.slice(0, maxPreview)}...`;
}

function checkStringLength(
	value: string,
	max: number,
	label: string,
	path: string,
	options: { skipEmpty?: boolean } = {},
): KapsoFieldLimitIssue | undefined {
	const trimmed = value.trim();
	if (options.skipEmpty !== false && !trimmed) {
		return undefined;
	}

	const actual = metaVisibleTextLength(trimmed);
	if (actual <= max) {
		return undefined;
	}

	return {
		path,
		label,
		max,
		actual,
		preview: previewText(trimmed),
	};
}

function pushIssue(issues: KapsoFieldLimitIssue[], issue: KapsoFieldLimitIssue | undefined): void {
	if (issue) {
		issues.push(issue);
	}
}

function getFixedCollectionItems<T extends Record<string, unknown>>(
	reader: ParameterReader,
	parameterName: string,
	collectionName: string,
): T[] {
	const collection = reader(parameterName);
	if (!collection || typeof collection !== 'object') {
		return [];
	}

	const items = (collection as Record<string, unknown>)[collectionName];
	return Array.isArray(items) ? (items as T[]) : [];
}

function readCollectionOption(
	reader: ParameterReader,
	collectionName: string,
	optionName: string,
): string {
	const collection = reader(collectionName);
	if (!collection || typeof collection !== 'object') {
		return '';
	}

	return readStringParameterValue((collection as Record<string, unknown>)[optionName]);
}

function collectInteractiveBody(
	issues: KapsoFieldLimitIssue[],
	reader: ParameterReader,
	path = 'bodyText',
): void {
	pushIssue(
		issues,
		checkStringLength(readParam(reader, 'bodyText'), INTERACTIVE_BODY_MAX, 'Body Text', path, {
			skipEmpty: false,
		}),
	);
}

function collectInteractiveFooter(issues: KapsoFieldLimitIssue[], reader: ParameterReader): void {
	pushIssue(
		issues,
		checkStringLength(readParam(reader, 'footerText'), INTERACTIVE_FOOTER_MAX, 'Footer Text', 'footerText'),
	);
}

function collectTextHeader(
	issues: KapsoFieldLimitIssue[],
	reader: ParameterReader,
	headerTypeField: string,
	headerTextField: string,
	label: string,
): void {
	if (readParam(reader, headerTypeField) !== 'text') {
		return;
	}

	pushIssue(
		issues,
		checkStringLength(readParam(reader, headerTextField), INTERACTIVE_HEADER_MAX, label, headerTextField, {
			skipEmpty: false,
		}),
	);
}

function collectMediaCaption(issues: KapsoFieldLimitIssue[], reader: ParameterReader): void {
	pushIssue(
		issues,
		checkStringLength(readParam(reader, 'caption'), MEDIA_CAPTION_MAX, 'Caption', 'caption'),
	);
}

function collectSendButtonsIssues(issues: KapsoFieldLimitIssue[], reader: ParameterReader): void {
	collectTextHeader(issues, reader, 'buttonHeaderType', 'headerText', 'Header Text');
	collectInteractiveBody(issues, reader);
	collectInteractiveFooter(issues, reader);

	const buttons = getFixedCollectionItems<{
		buttonId?: string;
		buttonTitle?: string;
	}>(reader, 'buttons', 'buttonValues');

	for (const [index, button] of buttons.entries()) {
		const buttonIndex = index + 1;
		pushIssue(
			issues,
			checkStringLength(
				readStringParameterValue(button.buttonId),
				BUTTON_ID_MAX,
				'Button ID',
				`buttons[${buttonIndex}].buttonId`,
				{ skipEmpty: false },
			),
		);
		pushIssue(
			issues,
			checkStringLength(
				readStringParameterValue(button.buttonTitle),
				BUTTON_TITLE_MAX,
				'Button Title',
				`buttons[${buttonIndex}].buttonTitle`,
				{ skipEmpty: false },
			),
		);
	}
}

function collectSendListIssues(issues: KapsoFieldLimitIssue[], reader: ParameterReader): void {
	collectTextHeader(issues, reader, 'listHeaderType', 'listHeaderText', 'List Header Text');
	collectInteractiveBody(issues, reader);
	collectInteractiveFooter(issues, reader);

	pushIssue(
		issues,
		checkStringLength(
			readParam(reader, 'listButtonText'),
			LIST_BUTTON_TEXT_MAX,
			'List Button Text',
			'listButtonText',
			{ skipEmpty: false },
		),
	);

	const sections = getFixedCollectionItems<{
		sectionTitle?: string;
		rowValues?: unknown;
	}>(reader, 'sections', 'sectionValues');

	for (const [sectionIndex, section] of sections.entries()) {
		const sectionNumber = sectionIndex + 1;
		pushIssue(
			issues,
			checkStringLength(
				readStringParameterValue(section.sectionTitle),
				LIST_SECTION_TITLE_MAX,
				'Section Title',
				`sections[${sectionNumber}].sectionTitle`,
				{ skipEmpty: false },
			),
		);

		const rows = extractListRows(section.rowValues);
		for (const [rowIndex, row] of rows.entries()) {
			const rowNumber = rowIndex + 1;
			const rowPath = `section ${sectionNumber}, row ${rowNumber}`;

			pushIssue(
				issues,
				checkStringLength(readStringParameterValue(row.rowId), LIST_ROW_ID_MAX, 'Row ID', rowPath, {
					skipEmpty: false,
				}),
			);
			pushIssue(
				issues,
				checkStringLength(readStringParameterValue(row.rowTitle), LIST_ROW_TITLE_MAX, 'Row Title', rowPath, {
					skipEmpty: false,
				}),
			);
			pushIssue(
				issues,
				checkStringLength(
					readStringParameterValue(row.rowDescription),
					LIST_ROW_DESCRIPTION_MAX,
					'Row Description',
					rowPath,
				),
			);
		}
	}
}

function collectSendCtaIssues(issues: KapsoFieldLimitIssue[], reader: ParameterReader): void {
	collectTextHeader(issues, reader, 'ctaHeaderType', 'ctaHeaderText', 'Header Text');
	collectInteractiveBody(issues, reader);
	collectInteractiveFooter(issues, reader);

	pushIssue(
		issues,
		checkStringLength(
			readParam(reader, 'ctaButtonLabel'),
			CTA_BUTTON_LABEL_MAX,
			'Button Label',
			'ctaButtonLabel',
			{ skipEmpty: false },
		),
	);
}

function collectSendProductListIssues(issues: KapsoFieldLimitIssue[], reader: ParameterReader): void {
	if (readParam(reader, 'productListHeaderType') === 'text') {
		pushIssue(
			issues,
			checkStringLength(
				readParam(reader, 'productListHeaderText'),
				INTERACTIVE_HEADER_MAX,
				'Product List Header Text',
				'productListHeaderText',
				{ skipEmpty: false },
			),
		);
	}

	collectInteractiveBody(issues, reader);
	collectInteractiveFooter(issues, reader);

	const sections = getFixedCollectionItems<{
		sectionTitle?: string;
		productItems?: unknown;
	}>(reader, 'productSections', 'sectionValues');

	for (const [sectionIndex, section] of sections.entries()) {
		const sectionNumber = sectionIndex + 1;
		pushIssue(
			issues,
			checkStringLength(
				readStringParameterValue(section.sectionTitle),
				LIST_SECTION_TITLE_MAX,
				'Section Title',
				`productSections[${sectionNumber}].sectionTitle`,
				{ skipEmpty: false },
			),
		);
	}
}

function collectSendFlowIssues(issues: KapsoFieldLimitIssue[], reader: ParameterReader): void {
	collectTextHeader(issues, reader, 'flowHeaderType', 'flowHeaderText', 'Flow Header Text');
	collectInteractiveBody(issues, reader);
	pushIssue(
		issues,
		checkStringLength(readParam(reader, 'flowFooterText'), INTERACTIVE_FOOTER_MAX, 'Flow Footer Text', 'flowFooterText'),
	);
	pushIssue(
		issues,
		checkStringLength(readParam(reader, 'flowCta'), FLOW_CTA_MAX, 'Flow Button Label', 'flowCta'),
	);
	pushIssue(
		issues,
		checkStringLength(readParam(reader, 'flowToken'), FLOW_TOKEN_MAX, 'Flow Token', 'flowToken'),
	);
}

function collectKapsoMetaLimitIssuesFromReader(
	resource: string,
	operation: string,
	read: ParameterReader,
): KapsoFieldLimitIssue[] {
	if (resource !== 'message' || !MESSAGE_META_LIMIT_OPERATIONS.has(operation)) {
		return [];
	}

	const issues: KapsoFieldLimitIssue[] = [];

	switch (operation) {
		case 'sendText':
			pushIssue(
				issues,
				checkStringLength(readParam(read, 'textBody'), TEXT_MESSAGE_MAX, 'Text', 'textBody', {
					skipEmpty: false,
				}),
			);
			break;
		case 'sendImage':
		case 'sendVideo':
		case 'sendDocument':
			collectMediaCaption(issues, read);
			break;
		case 'sendButtons':
			collectSendButtonsIssues(issues, read);
			break;
		case 'sendList':
			collectSendListIssues(issues, read);
			break;
		case 'sendCta':
			collectSendCtaIssues(issues, read);
			break;
		case 'sendProduct':
			pushIssue(
				issues,
				checkStringLength(readParam(read, 'bodyText'), INTERACTIVE_BODY_MAX, 'Body Text', 'bodyText'),
			);
			pushIssue(
				issues,
				checkStringLength(
					readParam(read, 'productRetailerId'),
					PRODUCT_RETAILER_ID_MAX,
					'Product',
					'productRetailerId',
					{ skipEmpty: false },
				),
			);
			break;
		case 'sendProductList':
			collectSendProductListIssues(issues, read);
			break;
		case 'sendCatalog':
			pushIssue(
				issues,
				checkStringLength(readParam(read, 'bodyText'), INTERACTIVE_BODY_MAX, 'Body Text', 'bodyText'),
			);
			pushIssue(
				issues,
				checkStringLength(
					readParam(read, 'catalogThumbnailProductId'),
					PRODUCT_RETAILER_ID_MAX,
					'Thumbnail Product',
					'catalogThumbnailProductId',
				),
			);
			break;
		case 'sendFlow':
			collectSendFlowIssues(issues, read);
			break;
		case 'requestLocation':
		case 'sendCallPermission':
			collectInteractiveBody(issues, read);
			break;
		default:
			break;
	}

	pushIssue(
		issues,
		checkStringLength(
			readCollectionOption(read, 'messageSendOptions', 'bizOpaqueCallbackData'),
			BIZ_OPAQUE_CALLBACK_DATA_MAX,
			'Callback Data',
			'messageSendOptions.bizOpaqueCallbackData',
		),
	);

	return issues;
}

export function collectKapsoMetaLimitIssues(parameters: INodeParameters): KapsoFieldLimitIssue[] {
	return collectKapsoMetaLimitIssuesFromReader(
		String(parameters.resource ?? ''),
		String(parameters.operation ?? ''),
		(name) => parameters[name],
	);
}

export function formatKapsoFieldLimitIssue(issue: KapsoFieldLimitIssue): string {
	const location = issue.path ? ` (${issue.path})` : '';
	return `${issue.label}${location}: ${issue.actual}/${issue.max} chars — "${issue.preview}"`;
}

export function formatKapsoFieldLimitIssues(issues: KapsoFieldLimitIssue[]): string {
	if (issues.length === 0) {
		return '';
	}

	const lines = issues.map((issue) => `- ${formatKapsoFieldLimitIssue(issue)}`);
	return ['Meta WhatsApp field limits exceeded:', ...lines].join('\n');
}

export function assertKapsoMetaFieldLimits(ef: IExecuteFunctions, itemIndex: number): void {
	const resource = ef.getNodeParameter('resource', itemIndex) as string;
	const operation = ef.getNodeParameter('operation', itemIndex) as string;
	const issues = collectKapsoMetaLimitIssuesFromReader(resource, operation, (name) =>
		ef.getNodeParameter(name, itemIndex, ''),
	);

	if (issues.length === 0) {
		return;
	}

	throw new NodeOperationError(ef.getNode(), formatKapsoFieldLimitIssues(issues), { itemIndex });
}
