import { Hono } from "hono";
import { Env, Variables } from "../types";
import { authMiddleware, adminOnly } from "../middlewares/auth";
import { hashPassword } from "../utils/crypto";

const admin = new Hono<{ Bindings: Env; Variables: Variables }>();

// Terapkan perlindungan secara global ke SEMUA rute di dalam file ini
admin.use("*", authMiddleware, adminOnly);

// --- MASTER DATA GURU ---
// --- MASTER DATA GURU ---

// --- MASTER DATA GURU ---

// 1. GET: Ambil daftar guru aktif (Tambahan kolom photo_url)
admin.get("/teachers", async (c) => {
	try {
		const { results } = await c.env.DB.prepare(
			"SELECT id, front_title, full_name, back_title, username, photo_url FROM users WHERE role = 'GURU' AND deleted_at IS NULL ORDER BY full_name ASC"
		).all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil data guru.", error: String(error) }, 500);
	}
});

// 2. POST: Tambah guru baru (Diperbarui untuk menerima Upload File)
admin.post("/teachers", async (c) => {
	try {
		const body = await c.req.parseBody();
		const front_title = body['front_title'] as string;
		const full_name = body['full_name'] as string;
		const back_title = body['back_title'] as string;
		const username = body['username'] as string;
		const password = body['password'] as string;
		const photoFile = body['photo'] as File | undefined;

		if (!full_name || !username || !password) {
			return c.json({ success: false, message: "Nama, username, dan password wajib diisi." }, 400);
		}

		const checkUser = await c.env.DB.prepare("SELECT id FROM users WHERE username = ? AND deleted_at IS NULL").bind(username).first();
		if (checkUser) return c.json({ success: false, message: "Username sudah terdaftar." }, 400);

		const teacherId = crypto.randomUUID();
		const hashedPassword = await hashPassword(password);
		const now = Math.floor(Date.now() / 1000);

		// Logika Upload Foto (Opsional)
		let photoUrl = null;
		if (photoFile && photoFile.name) {
			const fileExtension = photoFile.name.split('.').pop();
			const fileName = `teacher-${crypto.randomUUID()}.${fileExtension}`;
			
			await c.env.BUCKET.put(fileName, await photoFile.arrayBuffer(), {
				httpMetadata: { contentType: photoFile.type }
			});
			photoUrl = `/api/photos/${fileName}`;
		}

		await c.env.DB.prepare(
			`INSERT INTO users (id, role, front_title, full_name, back_title, username, password, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(teacherId, "GURU", front_title || null, full_name, back_title || null, username, hashedPassword, photoUrl, now).run();

		return c.json({ success: true, message: "Data Guru berhasil ditambahkan." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal menambah data guru.", error: String(error) }, 500);
	}
});

// 3. PUT: Edit data guru (Diperbarui untuk Update Foto)
admin.put("/teachers/:id", async (c) => {
	try {
		const teacherId = c.req.param("id");
		const body = await c.req.parseBody();
		const front_title = body['front_title'] as string;
		const full_name = body['full_name'] as string;
		const back_title = body['back_title'] as string;
		const username = body['username'] as string;
		const password = body['password'] as string;
		const photoFile = body['photo'] as File | undefined;

		if (!full_name || !username) return c.json({ success: false, message: "Nama dan username wajib diisi." }, 400);

		const checkUser = await c.env.DB.prepare("SELECT id FROM users WHERE username = ? AND id != ? AND deleted_at IS NULL").bind(username, teacherId).first();
		if (checkUser) return c.json({ success: false, message: "Username sudah dipakai orang lain." }, 400);

		let query = "UPDATE users SET front_title = ?, full_name = ?, back_title = ?, username = ?";
		let params: any[] = [front_title || null, full_name, back_title || null, username];

		if (password && password.trim() !== "") {
			const hashedPassword = await hashPassword(password);
			query += ", password = ?";
			params.push(hashedPassword);
		}

		// Logika Update Foto Baru
		if (photoFile && photoFile.name) {
			const fileExtension = photoFile.name.split('.').pop();
			const fileName = `teacher-${crypto.randomUUID()}.${fileExtension}`;
			
			await c.env.BUCKET.put(fileName, await photoFile.arrayBuffer(), {
				httpMetadata: { contentType: photoFile.type }
			});
			query += ", photo_url = ?";
			params.push(`/api/photos/${fileName}`);
		}

		query += " WHERE id = ? AND role = 'GURU' AND deleted_at IS NULL";
		params.push(teacherId);

		const result = await c.env.DB.prepare(query).bind(...params).run();

		if (result.meta.changes === 0) return c.json({ success: false, message: "Data guru tidak ditemukan." }, 404);

		return c.json({ success: true, message: "Data Guru berhasil diperbarui." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal memperbarui data guru.", error: String(error) }, 500);
	}
});

// --- MASTER DATA KELAS ---

// GET: Ambil data kelas
admin.get("/classes", async (c) => {
	try {
		const { results } = await c.env.DB.prepare("SELECT * FROM classes ORDER BY name ASC").all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil data kelas.", error: String(error) }, 500);
	}
});

// POST: Tambah kelas baru (Diperbarui untuk Auto Increment)
admin.post("/classes", async (c) => {
	try {
		const body = await c.req.json();
		const { name } = body;

		if (!name) return c.json({ success: false, message: "Nama kelas wajib diisi." }, 400);

		// Cek apakah nama kelas sudah ada agar tidak duplikat
		const checkClass = await c.env.DB.prepare("SELECT id FROM classes WHERE name = ?").bind(name).first();
		if (checkClass) return c.json({ success: false, message: "Kelas tersebut sudah terdaftar." }, 400);

		// Kita HANYA memasukkan 'name'. Kolom 'id' akan diisi otomatis dengan angka oleh SQLite.
		await c.env.DB.prepare(
			`INSERT INTO classes (name) VALUES (?)`
		).bind(name).run();

		return c.json({ success: true, message: "Kelas baru berhasil ditambahkan." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal menambah data kelas.", error: String(error) }, 500);
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

// 1. UPDATE ENDPOINT GET (Hanya tampilkan yang tidak di-soft delete)
// --- GET DATA SISWA (Diperbarui untuk membaca class_id) ---
admin.get("/students", async (c) => {
	try {
		// Menggunakan LEFT JOIN agar nama kelas ikut terbaca
		const query = `
			SELECT s.id, s.full_name, s.photo_url, s.qr_identifier, s.class_id, c.name as class_name 
			FROM students s 
			LEFT JOIN classes c ON s.class_id = c.id 
			WHERE s.deleted_at IS NULL 
			ORDER BY s.full_name ASC
		`;
		const { results } = await c.env.DB.prepare(query).all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil data siswa.", error: String(error) }, 500);
	}
});

// --- PEMBAGIAN / MIGRASI KELAS (Diperbarui) ---
// --- PEMBAGIAN / MIGRASI KELAS ---
admin.post("/class-assign", async (c) => {
	try {
		const body = await c.req.json();
		const { target_class_id, student_ids } = body;

		// 1. Validasi format payload dari frontend
		if (!target_class_id || !Array.isArray(student_ids) || student_ids.length === 0) {
			return c.json({ success: false, message: "Data tujuan kelas dan siswa tidak lengkap." }, 400);
		}

		// 2. CEK MANUAL: Pastikan target_class_id benar-benar ada di tabel classes
		const checkClass = await c.env.DB.prepare("SELECT id FROM classes WHERE id = ?").bind(target_class_id).first();
		if (!checkClass) {
			return c.json({ success: false, message: "Gagal: Kelas tujuan tidak ditemukan di database. Coba muat ulang halaman." }, 404);
		}

		// 3. Eksekusi Migrasi
		const placeholders = student_ids.map(() => "?").join(",");
		const result = await c.env.DB.prepare(
			`UPDATE students SET class_id = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`
		).bind(target_class_id, ...student_ids).run();

		return c.json({ success: true, message: `${result.meta.changes} siswa berhasil dipindahkan ke kelas baru.` });

	} catch (error) {
		// Log error ini akan muncul di terminal jika terjadi masalah database lainnya
		console.error("[DB ERROR di /class-assign]:", error);
		return c.json({ success: false, message: "Terjadi kegagalan sistem saat memproses migrasi.", error: String(error) }, 500);
	}
});

// 2. ENDPOINT BARU: UPDATE DATA SISWA
admin.put("/students/:id", async (c) => {
	try {
		const studentId = c.req.param("id");
		const body = await c.req.parseBody();
		const fullName = body['full_name'] as string;
		const photoFile = body['photo'] as File | undefined;

		if (!fullName) return c.json({ success: false, message: "Nama lengkap wajib diisi." }, 400);

		let photoUrlQuery = "";
		let queryParams: any[] = [fullName];

		// Jika ada foto baru yang diunggah
		if (photoFile && photoFile.name) {
			const fileExtension = photoFile.name.split('.').pop();
			const fileName = `student-${crypto.randomUUID()}.${fileExtension}`;
			
			await c.env.BUCKET.put(fileName, await photoFile.arrayBuffer(), {
				httpMetadata: { contentType: photoFile.type }
			});
			
			const photoUrl = `/api/photos/${fileName}`;
			photoUrlQuery = ", photo_url = ?";
			queryParams.push(photoUrl);
		}

		queryParams.push(studentId);

		const result = await c.env.DB.prepare(
			`UPDATE students SET full_name = ?${photoUrlQuery} WHERE id = ? AND deleted_at IS NULL`
		).bind(...queryParams).run();

		if (result.meta.changes === 0) {
			return c.json({ success: false, message: "Siswa tidak ditemukan." }, 404);
		}

		return c.json({ success: true, message: "Data Siswa berhasil diperbarui." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal memperbarui data.", error: String(error) }, 500);
	}
});

// 3. ENDPOINT BARU: SOFT DELETE SISWA
admin.delete("/students/:id", async (c) => {
	try {
		const studentId = c.req.param("id");
		const now = Math.floor(Date.now() / 1000);

		const result = await c.env.DB.prepare(
			"UPDATE students SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL"
		).bind(now, studentId).run();

		if (result.meta.changes === 0) {
			return c.json({ success: false, message: "Siswa tidak ditemukan atau sudah dihapus." }, 404);
		}

		return c.json({ success: true, message: "Data Siswa berhasil dinonaktifkan." });
	} catch (error) {
		return c.json({ success: false, message: "Gagal menghapus data.", error: String(error) }, 500);
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

// =======================================================
// FITUR REKAPITULASI EXCEL
// =======================================================

// 1. Rekap Siswa Bulanan (Ditambah check_in_time & check_out_time)
admin.get("/recap/students", async (c) => {
	try {
		const month = c.req.query("month")?.padStart(2, '0');
		const year = c.req.query("year");
		
		if (!month || !year) return c.json({ success: false, message: "Bulan dan tahun diperlukan." }, 400);
		
		const likeQuery = `${year}-${month}-%`;

		const query = `
			SELECT s.id, s.full_name, c.name as class_name, a.date, a.check_in_time, a.check_out_time
			FROM students s
			LEFT JOIN classes c ON s.class_id = c.id
			LEFT JOIN attendance_records a ON s.id = a.student_id AND a.date LIKE ?
			WHERE s.deleted_at IS NULL
			ORDER BY c.name ASC, s.full_name ASC
		`;
		
		const { results } = await c.env.DB.prepare(query).bind(likeQuery).all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil rekap siswa.", error: String(error) }, 500);
	}
});

// 2. Rekap Guru Bulanan (Ditambah check_in_time & check_out_time)
admin.get("/recap/teachers", async (c) => {
	try {
		const month = c.req.query("month")?.padStart(2, '0');
		const year = c.req.query("year");
		
		if (!month || !year) return c.json({ success: false, message: "Bulan dan tahun diperlukan." }, 400);
		
		const likeQuery = `${year}-${month}-%`;

		const query = `
			SELECT u.id, u.front_title, u.full_name, u.back_title, a.date, a.check_in_time, a.check_out_time
			FROM users u
			LEFT JOIN teacher_daily_attendance a ON u.id = a.teacher_id AND a.date LIKE ?
			WHERE u.role = 'GURU' AND u.deleted_at IS NULL
			ORDER BY u.full_name ASC
		`;
		
		const { results } = await c.env.DB.prepare(query).bind(likeQuery).all();
		return c.json({ success: true, data: results });
	} catch (error) {
		return c.json({ success: false, message: "Gagal mengambil rekap guru.", error: String(error) }, 500);
	}
});

export default admin;