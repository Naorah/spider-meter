import type { MoltDto, NewsItemDto, SpiderProfileDto } from '$lib/types';

export type AdminTab = 'spider' | 'token' | 'molts' | 'news' | 'sensors' | 'gallery' | 'account';

export const ADMIN_TABS: { id: AdminTab; label: string }[] = [
	{ id: 'spider', label: 'Fiche occupante' },
	{ id: 'molts', label: 'Mues' },
	{ id: 'news', label: 'Actualités' },
	{ id: 'sensors', label: 'Sondes' },
	{ id: 'gallery', label: 'Galerie' },
	{ id: 'account', label: 'Compte' },
	{ id: 'token', label: 'Token Shelly' }
];

export function parseAdminTab(value: string | null): AdminTab {
	if (
		value === 'token' ||
		value === 'molts' ||
		value === 'news' ||
		value === 'sensors' ||
		value === 'gallery' ||
		value === 'account'
	) {
		return value;
	}
	return 'spider';
}

export type AdminPageData = {
	spider: SpiderProfileDto | null;
	molts: MoltDto[];
	news: NewsItemDto[];
	iotTokenMasked: string | null;
	hasIotToken: boolean;
	user: { username: string };
};

export type AdminFeedback = {
	onSuccess: (message: string) => void;
	onError: (message: string) => void;
};
