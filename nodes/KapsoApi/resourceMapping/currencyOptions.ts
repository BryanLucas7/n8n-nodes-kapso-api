import { INodePropertyOptions } from 'n8n-workflow';

const ISO_CURRENCY_OPTIONS: INodePropertyOptions[] = [
	{ name: 'USD - US Dollar', value: 'USD' },
	{ name: 'EUR - Euro', value: 'EUR' },
	{ name: 'GBP - British Pound', value: 'GBP' },
	{ name: 'BRL - Brazilian Real', value: 'BRL' },
	{ name: 'CAD - Canadian Dollar', value: 'CAD' },
	{ name: 'AUD - Australian Dollar', value: 'AUD' },
	{ name: 'JPY - Japanese Yen', value: 'JPY' },
	{ name: 'CHF - Swiss Franc', value: 'CHF' },
	{ name: 'CNY - Chinese Yuan', value: 'CNY' },
	{ name: 'INR - Indian Rupee', value: 'INR' },
	{ name: 'MXN - Mexican Peso', value: 'MXN' },
	{ name: 'ARS - Argentine Peso', value: 'ARS' },
	{ name: 'CLP - Chilean Peso', value: 'CLP' },
	{ name: 'COP - Colombian Peso', value: 'COP' },
	{ name: 'PEN - Peruvian Sol', value: 'PEN' },
	{ name: 'ZAR - South African Rand', value: 'ZAR' },
	{ name: 'AED - UAE Dirham', value: 'AED' },
	{ name: 'SAR - Saudi Riyal', value: 'SAR' },
	{ name: 'SGD - Singapore Dollar', value: 'SGD' },
	{ name: 'HKD - Hong Kong Dollar', value: 'HKD' },
	{ name: 'KRW - South Korean Won', value: 'KRW' },
	{ name: 'NZD - New Zealand Dollar', value: 'NZD' },
	{ name: 'SEK - Swedish Krona', value: 'SEK' },
	{ name: 'NOK - Norwegian Krone', value: 'NOK' },
	{ name: 'DKK - Danish Krone', value: 'DKK' },
	{ name: 'PLN - Polish Zloty', value: 'PLN' },
	{ name: 'TRY - Turkish Lira', value: 'TRY' },
	{ name: 'ILS - Israeli Shekel', value: 'ILS' },
	{ name: 'THB - Thai Baht', value: 'THB' },
	{ name: 'PHP - Philippine Peso', value: 'PHP' },
	{ name: 'IDR - Indonesian Rupiah', value: 'IDR' },
	{ name: 'MYR - Malaysian Ringgit', value: 'MYR' },
	{ name: 'VND - Vietnamese Dong', value: 'VND' },
	{ name: 'CZK - Czech Koruna', value: 'CZK' },
	{ name: 'HUF - Hungarian Forint', value: 'HUF' },
	{ name: 'RON - Romanian Leu', value: 'RON' },
];

export function isoCurrencyOptions(): INodePropertyOptions[] {
	return ISO_CURRENCY_OPTIONS;
}
