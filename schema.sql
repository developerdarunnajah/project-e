-- ==========================================
-- MODUL 1: MASTER DATA & AUTENTIKASI
-- ==========================================

-- 1. Tabel Users (Admin & Guru)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'GURU')),
    front_title TEXT,                  -- Gelar depan (Misal: Drs.)
    full_name TEXT NOT NULL,           -- Nama inti
    back_title TEXT,                   -- Gelar belakang (Misal: S.Pd.)
    username TEXT UNIQUE NOT NULL,     -- Kredensial login
    password TEXT NOT NULL,            -- Hash kata sandi
    created_at INTEGER NOT NULL
);

-- 2. Tabel Students (Siswa)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    photo_url TEXT,                    -- URL pas foto untuk verifikasi visual saat scan
    qr_identifier TEXT UNIQUE NOT NULL,-- UUID statis yang dicetak ke ID Card Siswa
    created_at INTEGER NOT NULL
);

-- 3. Tabel Classes (Data Kelas)
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL                 -- Nama kelas (Misal: XII-RPL-1)
);

-- 4. Tabel Class Students (Pemetaan Siswa ke Kelas per Tahun Ajaran)
CREATE TABLE IF NOT EXISTS class_students (
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,       -- Misal: 2025/2026
    PRIMARY KEY (class_id, student_id, academic_year),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ==========================================
-- MODUL 2: PENGATURAN & OPERASIONAL ABSENSI
-- ==========================================

-- 5. Tabel Attendance Rules (Aturan Jam Masuk & Pulang)
CREATE TABLE IF NOT EXISTS attendance_rules (
    day_of_week INTEGER PRIMARY KEY,   -- 1 (Senin) hingga 7 (Minggu)
    check_in_start TEXT NOT NULL,      -- Jam mulai scan masuk (Format: HH:MM)
    check_in_end TEXT NOT NULL,        -- Batas akhir sebelum dihitung TERLAMBAT
    check_out_start TEXT NOT NULL,     -- Jam mulai boleh scan pulang
    check_out_end TEXT NOT NULL,       -- Batas akhir sistem menerima scan
    updated_at INTEGER NOT NULL,
    updated_by TEXT,                   -- ID Admin yang terakhir merubah
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Tabel Attendance Locations (Titik Absen Statis untuk Guru)
CREATE TABLE IF NOT EXISTS attendance_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,                -- Nama lokasi (Misal: "Lobi Utama")
    qr_token TEXT UNIQUE NOT NULL,     -- UUID statis yang dicetak untuk di-scan HP guru
    created_at INTEGER NOT NULL
);

-- ==========================================
-- MODUL 3: REKAMAN ABSENSI (TRANSAKSIONAL)
-- ==========================================

-- 7. Tabel Attendance Sessions (Sesi Scan Guru untuk Siswa)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,             -- Guru yang melakukan scan
    class_id TEXT,                     -- Kelas yang diakses
    session_date TEXT NOT NULL,        -- Format: YYYY-MM-DD
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- 8. Tabel Attendance Records (Log Absensi Siswa & Izin Manual)
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    session_id TEXT,                   -- NULL jika absensi/izin diinput manual oleh Admin
    date TEXT NOT NULL,                -- Format: YYYY-MM-DD
    check_in_time INTEGER,             -- UNIX Timestamp masuk
    check_out_time INTEGER,            -- UNIX Timestamp pulang
    status TEXT NOT NULL,              -- 'HADIR', 'SAKIT', 'IZIN', 'ALFA', 'TERLAMBAT'
    notes TEXT,                        -- Catatan izin dari Admin
    document_url TEXT,                 -- Bukti surat sakit/izin
    handled_by TEXT,                   -- Admin yang memproses izin (jika manual)
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL
);
-- Optimasi pencarian riwayat absensi siswa di dasbor Admin
CREATE INDEX IF NOT EXISTS idx_records_date_student ON attendance_records(date, student_id);
CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);

-- 9. Tabel Teacher Daily Attendance (Log Absen Harian Guru)
CREATE TABLE IF NOT EXISTS teacher_daily_attendance (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    location_id TEXT,                  -- Lokasi QR yang di-scan guru
    date TEXT NOT NULL,                -- Format: YYYY-MM-DD
    check_in_time INTEGER,
    check_out_time INTEGER,
    status TEXT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES attendance_locations(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_teacher_daily_date ON teacher_daily_attendance(date);

-- ==========================================
-- MODUL 4: KEGIATAN & RAPAT (INSIDENTAL)
-- ==========================================

-- 10. Tabel Events (Data Acara/Rapat)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    qr_token TEXT UNIQUE NOT NULL,     -- QR Dinamis khusus untuk acara ini
    created_by TEXT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Tabel Event Attendance (Log Kehadiran Guru di Acara)
CREATE TABLE IF NOT EXISTS event_attendance (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,             -- Guru yang hadir
    scanned_at INTEGER NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_attendance ON event_attendance(event_id);
-- ALTER TABLE students ADD COLUMN deleted_at INTEGER DEFAULT NULL;
-- ALTER TABLE users ADD COLUMN deleted_at INTEGER DEFAULT NULL;
ALTER TABLE students ADD COLUMN class_id TEXT REFERENCES classes(id) ON DELETE SET NULL;