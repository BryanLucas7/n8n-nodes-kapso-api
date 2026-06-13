/** Strip WhatsApp text markers from strings that must be plain (interactive headers, etc.). */
export function stripWhatsAppFormatting(text: string): string {
	return text
		.replace(/```([\s\S]*?)```/g, '$1')
		.replace(/\*([^*\n]+)\*/g, '$1')
		.replace(/_([^_\n]+)_/g, '$1')
		.replace(/~([^~\n]+)~/g, '$1')
		.replace(/`([^`\n]+)`/g, '$1');
}

export function containsWhatsAppFormatting(text: string): boolean {
	return /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[\s\S]*?```|`[^`\n]+`)/.test(text);
}
