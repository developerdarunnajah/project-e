import { useState } from "react";
import * as XLSX from "xlsx"; // Import library pembuat Excel

export default function AttendanceRecap() {
	const dateObj = new Date();
	const [selectedMonth, setSelectedMonth] = useState(String(dateObj.getMonth() + 1));
	const [selectedYear, setSelectedYear] = useState(String(dateObj.getFullYear()));
	const [isLoadingStudent, setIsLoadingStudent] = useState(false);
	const [isLoadingTeacher, setIsLoadingTeacher] = useState(false);

	const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();

	// Fungsi pengubah Timestamp (Detik) menjadi format jam "HH:MM"
// Fungsi pengubah Timestamp (Detik) menjadi format jam "HH:MM" (WIB Terkunci)
	const formatTime = (ts?: number) => {
		if (!ts) return "-";
		const d = new Date(ts * 1000);
		// Menggunakan en-GB agar formatnya konsisten menggunakan titik dua (:), contoh: 06:45
		// dan dikunci secara absolut ke zona waktu Jakarta
		return d.toLocaleTimeString('en-GB', { 
			timeZone: 'Asia/Jakarta', 
			hour: '2-digit', 
			minute: '2-digit', 
			hour12: false 
		});
	};

	// --- EXPORT DATA SISWA (BANYAK SHEET PER KELAS) ---
	const exportStudents = async () => {
		setIsLoadingStudent(true);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch(`/api/admin/recap/students?month=${selectedMonth}&year=${selectedYear}`, {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const resData = await res.json();

			if (!resData.success) return alert(resData.message);
			
			const days = getDaysInMonth(Number(selectedMonth), Number(selectedYear));
			
			// Objek bertingkat: { "XII-RPL": { "ID_SISWA": { name: "Budi", attendance: { 1: {in, out} } } } }
			const classesObj: Record<string, Record<string, any>> = {};

			resData.data.forEach((row: any) => {
				const className = row.class_name || "Tanpa Kelas";
				
				if (!classesObj[className]) classesObj[className] = {};
				if (!classesObj[className][row.id]) {
					classesObj[className][row.id] = { name: row.full_name, attendance: {} };
				}

				if (row.date) {
					const day = parseInt(row.date.split("-")[2], 10);
					classesObj[className][row.id].attendance[day] = {
						in: formatTime(row.check_in_time),
						out: formatTime(row.check_out_time)
					};
				}
			});

			// Menyusun Header Dinamis: ["Nama Siswa", "1 Masuk", "1 Pulang", "2 Masuk", "2 Pulang", ...]
			const headerRow = ["Nama Siswa"];
			for (let i = 1; i <= days; i++) {
				headerRow.push(`${i} Masuk`);
				headerRow.push(`${i} Pulang`);
			}

			// Membuat file Excel Baru
			const wb = XLSX.utils.book_new();

			// Membuat 1 Sheet untuk setiap Kelas
			for (const className in classesObj) {
				const sheetData = [headerRow];
				const students = classesObj[className];

				Object.values(students).forEach(student => {
					const rowData = [student.name];
					for (let i = 1; i <= days; i++) {
						const att = student.attendance[i] || { in: "-", out: "-" };
						rowData.push(att.in);
						rowData.push(att.out);
					}
					sheetData.push(rowData);
				});

				const ws = XLSX.utils.aoa_to_sheet(sheetData);
				// Pastikan nama Sheet tidak lebih dari 31 karakter (Aturan Excel)
				XLSX.utils.book_append_sheet(wb, ws, className.substring(0, 31)); 
			}

			// Unduh File Excel (Asli .xlsx)
			XLSX.writeFile(wb, `Rekap_Absensi_Siswa_${selectedMonth}_${selectedYear}.xlsx`);

		} catch (err) {
			alert("Gagal menyusun data Excel.");
		} finally {
			setIsLoadingStudent(false);
		}
	};

	// --- EXPORT DATA GURU (1 SHEET) ---
	const exportTeachers = async () => {
		setIsLoadingTeacher(true);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch(`/api/admin/recap/teachers?month=${selectedMonth}&year=${selectedYear}`, {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const resData = await res.json();

			if (!resData.success) return alert(resData.message);
			
			const days = getDaysInMonth(Number(selectedMonth), Number(selectedYear));
			const groupedData: Record<string, any> = {};

			resData.data.forEach((row: any) => {
				if (!groupedData[row.id]) {
					const front = row.front_title ? `${row.front_title} ` : "";
					const back = row.back_title ? `, ${row.back_title}` : "";
					groupedData[row.id] = { name: `${front}${row.full_name}${back}`, attendance: {} };
				}
				if (row.date) {
					const day = parseInt(row.date.split("-")[2], 10);
					groupedData[row.id].attendance[day] = {
						in: formatTime(row.check_in_time),
						out: formatTime(row.check_out_time)
					};
				}
			});

			const headerRow = ["Nama Guru / Staf"];
			for (let i = 1; i <= days; i++) {
				headerRow.push(`${i} Masuk`);
				headerRow.push(`${i} Pulang`);
			}

			const sheetData = [headerRow];

			Object.values(groupedData).forEach(teacher => {
				const rowData = [teacher.name];
				for (let i = 1; i <= days; i++) {
					const att = teacher.attendance[i] || { in: "-", out: "-" };
					rowData.push(att.in);
					rowData.push(att.out);
				}
				sheetData.push(rowData);
			});

			const wb = XLSX.utils.book_new();
			const ws = XLSX.utils.aoa_to_sheet(sheetData);
			XLSX.utils.book_append_sheet(wb, ws, "Rekap Guru");
			
			XLSX.writeFile(wb, `Rekap_Absensi_Guru_${selectedMonth}_${selectedYear}.xlsx`);

		} catch (err) {
			alert("Gagal menyusun data Excel.");
		} finally {
			setIsLoadingTeacher(false);
		}
	};

	return (
		<div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
			<div style={{ paddingBottom: '1rem', borderBottom: '2px solid #f3f4f6' }}>
				<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rekapitulasi Excel Profesional</h2>
				<p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Laporan di-generate langsung dalam format .xlsx dengan Sheet terpisah untuk setiap kelas dan mencatat detail jam masuk/pulang.</p>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
				<div>
					<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Bulan</label>
					<select 
						value={selectedMonth} 
						onChange={(e) => setSelectedMonth(e.target.value)} 
						style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
					>
						{Array.from({length: 12}, (_, i) => (
							<option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
						))}
					</select>
				</div>
				<div>
					<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Tahun</label>
					<input 
						type="number" 
						value={selectedYear} 
						onChange={(e) => setSelectedYear(e.target.value)} 
						style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db' }} 
					/>
				</div>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
				
				{/* KARTU UNDUH SISWA */}
				<div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
					<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
					<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Laporan Multi-Sheet Siswa</h3>
					<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Setiap kelas memiliki Sheet tersendiri di dalam Excel dengan rekap jam akurat.</p>
					<button 
						onClick={exportStudents}
						disabled={isLoadingStudent}
						style={{ width: '100%', padding: '0.875rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isLoadingStudent ? 'not-allowed' : 'pointer' }}
					>
						{isLoadingStudent ? 'Menyusun File Excel...' : 'Unduh Laporan Siswa (.xlsx)'}
					</button>
				</div>

				{/* KARTU UNDUH GURU */}
				<div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
					<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👔</div>
					<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Laporan Waktu Guru</h3>
					<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Rekam jejak jam check-in dan check-out seluruh guru dan staf operasional sekolah.</p>
					<button 
						onClick={exportTeachers}
						disabled={isLoadingTeacher}
						style={{ width: '100%', padding: '0.875rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isLoadingTeacher ? 'not-allowed' : 'pointer' }}
					>
						{isLoadingTeacher ? 'Menyusun File Excel...' : 'Unduh Laporan Guru (.xlsx)'}
					</button>
				</div>

			</div>
		</div>
	);
}