import { useState, useEffect } from "react";

// Definisi tipe data agar TypeScript mengenali struktur kita
type Student = { id: string; full_name: string; photo_url: string; qr_identifier: string };
type ClassItem = { id: string; name: string };

export default function ClassManager() {
	// State untuk data dari server
	const [classes, setClasses] = useState<ClassItem[]>([]);
	const [students, setStudents] = useState<Student[]>([]);
	
	// State untuk Form Tambah Kelas (Hanya Nama Kelas)
	const [newClassName, setNewClassName] = useState("");
	const [isAddingClass, setIsAddingClass] = useState(false);
	
	// State untuk Form Plotting (Pembagian) Siswa
	const [selectedClassId, setSelectedClassId] = useState("");
	const [academicYear, setAcademicYear] = useState("2025/2026"); // Default tahun ajaran
	const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
	const [isAssigning, setIsAssigning] = useState(false);

	// State untuk Notifikasi
	const [message, setMessage] = useState({ type: "", text: "" });

	// Mengambil data Kelas dan Siswa saat komponen pertama kali dimuat
	const fetchData = async () => {
		try {
			const token = localStorage.getItem("authToken");
			const headers = { "Authorization": `Bearer ${token}` };

			// Ambil Kelas
			const resClasses = await fetch("/api/admin/classes", { headers });
			const dataClasses = await resClasses.json();
			if (dataClasses.success) setClasses(dataClasses.data);

			// Ambil Siswa
			const resStudents = await fetch("/api/admin/students", { headers });
			const dataStudents = await resStudents.json();
			if (dataStudents.success) setStudents(dataStudents.data);
		} catch (error) {
			console.error("Gagal mengambil data:", error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// Fungsi Menyimpan Kelas Baru
	const handleAddClass = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsAddingClass(true);
		setMessage({ type: "", text: "" });

		try {
			const token = localStorage.getItem("authToken");
			const response = await fetch("/api/admin/classes", {
				method: "POST",
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
				body: JSON.stringify({ name: newClassName })
			});
			const result = await response.json();

			if (!response.ok || !result.success) {
				setMessage({ type: "error", text: result.message || "Gagal menambah kelas." });
				return;
			}

			setMessage({ type: "success", text: result.message });
			setNewClassName(""); // Reset nama kelas
			fetchData(); // Muat ulang daftar kelas agar ID barunya muncul
		} catch (error) {
			setMessage({ type: "error", text: "Kesalahan jaringan." });
		} finally {
			setIsAddingClass(false);
		}
	};

	// Fungsi Mencentang Siswa
	const toggleStudentSelection = (studentId: string) => {
		setSelectedStudentIds(prev => 
			prev.includes(studentId) 
				? prev.filter(id => id !== studentId) // Hapus jika sudah dicentang
				: [...prev, studentId] // Tambah jika belum dicentang
		);
	};

	// Fungsi Menyimpan Plotting Siswa ke Kelas
	const handleAssignStudents = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedStudentIds.length === 0) {
			setMessage({ type: "error", text: "Pilih minimal 1 siswa terlebih dahulu." });
			return;
		}

		setIsAssigning(true);
		setMessage({ type: "", text: "" });

		try {
			const token = localStorage.getItem("authToken");
			const response = await fetch("/api/admin/class-assign", {
				method: "POST",
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
				body: JSON.stringify({ 
					class_id: selectedClassId, 
					academic_year: academicYear, 
					student_ids: selectedStudentIds 
				})
			});
			const result = await response.json();

			if (!response.ok || !result.success) {
				setMessage({ type: "error", text: result.message || "Gagal memasukkan siswa ke kelas." });
				return;
			}

			setMessage({ type: "success", text: result.message });
			setSelectedStudentIds([]); // Kosongkan centangan setelah berhasil
		} catch (error) {
			setMessage({ type: "error", text: "Kesalahan jaringan." });
		} finally {
			setIsAssigning(false);
		}
	};

	return (
		<div>
			<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>Manajemen Kelas & Rombongan Belajar</h2>
			
			{message.text && (
				<div style={{ padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce3', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
					{message.text}
				</div>
			)}

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
				
				{/* KOLOM KIRI: Buat Kelas Baru */}
				<div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
					<h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tambah Kelas Baru</h3>
					<form onSubmit={handleAddClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nama Kelas *</label>
							<input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required placeholder="Contoh: Kelas X IPA 1" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
						</div>
						<button type="submit" disabled={isAddingClass} style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: isAddingClass ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isAddingClass ? 'not-allowed' : 'pointer' }}>
							{isAddingClass ? "Menyimpan..." : "Buat Kelas"}
						</button>
					</form>

					{/* Menampilkan daftar kelas yang sudah ada */}
					<div style={{ marginTop: '2rem' }}>
						<h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Daftar Kelas Tersedia</h4>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: 'white' }}>
							{classes.length === 0 ? (
								<li style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>Belum ada kelas.</li>
							) : (
								classes.map(cls => (
									<li key={cls.id} style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
										<span style={{ fontWeight: 'bold' }}>{cls.name}</span>
										<span style={{ color: '#6b7280', fontSize: '0.75rem' }}>ID: {cls.id}</span>
									</li>
								))
							)}
						</ul>
					</div>
				</div>

				{/* KOLOM KANAN: Plotting Siswa */}
				<div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
					<h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Plotting Siswa ke Kelas</h3>
					
					<form onSubmit={handleAssignStudents} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
							<div>
								<label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Pilih Kelas Tujuan *</label>
								<select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white' }}>
									<option value="" disabled>-- Pilih Kelas --</option>
									{classes.map(cls => (
										<option key={cls.id} value={cls.id}>{cls.name}</option>
									))}
								</select>
							</div>
							<div>
								<label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Tahun Ajaran *</label>
								<input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
							</div>
						</div>

						{/* Daftar Checkbox Siswa */}
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
								<label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Pilih Siswa ({selectedStudentIds.length} Terpilih)</label>
								<button type="button" onClick={() => setSelectedStudentIds(students.map(s => s.id))} style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Pilih Semua</button>
							</div>
							
							<div style={{ border: '1px solid #d1d5db', borderRadius: '4px', maxHeight: '350px', overflowY: 'auto', padding: '0.5rem' }}>
								{students.length === 0 ? (
									<p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>Belum ada data siswa.</p>
								) : (
									students.map(student => (
										<label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
											<input 
												type="checkbox" 
												checked={selectedStudentIds.includes(student.id)}
												onChange={() => toggleStudentSelection(student.id)}
												style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
											/>
											{student.photo_url ? (
												<img src={student.photo_url} alt="Foto" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
											) : (
												<div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.75rem' }}>No Pic</div>
											)}
											<span style={{ fontWeight: '500' }}>{student.full_name}</span>
										</label>
									))
								)}
							</div>
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
							<button type="submit" disabled={isAssigning || !selectedClassId} style={{ padding: '0.75rem 2rem', backgroundColor: (isAssigning || !selectedClassId) ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: (isAssigning || !selectedClassId) ? 'not-allowed' : 'pointer' }}>
								{isAssigning ? "Memproses..." : "Simpan Pembagian Kelas"}
							</button>
						</div>
					</form>
				</div>

			</div>
		</div>
	);
}