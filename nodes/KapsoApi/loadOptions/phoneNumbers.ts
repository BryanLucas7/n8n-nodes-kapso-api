import { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { fetchAllListData, toOptions } from './helpers';

function phoneNumberLabel(entry: IDataObject): string {
	const displayName = String(
		entry.display_name ?? entry.display_phone_number ?? entry.phone_number ?? 'Phone number',
	);
	const id = String(entry.phone_number_id ?? entry.id ?? '');
	const kind = entry.kind ? ` · ${String(entry.kind)}` : '';

	return `${displayName}${kind} (${id})`;
}

function phoneNumberValue(entry: IDataObject): string {
	return String(entry.phone_number_id ?? entry.id ?? '');
}

export async function getPhoneNumbers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const entries = await fetchAllListData(this, {
		api: 'platform',
		method: 'GET',
		path: '/whatsapp/phone_numbers',
	});

	return toOptions(entries, phoneNumberLabel, phoneNumberValue);
}
