import { IDataObject, IHttpRequestMethods, IRequestOptions } from 'n8n-workflow';

export type KapsoApiSurface = 'platform' | 'whatsapp' | 'mediaDownload';

export interface KapsoCredentials {
	baseUrl: string;
	apiKey: string;
}

export interface KapsoRequestArgs {
	api: KapsoApiSurface;
	method: IHttpRequestMethods;
	path: string;
	query?: IDataObject;
	body?: IDataObject | IDataObject[];
	formData?: IDataObject;
	headers?: IDataObject;
	requiresAuth?: boolean;
	json?: boolean;
	encoding?: string | null;
	returnFullResponse?: boolean;
}

export type KapsoRequestOptions = IRequestOptions & {
	resolveWithFullResponse?: boolean;
};

export interface KapsoListResponse {
	data?: unknown[] | IDataObject;
	meta?: {
		page?: number;
		per_page?: number;
		total_pages?: number;
		total_count?: number;
	};
}
