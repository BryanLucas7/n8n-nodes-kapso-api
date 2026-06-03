import type { KapsoListSectionInput } from './messagePayloads';
import { readStringParameterValue } from './nodeHelpers';

export function extractListRows(rowValues: unknown): KapsoListSectionInput['rows'] {
	if (!rowValues) {
		return [];
	}

	if (Array.isArray(rowValues)) {
		return rowValues.flatMap((entry) => {
			if (entry && typeof entry === 'object' && 'rowId' in entry) {
				return [
					{
						rowId: readStringParameterValue(entry.rowId),
						rowTitle: readStringParameterValue(entry.rowTitle),
						rowDescription: readStringParameterValue(entry.rowDescription) || undefined,
					},
				];
			}

			if (entry && typeof entry === 'object' && Array.isArray((entry as { row?: unknown[] }).row)) {
				return (entry as { row: Array<Record<string, unknown>> }).row.map((row) => ({
					rowId: readStringParameterValue(row.rowId),
					rowTitle: readStringParameterValue(row.rowTitle),
					rowDescription: readStringParameterValue(row.rowDescription) || undefined,
				}));
			}

			return [];
		});
	}

	if (typeof rowValues === 'object' && Array.isArray((rowValues as { row?: unknown[] }).row)) {
		return (rowValues as { row: Array<Record<string, unknown>> }).row.map((row) => ({
			rowId: readStringParameterValue(row.rowId),
			rowTitle: readStringParameterValue(row.rowTitle),
			rowDescription: readStringParameterValue(row.rowDescription) || undefined,
		}));
	}

	return [];
}
