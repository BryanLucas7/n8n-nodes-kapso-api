import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { parseJsonObject } from '../transport/json';

type FixedCollectionParameter = {
	[key: string]: IDataObject[] | undefined;
};

type AdvancedOptionsParameter = IDataObject;

export function getString(ef: IExecuteFunctions, name: string, itemIndex: number): string {
	return getResourceParameter(ef, name, itemIndex);
}

export function getResourceParameter(
	ef: IExecuteFunctions,
	name: string,
	itemIndex: number,
): string {
	const value = ef.getNodeParameter(name, itemIndex, '') as string | { value?: string };

	if (typeof value === 'string') {
		return value;
	}

	if (value && typeof value === 'object' && 'value' in value) {
		return String(value.value ?? '');
	}

	return '';
}

export function getBoolean(
	ef: IExecuteFunctions,
	name: string,
	itemIndex: number,
	defaultValue = false,
): boolean {
	return ef.getNodeParameter(name, itemIndex, defaultValue) as boolean;
}

export function getNumber(
	ef: IExecuteFunctions,
	name: string,
	itemIndex: number,
	defaultValue: number,
): number {
	return ef.getNodeParameter(name, itemIndex, defaultValue) as number;
}

export function getFixedCollectionItems<T extends IDataObject>(
	ef: IExecuteFunctions,
	parameterName: string,
	collectionName: string,
	itemIndex: number,
): T[] {
	const collection = ef.getNodeParameter(parameterName, itemIndex, {}) as FixedCollectionParameter;
	const items = collection[collectionName];

	if (!Array.isArray(items)) {
		return [];
	}

	return items as T[];
}

function getAdvancedOptions(ef: IExecuteFunctions, itemIndex: number): AdvancedOptionsParameter {
	return ef.getNodeParameter('advancedOptions', itemIndex, {}) as AdvancedOptionsParameter;
}

function getAdvancedOptionValue(
	ef: IExecuteFunctions,
	itemIndex: number,
	field: string,
): string | boolean | undefined {
	const advanced = getAdvancedOptions(ef, itemIndex);

	if (field in advanced) {
		return advanced[field] as string | boolean | undefined;
	}

	return undefined;
}

export function getAdvancedOptionString(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
): string {
	const fromAdvanced = getAdvancedOptionValue(ef, itemIndex, name);
	return typeof fromAdvanced === 'string' ? fromAdvanced : '';
}

export function getAdvancedOptionBoolean(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
	defaultValue: boolean,
): boolean {
	const fromAdvanced = getAdvancedOptionValue(ef, itemIndex, name);
	return typeof fromAdvanced === 'boolean' ? fromAdvanced : defaultValue;
}

export function getAdvancedFixedCollectionItems<T extends IDataObject>(
	ef: IExecuteFunctions,
	collectionName: string,
	itemName: string,
	itemIndex: number,
): T[] {
	const advanced = getAdvancedOptions(ef, itemIndex);
	const fromAdvanced = advanced[collectionName] as FixedCollectionParameter | undefined;
	if (fromAdvanced && Array.isArray(fromAdvanced[itemName])) {
		return fromAdvanced[itemName] as T[];
	}

	return [];
}

export function getOptionalJsonObject(
	ef: IExecuteFunctions,
	name: string,
	itemIndex: number,
	label: string,
): IDataObject | undefined {
	const raw = getString(ef, name, itemIndex);
	if (!raw.trim() || raw.trim() === '{}') {
		return undefined;
	}

	return parseJsonObject(raw, label);
}

export function getReplyToMessageId(ef: IExecuteFunctions, itemIndex: number): string | undefined {
	const replyToMessageId = getAdvancedOptionValue(ef, itemIndex, 'replyToMessageId');
	return typeof replyToMessageId === 'string' && replyToMessageId ? replyToMessageId : undefined;
}

export function getLinkPreview(ef: IExecuteFunctions, itemIndex: number, fallback: boolean): boolean {
	const linkPreview = getAdvancedOptionValue(ef, itemIndex, 'linkPreview');
	return typeof linkPreview === 'boolean' ? linkPreview : fallback;
}

export function bodyJson(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	return parseJsonObject(ef.getNodeParameter('bodyJson', itemIndex, '{}') as string, 'Body JSON');
}

export function advancedComponentsJson(ef: IExecuteFunctions, itemIndex: number): string | undefined {
	const value = getAdvancedOptionValue(ef, itemIndex, 'advancedComponentsJson');
	return typeof value === 'string' && value.trim() ? value : undefined;
}

function getPlatformListOptions(ef: IExecuteFunctions, itemIndex: number): AdvancedOptionsParameter {
	return ef.getNodeParameter('platformListOptions', itemIndex, {}) as AdvancedOptionsParameter;
}

function getPlatformListOptionValue(
	ef: IExecuteFunctions,
	itemIndex: number,
	field: string,
): string | boolean | undefined {
	const options = getPlatformListOptions(ef, itemIndex);
	if (field in options) {
		return options[field] as string | boolean | undefined;
	}
	return undefined;
}

export function getPlatformListOptionString(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
): string {
	const value = getPlatformListOptionValue(ef, itemIndex, name);
	return typeof value === 'string' ? value : '';
}

export function getPlatformListOptionBoolean(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
	defaultValue: boolean,
): boolean {
	const value = getPlatformListOptionValue(ef, itemIndex, name);
	return typeof value === 'boolean' ? value : defaultValue;
}

function getPlatformMessageListOptions(ef: IExecuteFunctions, itemIndex: number): AdvancedOptionsParameter {
	return ef.getNodeParameter('platformMessageListOptions', itemIndex, {}) as AdvancedOptionsParameter;
}

function getPlatformMessageListOptionValue(
	ef: IExecuteFunctions,
	itemIndex: number,
	field: string,
): string | boolean | undefined {
	const options = getPlatformMessageListOptions(ef, itemIndex);
	if (field in options) {
		return options[field] as string | boolean | undefined;
	}
	return undefined;
}

export function getPlatformMessageListOptionString(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
): string {
	const value = getPlatformMessageListOptionValue(ef, itemIndex, name);
	return typeof value === 'string' ? value : '';
}

function getBroadcastListOptions(ef: IExecuteFunctions, itemIndex: number): AdvancedOptionsParameter {
	return ef.getNodeParameter('broadcastListOptions', itemIndex, {}) as AdvancedOptionsParameter;
}

function getBroadcastListOptionValue(
	ef: IExecuteFunctions,
	itemIndex: number,
	field: string,
): string | boolean | undefined {
	const options = getBroadcastListOptions(ef, itemIndex);
	if (field in options) {
		return options[field] as string | boolean | undefined;
	}
	return undefined;
}

export function getBroadcastListOptionString(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
): string {
	const value = getBroadcastListOptionValue(ef, itemIndex, name);
	return typeof value === 'string' ? value : '';
}

export function itemPair(itemIndex: number): { item: number } {
	return { item: itemIndex };
}

export function asJsonItems(response: unknown, itemIndex: number): INodeExecutionData[] {
	if (Array.isArray(response)) {
		return response.map((entry) => ({
			json: (typeof entry === 'object' && entry !== null ? entry : { data: entry }) as IDataObject,
			pairedItem: itemPair(itemIndex),
		}));
	}

	return [
		{
			json: (typeof response === 'object' && response !== null ? response : { data: response }) as IDataObject,
			pairedItem: itemPair(itemIndex),
		},
	];
}
