import { ILoadOptionsFunctions, ResourceMapperField, ResourceMapperFields } from 'n8n-workflow';
import {
	extractScreenDataSchema,
	readFlowAssets,
	resolveInitialDataScreenId,
	type FlowDataSchemaField,
} from '../loadOptions/flowAssets';
import { assertKapsoLoadOptionsReady, requireLoadOptionsDependency } from '../loadOptions/helpers';

export const FLOW_INITIAL_DATA_EMPTY_NOTICE =
	'This selected Flow screen does not define initial data fields in the Flow builder';

function formatExampleValue(
	example: unknown,
	type: ResourceMapperField['type'],
): string | number | boolean | null | undefined {
	if (example === undefined || example === null) {
		return undefined;
	}

	if (type === 'number') {
		const numeric = Number(example);
		return Number.isFinite(numeric) ? numeric : undefined;
	}

	if (type === 'boolean') {
		return Boolean(example);
	}

	if (typeof example === 'object') {
		return JSON.stringify(example);
	}

	return String(example);
}

function mapSchemaType(schemaType: string): ResourceMapperField['type'] {
	switch (schemaType) {
		case 'number':
		case 'integer':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'array':
			return 'array';
		case 'object':
			return 'object';
		default:
			return 'string';
	}
}

function fieldToMapperField(field: FlowDataSchemaField): ResourceMapperField {
	const type = mapSchemaType(field.type);

	return {
		id: field.key,
		displayName: field.key,
		required: false,
		defaultMatch: false,
		display: true,
		type,
		defaultValue: formatExampleValue(field.example, type),
	};
}

export async function getFlowInitialDataFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'phoneNumberId', 'Phone Number');
	requireLoadOptionsDependency(this, 'flowId', 'Flow');

	const assets = await readFlowAssets(this);
	const screenId = resolveInitialDataScreenId(this, assets);
	const schemaFields = extractScreenDataSchema(assets.flowJson, screenId);

	if (schemaFields.length === 0) {
		return {
			fields: [],
			emptyFieldsNotice: FLOW_INITIAL_DATA_EMPTY_NOTICE,
		};
	}

	return {
		fields: schemaFields.map(fieldToMapperField),
	};
}
