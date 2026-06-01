import { describe, expect, it } from 'vitest';
import {
	findTemplateEntry,
	parseTemplateDefinition,
} from '../../nodes/KapsoApi/loadOptions/templateDefinition';

describe('parseTemplateDefinition', () => {
	it('parses named body variables and dynamic url button slots', () => {
		const definition = parseTemplateDefinition({
			name: 'appointment',
			language: 'en_US',
			parameter_format: 'named',
			components: [
				{
					type: 'HEADER',
					format: 'TEXT',
					text: 'Hello {{customer_name}}',
				},
				{
					type: 'BODY',
					text: 'Your appointment with {{barber_name}} is on {{appointment_date}}.',
					example: {
						body_text_named_params: [
							{ param_name: 'barber_name', example: 'Alex' },
							{ param_name: 'appointment_date', example: 'Monday' },
						],
					},
				},
				{
					type: 'BUTTONS',
					buttons: [
						{ type: 'URL', text: 'Book', url: 'https://example.com/{{1}}' },
						{ type: 'COPY_CODE', text: 'Copy' },
					],
				},
			],
		});

		expect(definition.componentMode).toBe('standard');
		expect(definition.headerFormat).toBe('text');
		expect(definition.headerTextHasVariable).toBe(true);
		expect(definition.bodyVariables.map((entry) => entry.id)).toEqual(['barber_name', 'appointment_date']);
		expect(definition.buttonSlots).toEqual([
			{ index: 0, subType: 'url', dynamicKind: 'url_suffix' },
			{ index: 1, subType: 'copy_code', dynamicKind: 'copy_code' },
		]);
	});

	it('parses positional body variables and carousel cards', () => {
		const definition = parseTemplateDefinition({
			name: 'carousel_promo',
			language: 'en_US',
			parameter_format: 'positional',
			components: [
				{
					type: 'CAROUSEL',
					cards: [
						{
							components: [
								{ type: 'HEADER', format: 'IMAGE' },
								{ type: 'BODY', text: 'Card {{1}} offer', example: { body_text: [['Sample']] } },
								{ type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Buy', url: 'https://shop/{{1}}' }] },
							],
						},
					],
				},
			],
		});

		expect(definition.componentMode).toBe('carousel');
		expect(definition.carouselCards).toHaveLength(1);
		expect(definition.carouselCards[0].headerFormat).toBe('image');
		expect(definition.carouselCards[0].bodyVariables[0].displayName).toBe('Parameter 1');
	});

	it('parses all header formats and language_code fallback', () => {
		expect(parseTemplateDefinition({
			name: 'doc',
			language_code: 'pt_BR',
			components: [{ type: 'HEADER', format: 'DOCUMENT' }, { type: 'BODY', text: 'Doc' }],
		}).headerFormat).toBe('document');

		expect(parseTemplateDefinition({
			name: 'loc',
			language: 'en_US',
			components: [{ type: 'HEADER', format: 'LOCATION' }, { type: 'BODY', text: 'Loc' }],
		}).headerFormat).toBe('location');

		expect(parseTemplateDefinition({
			name: 'video',
			language: 'en_US',
			components: [{ type: 'HEADER', format: 'VIDEO' }, { type: 'BODY', text: 'Video' }],
		}).headerFormat).toBe('video');

		expect(parseTemplateDefinition({
			name: 'unknown',
			language: 'en_US',
			components: [{ type: 'HEADER', format: 'UNKNOWN' }, { type: 'BODY', text: 'X' }],
		}).headerFormat).toBe('none');
	});

	it('derives body variables from text when examples are missing or invalid', () => {
		expect(
			parseTemplateDefinition({
				name: 'named',
				language: 'en_US',
				parameter_format: 'NAMED',
				components: [{ type: 'BODY', text: 'Hi {{first_name}}' }],
			}).bodyVariables,
		).toEqual([
			expect.objectContaining({ id: 'first_name', parameterName: 'first_name' }),
		]);

		expect(
			parseTemplateDefinition({
				name: 'positional',
				language: 'en_US',
				parameter_format: 'positional',
				components: [{ type: 'BODY', text: 'Slot {{1}} and {{2}}' }],
			}).bodyVariables.map((entry) => entry.id),
		).toEqual(['param_1', 'param_2']);

		expect(
			parseTemplateDefinition({
				name: 'empty',
				language: 'en_US',
				components: [{ type: 'BODY', text: 'Static body' }],
			}).bodyVariables,
		).toEqual([]);
	});

	it('ignores invalid named example entries and positional examples without arrays', () => {
		expect(
			parseTemplateDefinition({
				name: 'bad-example',
				language: 'en_US',
				parameter_format: 'named',
				components: [
					{
						type: 'BODY',
						text: 'Fallback {{from_text}}',
						example: {
							body_text_named_params: [null, { param_name: '' }, { param_name: 'valid' }],
						},
					},
				],
			}).bodyVariables.map((entry) => entry.id),
		).toEqual(['valid']);

		expect(
			parseTemplateDefinition({
				name: 'positional-bad',
				language: 'en_US',
				parameter_format: 'positional',
				components: [
					{
						type: 'BODY',
						text: 'Hi {{1}}',
						example: { body_text: 'not-an-array' },
					},
				],
			}).bodyVariables[0].displayName,
		).toBe('Parameter 1');
	});

	it('parses dynamic button kinds including flow, catalog, mpm, and quick reply text', () => {
		const definition = parseTemplateDefinition({
			name: 'buttons',
			language: 'en_US',
			components: [
				{ type: 'BODY', text: 'Actions' },
				{
					type: 'BUTTONS',
					buttons: [
						{ type: 'FLOW', text: 'Book' },
						{ type: 'CATALOG', text: 'Catalog' },
						{ type: 'MPM', text: 'Products' },
						{ type: 'PHONE_NUMBER', text: 'Call' },
						{ type: 'QUICK_REPLY', text: 'Yes {{1}}' },
						{ type: 'URL', text: 'Static', url: 'https://example.com' },
					],
				},
			],
		});

		expect(definition.buttonSlots).toEqual([
			{ index: 0, subType: 'flow', dynamicKind: 'flow' },
			{ index: 1, subType: 'catalog', dynamicKind: 'catalog_thumbnail' },
			{ index: 2, subType: 'mpm', dynamicKind: 'mpm' },
			{ index: 3, subType: 'phone_number', dynamicKind: undefined },
			{ index: 4, subType: 'quick_reply', dynamicKind: 'quick_reply_text' },
			{ index: 5, subType: 'url', dynamicKind: undefined },
		]);
	});

	it('parses carousel cards with video headers and missing nested components', () => {
		const definition = parseTemplateDefinition({
			name: 'carousel',
			language: 'en_US',
			components: [
				{
					type: 'CAROUSEL',
					cards: [
						{
							components: [{ type: 'HEADER', format: 'VIDEO' }, { type: 'BODY', text: 'Deal {{1}}' }],
						},
						null,
						{ components: 'invalid' },
					],
				},
			],
		});

		expect(definition.carouselCards[0].headerFormat).toBe('video');
		expect(definition.carouselCards[1].bodyVariables).toEqual([]);
		expect(definition.carouselCards[2].buttonSlots).toEqual([]);
	});

	it('returns empty button slots when buttons payload is not an array', () => {
		expect(
			parseTemplateDefinition({
				name: 'no-buttons',
				language: 'en_US',
				components: [{ type: 'BUTTONS', buttons: 'invalid' }],
			}).buttonSlots,
		).toEqual([]);
	});

	it('ignores named example entries without param_name', () => {
		expect(
			parseTemplateDefinition({
				name: 'named',
				language: 'en_US',
				parameter_format: 'named',
				components: [
					{
						type: 'BODY',
						text: 'Hi {{first_name}}',
						example: {
							body_text_named_params: [{ param_name: '   ' }, { param_name: 'first_name' }],
						},
					},
				],
			}).bodyVariables.map((entry) => entry.id),
		).toEqual(['first_name']);
	});

	it('detects quick reply payload variables from button text', () => {
		expect(
			parseTemplateDefinition({
				name: 'qr',
				language: 'en_US',
				components: [
					{
						type: 'BUTTONS',
						buttons: [{ type: 'QUICK_REPLY', text: 'Track {{order_id}}' }],
					},
				],
			}).buttonSlots[0].dynamicKind,
		).toBe('quick_reply_text');
	});

	it('returns empty carousel cards when cards array is missing', () => {
		expect(
			parseTemplateDefinition({
				name: 'broken-carousel',
				language: 'en_US',
				components: [{ type: 'CAROUSEL' }],
			}).carouselCards,
		).toEqual([]);
	});
});

describe('findTemplateEntry', () => {
	const entries = [
		{ name: 'hello_world', language: 'en_US' },
		{ name: 'hello_world', language_code: 'pt_BR' },
		{ name: 'fallback_name' },
	];

	it('matches template name and language', () => {
		expect(findTemplateEntry(entries, 'hello_world', 'en_US')).toEqual(entries[0]);
		expect(findTemplateEntry(entries, 'hello_world', 'pt_BR')).toEqual(entries[1]);
		expect(findTemplateEntry(entries, 'missing', 'en_US')).toBeUndefined();
	});

	it('matches entries that only provide language_code', () => {
		expect(findTemplateEntry([{ name: 'only_code', language_code: 'de_DE' }], 'only_code', 'de_DE')?.name).toBe(
			'only_code',
		);
	});
});
