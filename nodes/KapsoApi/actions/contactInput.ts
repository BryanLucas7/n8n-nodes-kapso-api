import { IDataObject } from 'n8n-workflow';
import type { KapsoContactInput } from './messagePayloads';

/** Flattens Additional Contact Details and keeps legacy top-level contact fields working. */
export function normalizeContactInput(raw: IDataObject): KapsoContactInput {
	const additional = (raw.contactAdditionalDetails ?? {}) as IDataObject;

	const pickString = (key: keyof KapsoContactInput): string | undefined =>
		readOptionalString(raw[key] ?? additional[key]);

	const pickCollection = <K extends 'emails' | 'urls' | 'addresses'>(key: K) => {
		const value = raw[key] ?? additional[key];
		return value as KapsoContactInput[K];
	};

	return {
		formattedName: String(raw.formattedName ?? ''),
		firstName: pickString('firstName'),
		lastName: pickString('lastName'),
		middleName: pickString('middleName'),
		namePrefix: pickString('namePrefix'),
		nameSuffix: pickString('nameSuffix'),
		birthday: pickString('birthday'),
		phones: raw.phones as KapsoContactInput['phones'],
		emails: pickCollection('emails'),
		organization: pickString('organization'),
		orgDepartment: pickString('orgDepartment'),
		orgTitle: pickString('orgTitle'),
		urls: pickCollection('urls'),
		addresses: pickCollection('addresses'),
	};
}

export function normalizeContactInputs(rawContacts: IDataObject[]): KapsoContactInput[] {
	return rawContacts.map((contact) => normalizeContactInput(contact));
}

function readOptionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value : undefined;
}
