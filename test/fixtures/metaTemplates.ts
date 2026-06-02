import { IDataObject } from 'n8n-workflow';
import {
	parseTemplateDefinition,
	TemplateDefinition,
} from '../../nodes/KapsoApi/loadOptions/templateDefinition';

export const namedOrderUpdateRaw: IDataObject = {
	name: 'order_update',
	language: 'en_US',
	parameter_format: 'named',
	components: [
		{ type: 'HEADER', format: 'TEXT', text: 'Order update' },
		{
			type: 'BODY',
			text: 'Hi {{first_name}}, your order {{order_id}} shipped.',
			example: {
				body_text_named_params: [
					{ param_name: 'first_name', example: 'Jessica' },
					{ param_name: 'order_id', example: '12345' },
				],
			},
		},
	],
};

export const positionalReminderRaw: IDataObject = {
	name: 'appointment_reminder',
	language: 'en_US',
	parameter_format: 'positional',
	components: [
		{
			type: 'BODY',
			text: 'Reminder: appointment on {{1}} at {{2}}.',
			example: { body_text: [['Monday', '10:00 AM']] },
		},
	],
};

export const noBodyVariablesRaw: IDataObject = {
	name: 'plain_notice',
	language: 'en_US',
	parameter_format: 'named',
	components: [{ type: 'BODY', text: 'Your package was delivered.' }],
};

export const imageHeaderRaw: IDataObject = {
	name: 'promo_banner',
	language: 'en_US',
	parameter_format: 'named',
	components: [
		{ type: 'HEADER', format: 'IMAGE' },
		{
			type: 'BODY',
			text: 'Use code {{promo_code}} today.',
			example: { body_text_named_params: [{ param_name: 'promo_code', example: 'SAVE10' }] },
		},
	],
};

export const dynamicButtonsRaw: IDataObject = {
	name: 'shop_actions',
	language: 'en_US',
	parameter_format: 'named',
	components: [
		{ type: 'BODY', text: 'Browse our catalog.' },
		{
			type: 'BUTTONS',
			buttons: [
				{ type: 'URL', text: 'Shop', url: 'https://shop.example/{{1}}' },
				{ type: 'FLOW', text: 'Book' },
				{ type: 'COPY_CODE', text: 'Copy offer' },
				{ type: 'CATALOG', text: 'View catalog' },
				{ type: 'MPM', text: 'View products' },
			],
		},
	],
};

export const carouselPromoRaw: IDataObject = {
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
				{
					components: [
						{ type: 'HEADER', format: 'VIDEO' },
						{ type: 'BODY', text: 'Video {{1}}', example: { body_text: [['Deal']] } },
					],
				},
			],
		},
	],
};

export const locationHeaderRaw: IDataObject = {
	name: 'store_locator',
	language: 'en_US',
	parameter_format: 'named',
	components: [
		{ type: 'HEADER', format: 'LOCATION' },
		{ type: 'BODY', text: 'Visit us today.' },
	],
};

export const namedHeaderVariableRaw: IDataObject = {
	name: 'seasonal_sale',
	language: 'en_US',
	parameter_format: 'named',
	components: [
		{ type: 'HEADER', format: 'TEXT', text: 'Sale {{sale_name}}' },
		{
			type: 'BODY',
			text: 'Hi {{first_name}}, shop our {{sale_name}} event today.',
			example: {
				body_text_named_params: [
					{ param_name: 'first_name', example: 'Jessica' },
					{ param_name: 'sale_name', example: 'Summer' },
				],
			},
		},
	],
};

export const approvedTemplateList: IDataObject[] = [
	namedOrderUpdateRaw,
	namedHeaderVariableRaw,
	positionalReminderRaw,
	noBodyVariablesRaw,
	imageHeaderRaw,
	dynamicButtonsRaw,
	carouselPromoRaw,
	locationHeaderRaw,
];

export const namedOrderUpdateDefinition = parseTemplateDefinition(namedOrderUpdateRaw);
export const namedHeaderVariableDefinition = parseTemplateDefinition(namedHeaderVariableRaw);
export const positionalReminderDefinition = parseTemplateDefinition(positionalReminderRaw);
export const noBodyVariablesDefinition = parseTemplateDefinition(noBodyVariablesRaw);
export const imageHeaderDefinition = parseTemplateDefinition(imageHeaderRaw);
export const dynamicButtonsDefinition = parseTemplateDefinition(dynamicButtonsRaw);
export const carouselPromoDefinition = parseTemplateDefinition(carouselPromoRaw);
export const locationHeaderDefinition = parseTemplateDefinition(locationHeaderRaw);

export function definitionWithButtonSlots(
	base: TemplateDefinition,
	buttonSlots: TemplateDefinition['buttonSlots'],
): TemplateDefinition {
	return { ...base, buttonSlots };
}

export const quickReplyPayloadButtonDefinition = definitionWithButtonSlots(noBodyVariablesDefinition, [
	{ index: 0, subType: 'quick_reply', dynamicKind: 'quick_reply_payload' },
	{ index: 1, subType: 'quick_reply', dynamicKind: 'quick_reply_text' },
]);

export const mpmSectionsJson = JSON.stringify([
	{
		title: 'Popular',
		product_items: [{ product_retailer_id: 'SKU_1' }, { product_retailer_id: 'SKU_2' }],
	},
]);
