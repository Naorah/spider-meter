export async function readErrorMessage(res: Response): Promise<string> {
	const body = await res.json().catch(() => ({}));
	return typeof body?.message === 'string' ? body.message : 'Erreur';
}
