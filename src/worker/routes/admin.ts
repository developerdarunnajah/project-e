import { Hono } from "hono";
import { Env, Variables } from "../types";
import { authMiddleware, adminOnly } from "../middlewares/auth";
import { hashPassword } from "../utils/crypto";

const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

// Terapkan perlindungan secara global ke SEMUA rute di dalam file ini
admin.use("*", authMiddleware, adminOnly);

// --- MASTER DATA GURU ---
admin.post("/teachers", async (c) => {
	try {
		const body = await c.req.json();
		const { front_title, full_name, back_title, username, password } = body;

		if (!full_name || !username || !password) {
			return c.json({ success: false, message: "Data wajib diisi." }, 400);
		}

		const checkUser = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
		if (checkUser) return c.json({ success: false, message: "Username sudah terdaftar." }, 400);

		const teacherId = crypto.randomUUID();
		const hashedPassword = await hashPassword(password);
		const now = Math.floor(Date.now() / 1000);

		await c.env.DB.prepare(
			`INSERT INTO users (id, role, front_title, full_name, back_title, username, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(teacherId, "GURU", front_title || null, full_name, back_title || null, username, hashedPassword, now).run();

		return c.json({ success: true, message: "Data Guru berhasil ditambahkan." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal menambah data guru.", error: String(error) }, 500);
	}
});
admin.get("/teachers", async (c) => {
	try {
		const { results } = await c.env.DB.prepare(
			"SELECT id, front_title, full_name, back_title, username FROM users WHERE role = 'GURU' ORDER BY full_name ASC"
		).all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil data guru.", error: String(error) }, 500);
	}
});

// --- MASTER DATA KELAS ---
// --- MASTER DATA KELAS ---
admin.post("/classes", async (c) => {
	try {
		const body = await c.req.json();
		const { name } = body;
        
        // Sekarang hanya mengecek Nama Kelas saja
		if (!name) return c.json({ success: false, message: "Nama Kelas wajib diisi." }, 400);

        // Menghapus 'id' dari query INSERT. SQLite akan otomatis mengisi ID-nya (1, 2, 3, dst.)
		await c.env.DB.prepare(`INSERT INTO classes (name) VALUES (?)`).bind(name).run();
		
        return c.json({ success: true, message: `Kelas ${name} berhasil ditambahkan.` });
	} catch (error) {
		return c.json({ success: false, message: "Gagal menambah data kelas.", error: String(error) }, 500);
	}
});

admin.get("/classes", async (c) => {
	try {
		const { results } = await c.env.DB.prepare("SELECT id, name FROM classes ORDER BY name ASC").all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil data kelas.", error: String(error) }, 500);
	}
});

// --- MASTER DATA SISWA ---
admin.post("/students", async (c) => {
	try {
		const body = await c.req.parseBody();
		const fullName = body['full_name'] as string;
		const photoFile = body['photo'] as File | undefined;

		if (!fullName) return c.json({ success: false, message: "Nama lengkap wajib diisi." }, 400);

		let photoUrl = null;
		if (photoFile && photoFile.name) {
			const fileExtension = photoFile.name.split('.').pop();
			const fileName = `student-${crypto.randomUUID()}.${fileExtension}`;
			
			await c.env.BUCKET.put(fileName, await photoFile.arrayBuffer(), {
				httpMetadata: { contentType: photoFile.type }
			});
			photoUrl = `/api/photos/${fileName}`;
		}

		const studentId = crypto.randomUUID();
		const qrIdentifier = crypto.randomUUID(); 
		const now = Math.floor(Date.now() / 1000);

		await c.env.DB.prepare(
			`INSERT INTO students (id, full_name, photo_url, qr_identifier, created_at) VALUES (?, ?, ?, ?, ?)`
		).bind(studentId, fullName, photoUrl, qrIdentifier, now).run();

		return c.json({ 
			success: true, 
			message: "Data Siswa dan Foto berhasil disimpan.",
			data: { student_id: studentId, name: fullName, qr_code_token: qrIdentifier, photo_url: photoUrl }
		});
	} catch (error) {
		return c.json({ success: false, message: "Gagal menambah data siswa.", error: String(error) }, 500);
	}
});

admin.get("/students", async (c) => {
	try {
		const { results } = await c.env.DB.prepare("SELECT id, full_name, photo_url, qr_identifier FROM students ORDER BY full_name ASC").all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil data siswa.", error: String(error) }, 500);
	}
});

// --- PEMBAGIAN KELAS (BATCH ASSIGNMENT) ---
admin.post("/class-assign", async (c) => {
	try {
		const body = await c.req.json();
		const { class_id, academic_year, student_ids } = body;

		if (!class_id || !academic_year || !Array.isArray(student_ids) || student_ids.length === 0) {
			return c.json({ success: false, message: "Data tidak lengkap." }, 400);
		}

		const statements = student_ids.map((studentId: string) => {
			return c.env.DB.prepare(
				`INSERT INTO class_students (class_id, student_id, academic_year) VALUES (?, ?, ?)`
			).bind(class_id, studentId, academic_year);
		});

		await c.env.DB.batch(statements as any[]);
		return c.json({ success: true, message: `${student_ids.length} siswa berhasil dimasukkan ke kelas.` });
	} catch (error) {
		if (String(error).includes("UNIQUE constraint failed")) {
			return c.json({ success: false, message: "Sebagian siswa sudah terdaftar di kelas tersebut." }, 400);
		}
		return c.json({ success: false, message: "Gagal memproses pembagian kelas.", error: String(error) }, 500);
	}
});
// --- MASTER DATA ATURAN JAM ABSENSI ---
admin.get("/rules", async (c) => {
	try {
		const { results } = await c.env.DB.prepare("SELECT * FROM attendance_rules ORDER BY day_of_week ASC").all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil aturan jam.", error: String(error) }, 500);
	}
});

admin.post("/rules", async (c) => {
	try {
		const body = await c.req.json();
		const { rules } = body; // Array berisi 7 hari

		if (!Array.isArray(rules) || rules.length === 0) {
			return c.json({ success: false, message: "Data aturan tidak valid." }, 400);
		}

		const now = Math.floor(Date.now() / 1000);
		
		// Kita buat array instruksi (Statements)
		// 1. Hapus semua aturan lama terlebih dahulu agar bersih
		const statements = [
			c.env.DB.prepare("DELETE FROM attendance_rules")
		];

		// 2. Masukkan aturan baru untuk setiap hari
		rules.forEach((r: any) => {
			statements.push(
				c.env.DB.prepare(
					`INSERT INTO attendance_rules (day_of_week, check_in_start, check_in_end, check_out_start, check_out_end, updated_at) 
					 VALUES (?, ?, ?, ?, ?, ?)`
				).bind(r.day_of_week, r.check_in_start, r.check_in_end, r.check_out_start, r.check_out_end, now)
			);
		});

		// Eksekusi semuanya secara bersamaan (Aman dari putus koneksi di tengah jalan)
		await c.env.DB.batch(statements);

		return c.json({ success: true, message: "Aturan jam absensi berhasil diperbarui." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal menyimpan aturan jam.", error: String(error) }, 500);
	}
});
// --- LAPORAN ABSENSI HARIAN ---
admin.get("/attendance/today", async (c) => {
	try {
		// Kunci zona waktu ke Asia/Jakarta (WIB)
		const dateObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
		const todayDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

		// Mengambil data absensi hari ini dan menggabungkannya (JOIN) dengan tabel siswa untuk mendapatkan nama
		const query = `
			SELECT 
				a.id, 
				s.full_name, 
				a.check_in_time, 
				a.check_out_time, 
				a.status 
			FROM attendance_records a
			JOIN students s ON a.student_id = s.id
			WHERE a.date = ?
			ORDER BY a.check_in_time DESC
		`;

		const { results } = await c.env.DB.prepare(query).bind(todayDate).all();
		
		return c.json({ success: true, date: todayDate, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil data absensi.", error: String(error) }, 500);
	}
});

export default admin;