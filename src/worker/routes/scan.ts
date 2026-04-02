import { Hono } from "hono";
import { Env, Variables } from "../types";
import { authMiddleware } from "../middlewares/auth";

const scan = new Hono<{ Bindings: Env; Variables: Variables }>();

scan.use("*", authMiddleware);

// --- FUNGSI INTI EVALUASI LOGIKA ABSENSI ---
async function evaluateScan(c: any, qr_identifier: string, isConfirm: boolean) {
	const user = c.get("user"); 
	
	const userData = await c.env.DB.prepare("SELECT full_name FROM users WHERE id = ? AND deleted_at IS NULL").bind(user.id).first() as { full_name: string } | undefined;
	const teacherName = userData ? userData.full_name : "Guru / Staf";

	const dateObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
	const todayDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
	const currentTimeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
	const currentTimestamp = Math.floor(dateObj.getTime() / 1000);
	let dayOfWeek = dateObj.getDay();
	if (dayOfWeek === 0) dayOfWeek = 7;

	// LOGIKA 1: ABSENSI HARIAN GURU
	if (qr_identifier === "ABSEN-GURU") {
		const record = await c.env.DB.prepare(
			"SELECT id, check_in_time, check_out_time FROM teacher_daily_attendance WHERE teacher_id = ? AND date = ?"
		).bind(user.id, todayDate).first() as { id: string; check_in_time: number; check_out_time: number } | undefined;

		if (!record) {
			if (isConfirm) {
				await c.env.DB.prepare(`INSERT INTO teacher_daily_attendance (id, teacher_id, date, check_in_time, status) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), user.id, todayDate, currentTimestamp, "HADIR").run();
			}
			return { success: true, action: "MASUK", role: "GURU", name: teacherName, status: "HADIR", qr: qr_identifier };
		} else if (!record.check_out_time) {
			if (isConfirm) {
				await c.env.DB.prepare("UPDATE teacher_daily_attendance SET check_out_time = ? WHERE id = ?").bind(currentTimestamp, record.id).run();
			}
			return { success: true, action: "PULANG", role: "GURU", name: teacherName, status: "PULANG", qr: qr_identifier };
		} else {
			return { success: false, message: "Anda sudah melakukan absen masuk dan pulang hari ini." };
		}
	}

	// LOGIKA 2: KEHADIRAN ACARA / EVENT KHUSUS
	const event = await c.env.DB.prepare("SELECT id, name FROM events WHERE qr_token = ?").bind(qr_identifier).first() as { id: string; name: string } | undefined;
	if (event) {
		const attended = await c.env.DB.prepare("SELECT id FROM event_attendance WHERE event_id = ? AND user_id = ?").bind(event.id, user.id).first();
		if (attended) return { success: false, message: `Anda sudah mengkonfirmasi kehadiran pada acara: ${event.name}.` };
		
		if (isConfirm) {
			await c.env.DB.prepare("INSERT INTO event_attendance (id, event_id, user_id, scanned_at, status) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), event.id, user.id, currentTimestamp, "HADIR").run();
		}
		return { success: true, action: "ACARA", role: "GURU", name: teacherName, event_name: event.name, status: "HADIR EVENT", qr: qr_identifier };
	}

	// LOGIKA 3: ABSENSI SISWA
	const student = await c.env.DB.prepare("SELECT id, full_name, photo_url FROM students WHERE qr_identifier = ? AND deleted_at IS NULL").bind(qr_identifier).first() as { id: string; full_name: string; photo_url: string } | undefined;
	
	if (student) {
		const rule = await c.env.DB.prepare("SELECT check_in_start, check_in_end, check_out_start, check_out_end FROM attendance_rules WHERE day_of_week = ?").bind(dayOfWeek).first() as { check_in_start: string; check_in_end: string; check_out_start: string; check_out_end: string } | undefined;
		if (!rule || rule.check_in_start === "00:00") return { success: false, message: "Hari ini adalah hari libur (tidak ada jadwal absensi)." };

		const record = await c.env.DB.prepare("SELECT id, check_out_time FROM attendance_records WHERE student_id = ? AND date = ?").bind(student.id, todayDate).first() as { id: string; check_out_time: number } | undefined;

		if (!record) {
			if (currentTimeStr < rule.check_in_start) return { success: false, message: `Belum waktunya masuk. Absensi dibuka jam ${rule.check_in_start}.` };
			
			const status = currentTimeStr > rule.check_in_end ? "TERLAMBAT" : "HADIR";
			
			if (isConfirm) {
				await c.env.DB.prepare(`INSERT INTO attendance_records (id, student_id, date, check_in_time, status) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), student.id, todayDate, currentTimestamp, status).run();
			}
			return { success: true, action: "MASUK", role: "SISWA", name: student.full_name, photo: student.photo_url, status, qr: qr_identifier };
			
		} else if (!record.check_out_time) {
			if (currentTimeStr < rule.check_out_start) return { success: false, message: `Belum waktunya pulang. Jam pulang: ${rule.check_out_start}.` };
			
			if (isConfirm) {
				await c.env.DB.prepare("UPDATE attendance_records SET check_out_time = ? WHERE id = ?").bind(currentTimestamp, record.id).run();
			}
			return { success: true, action: "PULANG", role: "SISWA", name: student.full_name, photo: student.photo_url, status: "PULANG", qr: qr_identifier };
			
		} else {
			return { success: false, message: "Siswa ini sudah absen pulang hari ini." };
		}
	}

	return { success: false, message: "QR Code tidak valid atau tidak dikenali di sistem." };
}

scan.post("/verify", async (c) => {
	try {
		const body = await c.req.json();
		if (!body.qr_identifier) return c.json({ success: false, message: "QR Code kosong." }, 400);
		
		const result = await evaluateScan(c, body.qr_identifier, false);
		return c.json(result, result.success ? 200 : 400);
	} catch (error) { 
		return c.json({ success: false, message: "Error sistem pemindai.", error: String(error) }, 500); 
	}
});

scan.post("/confirm", async (c) => {
	try {
		const body = await c.req.json();
		if (!body.qr_identifier) return c.json({ success: false, message: "QR Code kosong." }, 400);
		
		const result = await evaluateScan(c, body.qr_identifier, true);
		return c.json(result, result.success ? 200 : 400);
	} catch (error) { 
		return c.json({ success: false, message: "Gagal menyimpan konfirmasi.", error: String(error) }, 500); 
	}
});

export default scan;