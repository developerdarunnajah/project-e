import { verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";
import { Env, Variables } from "../types";

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ success: false, message: "Akses ditolak. Token tidak ditemukan." }, 401);
	}

	const token = authHeader.split(" ")[1];
	const secret = c.env.JWT_SECRET;
	
	if (!secret) {
		throw new Error("Kritis: JWT_SECRET belum dikonfigurasi di environment!");
	}

	try {
		const decodedPayload = await verify(token, secret, "HS256");
		// Menyimpan data user ke dalam context (c.get)
		c.set("user", decodedPayload as any); 
		await next();
	} catch (error) {
		return c.json({ success: false, message: "Token tidak valid atau sudah kedaluwarsa." }, 401);
	}
});

export const adminOnly = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
	const user = c.get("user");
	if (user.role !== "ADMIN") {
		return c.json({ success: false, message: "Akses ditolak. Hanya Admin yang diizinkan." }, 403);
	}
	await next();
});