import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { Env, Variables } from "./types";

// Memanggil Sub-Router
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import scanRoutes from "./routes/scan";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", logger());
app.use("/api/*", cors());

app.onError((err, c) => {
	console.error(`[API Error] ${err}`);
	return c.json({ success: false, message: "Terjadi kesalahan internal server." }, 500);
});

// ==========================================
// MOUNTING SUB-ROUTING (Sistem Rapi)
// ==========================================
// Semua rute yang diawali /api/auth akan diarahkan ke authRoutes
app.route("/api/auth", authRoutes);

// Semua rute yang diawali /api/admin akan diarahkan ke adminRoutes
app.route("/api/admin", adminRoutes);
app.route("/api/scan", scanRoutes);

// ==========================================
// RUTE PUBLIK & SISTEM
// ==========================================
// Menampilkan foto langsung dari Cloudflare R2
app.get("/api/photos/:filename", async (c) => {
	const filename = c.req.param("filename");
	const object = await c.env.BUCKET.get(filename);

	if (!object) {
		return c.json({ success: false, message: "Foto tidak ditemukan." }, 404);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);

	return new Response(object.body, { headers });
});

// Pengecekan status server
app.get("/api/health", async (c) => {
	const { results } = await c.env.DB.prepare("SELECT sqlite_version() AS version").all();
	return c.json({ success: true, version: results[0]?.version });
});

export default app;