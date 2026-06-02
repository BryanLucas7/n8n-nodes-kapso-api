import { DisplayCondition, IDisplayOptions } from 'n8n-workflow';

function flowIdPartMatches(index: number, value: string): DisplayCondition {
	const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return { _cnd: { regex: `^([^|]*\\|){${index}}${escaped}(\\||$)` } };
}

/** Hide when encoded flow metadata marks a single-screen flow (part index 7). */
export const hideWhenFlowSingleScreen: NonNullable<IDisplayOptions['hide']> = {
	flowId: [flowIdPartMatches(7, '1')],
};

/** Hide when the flow has no data endpoint (navigate-only, part index 4). */
export const hideWhenFlowNavigateOnly: NonNullable<IDisplayOptions['hide']> = {
	flowId: [flowIdPartMatches(4, '0')],
};

/** Show when data endpoint is enabled but flows encryption is not configured. */
export const showWhenFlowEncryptionWarning: NonNullable<IDisplayOptions['show']> = {
	flowId: [{ _cnd: { regex: '^([^|]*\\|){4}1\\|([^|]*\\|){3}0(\\||$)' } }],
};

/** Show when a draft preview URL was captured from the Kapso API (part index 9). */
export const showWhenFlowPreviewAvailable: NonNullable<IDisplayOptions['show']> = {
	flowId: [{ _cnd: { regex: '^([^|]*\\|){9}[^|]+' } }],
};

export const showWhenFlowSingleScreenNotice: NonNullable<IDisplayOptions['show']> = {
	flowId: [flowIdPartMatches(7, '1')],
};

/** Show flow-specific fields after a Flow is selected (list picker or manual Meta Flow ID). */
export const showWhenFlowSelected: NonNullable<IDisplayOptions['show']> = {
	flowId: [
		{ _cnd: { regex: '^[^|]+\\|[^|]+' } },
		{ _cnd: { regex: '^[^|\\s]+$' } },
	],
};

export const FLOW_PREVIEW_NOTICE_DISPLAY_NAME =
	'={{ (() => { const parts = String($parameter.flowId || "").split("|"); const encoded = parts[9] || ""; if (!encoded) return ""; try { const url = decodeURIComponent(encoded); return url ? `Preview in WhatsApp: <a href="${url}" target="_blank">Open preview</a>` : ""; } catch { return ""; } })() }}';

export const FLOW_SINGLE_SCREEN_NOTICE_DISPLAY_NAME =
	'={{ (() => { const parts = String($parameter.flowId || "").split("|"); const screen = parts[5] || "first screen"; return `Screen <b>${screen}</b> is applied automatically`; })() }}';
