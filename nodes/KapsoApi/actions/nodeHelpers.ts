import {
	ApplicationError,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	isResourceLocatorValue,
} from 'n8n-workflow';
import { parseJsonObject } from '../transport/json';
import { assertPublicMediaUrl, assertWhatsAppMediaId } from './validation';

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

export function readMetaPhoneResourceLocatorValue(value: unknown, label: string): string {
	if (typeof value === 'string') {
		throw new ApplicationError(
			`${label} must use the phone number selector. Open the node and choose the phone number again.`,
		);
	}

	if (!isResourceLocatorValue(value)) {
		throw new ApplicationError(`${label} is required.`);
	}

	return String(value.value ?? '');
}

export function getMetaPhoneResourceLocatorValue(
	ef: IExecuteFunctions,
	name: string,
	itemIndex: number,
	label: string,
): string {
	return readMetaPhoneResourceLocatorValue(ef.getNodeParameter(name, itemIndex), label);
}

export function readE164PhoneResourceLocatorValue(value: unknown, label: string): string {
	if (typeof value === 'string') {
		throw new ApplicationError(
			`${label} must use the phone number selector. Open the node and choose the phone number again.`,
		);
	}

	if (!isResourceLocatorValue(value)) {
		throw new ApplicationError(`${label} is required.`);
	}

	return String(value.value ?? '');
}

export function tryReadE164PhoneResourceLocatorValue(
	value: unknown,
	label: string,
): string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === 'string') {
		if (!value.trim()) {
			return undefined;
		}

		throw new ApplicationError(
			`${label} must use the phone number selector. Open the node and choose the phone number again.`,
		);
	}

	if (!isResourceLocatorValue(value)) {
		return undefined;
	}

	const raw = String(value.value ?? '').trim();
	return raw || undefined;
}

export function getE164PhoneResourceLocatorValue(
	ef: IExecuteFunctions,
	name: string,
	itemIndex: number,
	label: string,
): string {
	return readE164PhoneResourceLocatorValue(ef.getNodeParameter(name, itemIndex), label);
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

export function getMediaSourceValue(
	ef: IExecuteFunctions,
	sourceParameter: string,
	idParameter: string,
	urlParameter: string,
	itemIndex: number,
): { source: 'id' | 'link'; value: string } {
	const source = getString(ef, sourceParameter, itemIndex) as 'id' | 'link';

	return {
		source,
		value: source === 'link' ? getString(ef, urlParameter, itemIndex) : getString(ef, idParameter, itemIndex),
	};
}

export function getValidatedMediaSourceValue(
	ef: IExecuteFunctions,
	sourceParameter: string,
	idParameter: string,
	urlParameter: string,
	itemIndex: number,
	labels: { id: string; url: string },
): { source: 'id' | 'link'; value: string } {
	const media = getMediaSourceValue(ef, sourceParameter, idParameter, urlParameter, itemIndex);

	return {
		source: media.source,
		value:
			media.source === 'link'
				? assertPublicMediaUrl(media.value, labels.url)
				: assertWhatsAppMediaId(media.value, labels.id),
	};
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

function getListOptions(
	ef: IExecuteFunctions,
	itemIndex: number,
	parameterName: 'contactListOptions' | 'conversationListOptions',
): AdvancedOptionsParameter {
	return ef.getNodeParameter(parameterName, itemIndex, {}) as AdvancedOptionsParameter;
}

function getListOptionValue(
	ef: IExecuteFunctions,
	itemIndex: number,
	field: string,
	parameterName: 'contactListOptions' | 'conversationListOptions',
): string | boolean | undefined {
	const options = getListOptions(ef, itemIndex, parameterName);
	if (field in options) {
		return options[field] as string | boolean | undefined;
	}
	return undefined;
}

export function getContactListOptionString(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
): string {
	const value = getListOptionValue(ef, itemIndex, name, 'contactListOptions');
	return typeof value === 'string' ? value : '';
}

export function getContactListOptionBoolean(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
	defaultValue: boolean,
): boolean {
	const value = getListOptionValue(ef, itemIndex, name, 'contactListOptions');
	return typeof value === 'boolean' ? value : defaultValue;
}

export function getConversationListOptionString(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
): string {
	const value = getListOptionValue(ef, itemIndex, name, 'conversationListOptions');
	return typeof value === 'string' ? value : '';
}

export function getConversationListOptionBoolean(
	ef: IExecuteFunctions,
	itemIndex: number,
	name: string,
	defaultValue: boolean,
): boolean {
	const value = getListOptionValue(ef, itemIndex, name, 'conversationListOptions');
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
