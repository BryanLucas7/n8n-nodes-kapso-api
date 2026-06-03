import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	collectKapsoMetaLimitIssues,
	formatKapsoFieldLimitIssue,
} from '../actions/parameterPreflight';

export async function getMetaFieldLimitPreflightNotice(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const parameters = this.getNode().parameters;
	const issues = collectKapsoMetaLimitIssues(parameters);

	if (issues.length === 0) {
		return [{ name: '✓ All Configured Fields Are Within Meta Limits.', value: '' }];
	}

	return issues.map((issue) => ({
		name: formatKapsoFieldLimitIssue(issue),
		value: issue.path,
	}));
}
