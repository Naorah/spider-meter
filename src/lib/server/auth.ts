import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/db';
import { error, redirect, type Cookies } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'session';
const SESSION_DAYS = 7;

type SessionPayload = {
	userId: number;
	exp: number;
};

function getSecret(): string {
	return env.SESSION_SECRET || 'dev-insecure-change-me';
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

function signSession(payload: SessionPayload): string {
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const sig = createHmac('sha256', getSecret()).update(body).digest('base64url');
	return `${body}.${sig}`;
}

function verifySessionToken(token: string): SessionPayload | null {
	const [body, sig] = token.split('.');
	if (!body || !sig) return null;
	const expected = createHmac('sha256', getSecret()).update(body).digest('base64url');
	try {
		if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
	} catch {
		return null;
	}
	const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
	if (payload.exp < Date.now()) return null;
	return payload;
}

export function setSessionCookie(cookies: Cookies, userId: number): void {
	const payload: SessionPayload = {
		userId,
		exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
	};
	cookies.set(SESSION_COOKIE, signSession(payload), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DAYS * 24 * 60 * 60
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function getSessionUser(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;
	const payload = verifySessionToken(token);
	if (!payload) return null;
	return prisma.adminUser.findUnique({ where: { id: payload.userId } });
}

export async function requireAdmin(cookies: Cookies) {
	const user = await getSessionUser(cookies);
	if (!user) error(401, 'Non authentifié');
	return user;
}

export async function requireAdminPage(cookies: Cookies, url: URL) {
	const user = await getSessionUser(cookies);
	if (!user) redirect(303, `/?login=1&redirect=${encodeURIComponent(url.pathname)}`);
	return user;
}

export async function countAdmins(): Promise<number> {
	return prisma.adminUser.count();
}

export async function createAdminUser(username: string, password: string) {
	const passwordHash = await hashPassword(password);
	return prisma.adminUser.create({
		data: { username, passwordHash }
	});
}

export async function authenticateUser(username: string, password: string) {
	const user = await prisma.adminUser.findUnique({ where: { username } });
	if (!user) return null;
	const ok = await verifyPassword(password, user.passwordHash);
	return ok ? user : null;
}
