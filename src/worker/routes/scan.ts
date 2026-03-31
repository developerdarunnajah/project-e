import { Hono } from "hono";
import { Env, Variables } from "../types";
import { authMiddleware } from "../middlewares/auth";

const scan = new Hono<{ Bindings: Env; Variables: Variables }>();

// Semua guru & admin yang login bisa menggunakan fitur scan
scan.use("*", authMiddleware);

scan.post("/", async (c) => {
	try {
		const body = await c.req.json();
		const { qr_identifier } = body;

		if (!qr_identifier) {
			return c.json({ success: false, message: "QR Code tidak terbaca." }, 400);
		}

		// 1. IDENTIFIKASI KARTU
		const student = await c.env.DB.prepare(
			"SELECT id, full_name, photo_url FROM students WHERE qr_identifier = ?"
		).bind(qr_identifier).first<{ id: string, full_name: string, photo_url: string }>();

		if (!student) {
			return c.json({ success: false, message: "Kartu tidak dikenali di sistem." }, 404);
		}

		// 2. SETUP ZONA WAKTU (WIB - Asia/Jakarta)
		const dateObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
		const todayDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
		const currentTimeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
		const currentTimestamp = Math.floor(dateObj.getTime() / 1000);
		
		let dayOfWeek = dateObj.getDay();
		if (dayOfWeek === 0) dayOfWeek = 7; // Mengubah format JS (Minggu=0) ke format kita (Minggu=7)

		// 3. AMBIL ATURAN JAM HARI INI
		const rule = await c.env.DB.prepare(
			"SELECT check_in_start, check_in_end, check_out_start, check_out_end FROM attendance_rules WHERE day_of_week = ?"
		).bind(dayOfWeek).first<{ check_in_start: string, check_in_end: string, check_out_start: string, check_out_end: string }>();

		if (!rule || rule.check_in_start === "00:00") {
			return c.json({ success: false, message: "Hari ini adalah hari libur (tidak ada jadwal absensi)." }, 400);
		}

		// 4. CEK RIWAYAT ABSENSI SISWA HARI INI
		const existingRecord = await c.env.DB.prepare(
			"SELECT id, check_in_time, check_out_time, status FROM attendance_records WHERE student_id = ? AND date = ?"
		).bind(student.id, todayDate).first<{ id: string, check_in_time: number, check_out_time: number, status: string }>();

		// === LOGIKA CHECK-IN (PEMINDAIAN PERTAMA PAGI HARI) ===
		if (!existingRecord) {
			// Tolak jika kepagian
			if (currentTimeStr < rule.check_in_start) {
				return c.json({ success: false, message: `Belum waktunya masuk. Absensi dibuka jam ${rule.check_in_start}.` }, 400);
			}

			// Evaluasi status keterlambatan
			let status = "HADIR";
			if (currentTimeStr > rule.check_in_end) {
				status = "TERLAMBAT";
			}

			const recordId = crypto.randomUUID();
			await c.env.DB.prepare(
				`INSERT INTO attendance_records (id, student_id, date, check_in_time, status) VALUES (?, ?, ?, ?, ?)`
			).bind(recordId, student.id, todayDate, currentTimestamp, status).run();

			return c.json({
				success: true,
				message: `Check-In Berhasil (${status})`,
				type: "CHECK_IN",
				student: { name: student.full_name, photo: student.photo_url, status: status, time: currentTimeStr }
			});
		}

		// === LOGIKA CHECK-OUT (PEMINDAIAN KEDUA SAAT PULANG) ===
		if (existingRecord) {
			if (existingRecord.check_out_time) {
				return c.json({ success: false, message: "Siswa ini sudah melakukan Check-Out hari ini." }, 400);
			}

			if (currentTimeStr < rule.check_out_start) {
				return c.json({ success: false, message: `Belum waktunya pulang. Jam pulang: ${rule.check_out_start}.` }, 400);
			}

			await c.env.DB.prepare(
				"UPDATE attendance_records SET check_out_time = ? WHERE id = ?"
			).bind(currentTimestamp, existingRecord.id).run();

			return c.json({
				success: true,
				message: "Check-Out Berhasil",
				type: "CHECK_OUT",
				student: { name: student.full_name, photo: student.photo_url, status: "PULANG", time: currentTimeStr }
			});
		}

	} catch (error) {
		return c.json({ success: false, message: "Terjadi kesalahan mesin pemindai.", error: String(error) }, 500);
	}
});

export default scan;