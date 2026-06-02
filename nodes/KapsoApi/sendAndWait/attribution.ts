export function createUtmCampaignLink(nodeType: string, instanceId?: string): string {
	return `https://n8n.io/?utm_source=n8n-internal&utm_medium=powered_by&utm_campaign=${encodeURIComponent(
		nodeType,
	)}${instanceId ? `_${instanceId}` : ''}`;
}

export const KAPSO_SEND_AND_WAIT_NODE_TYPE = 'n8n-nodes-kapso-api.kapsoApi';
