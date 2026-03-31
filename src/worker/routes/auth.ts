import { Hono } from "hono";
import { sign } from "hono/jwt";
import { Env, Variables } from "../types";
import { hashPassword } from "../utils/crypto";

// Menggunakan tipe data yang sudah kita definisikan sebelumnya
const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

auth.post("/setup", async (c) => {
	try {
		const checkAdmin = await c.env.DB.prepare("SELECT id FROM users LIMIT 1").first();
		if (checkAdmin) {
			return c.json({ success: false, message: "Setup sudah pernah dilakukan." }, 403);
		}

		const adminId = crypto.randomUUID();
		const hashedPassword = await hashPassword("admin123");
		const now = Math.floor(Date.now() / 1000);

		await c.env.DB.prepare(
			`INSERT INTO users (id, role, full_name, username, password, created_at) VALUES (?, ?, ?, ?, ?, ?)`
		).bind(adminId, "ADMIN", "Administrator Utama", "admin", hashedPassword, now).run();

		return c.json({ success: true, message: "Admin pertama berhasil dibuat." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal membuat admin.", error: String(error) }, 500);
	}
});

auth.post("/login", async (c) => {
	try {
		const body = await c.req.json();
		const { username, password } = body;

		if (!username || !password) {
			return c.json({ success: false, message: "Username dan password wajib diisi." }, 400);
		}

		const user = await c.env.DB.prepare(
			"SELECT id, role, full_name, password FROM users WHERE username = ?"
		).bind(username).first<{ id: string; role: string; full_name: string; password: string }>();

		if (!user) {
			return c.json({ success: false, message: "Username atau password salah." }, 401);
		}

		const hashedPassword = await hashPassword(password);
		if (user.password !== hashedPassword) {
			return c.json({ success: false, message: "Username atau password salah." }, 401);
		}

		const secret = c.env.JWT_SECRET;
		const payload = {
			id: user.id,
			role: user.role,
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
		};
		const token = await sign(payload, secret, "HS256");

		return c.json({
			success: true,
			message: "Login berhasil",
			data: { token, user: { id: user.id, name: user.full_name, role: user.role } }
		});
	} catch (error) {
		return c.json({ success: false, message: "Terjadi kesalahan saat login.", error: String(error) }, 500);
	}
});

export default auth;