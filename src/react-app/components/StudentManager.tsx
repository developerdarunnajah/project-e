import { useState, useEffect, useRef } from "react";

interface Student {
	id: string;
	full_name: string;
	photo_url: string | null;
	qr_identifier: string;
}

export default function StudentManager() {
	// State Data
	const [allStudents, setAllStudents] = useState<Student[]>([]);
	const [searchResults, setSearchResults] = useState<Student[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);
	
	// State Mode UI (Penentu "Halaman" mana yang aktif)
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	
	// State Hapus (Verifikasi 2 Kali)
	const [deleteStep, setDeleteStep] = useState(0); 

	const [isLoading, setIsLoading] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);

	const fetchStudents = async () => {
		const token = localStorage.getItem("authToken");
		try {
			const res = await fetch("/api/admin/students", {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				setAllStudents(data.data);
				if (hasSearched) {
					setSearchResults(data.data.filter((s: Student) => 
						s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
					));
				}
			}
		} catch (err) {
			console.error("Gagal memuat data siswa", err);
		}
	};

	useEffect(() => {
		fetchStudents();
	}, []);

	// --- FUNGSI PENCARIAN ---
	const handleSearchClick = () => {
		const results = allStudents.filter(s => 
			s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setSearchResults(results);
		setHasSearched(true);
	};

	// --- FUNGSI UNDUH QR CODE ---
	const downloadQRCode = async (student: Student) => {
		try {
			const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${student.qr_identifier}`;
			const response = await fetch(qrUrl);
			const blob = await response.blob();
			
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.style.display = "none";
			a.href = url;
			a.download = `QR-Absen-${student.full_name.replace(/\s+/g, '-')}.png`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			alert("Gagal mengunduh gambar QR.");
		}
	};

	// --- CRUD OPERATIONS ---
	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formRef.current) return;
		setIsLoading(true);
		const formData = new FormData(formRef.current);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch("/api/admin/students", {
				method: "POST",
				headers: { "Authorization": `Bearer ${token}` },
				body: formData
			});
			const data = await res.json();
			if (data.success) {
				alert("Siswa baru berhasil ditambahkan!");
				handleBack(); // Kembali ke halaman awal
				setHasSearched(false);
				setSearchQuery("");
				fetchStudents();
			} else {
				alert(data.message);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedStudent || !formRef.current) return;
		setIsLoading(true);
		const formData = new FormData(formRef.current);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
				method: "PUT",
				headers: { "Authorization": `Bearer ${token}` },
				body: formData
			});
			const data = await res.json();
			if (data.success) {
				alert("Data berhasil diperbarui");
				setIsEditing(false); // Tetap di halaman detail, tapi keluar mode edit
				fetchStudents();
				
				// Update state lokal agar UI langsung berubah tanpa refresh penuh
				const updatedPhoto = data.photo_url || selectedStudent.photo_url;
				const updatedName = formData.get("full_name") as string;
				setSelectedStudent({...selectedStudent, full_name: updatedName, photo_url: updatedPhoto});
				
			} else {
				alert(data.message);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleInitiateDelete = () => {
		if (deleteStep === 0) setDeleteStep(1);
		else if (deleteStep === 1) setDeleteStep(2);
		else executeDelete();
	};

	const cancelDelete = () => setDeleteStep(0);

	const executeDelete = async () => {
		if (!selectedStudent) return;
		const token = localStorage.getItem("authToken");
		try {
			const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
				method: "DELETE",
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			
			if (data.success) {
				alert("Data berhasil dihapus.");
				handleBack(); // Kembali ke daftar setelah dihapus
				fetchStudents();
			} else {
				alert(data.message);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan.");
		}
	};

	// --- NAVIGASI HALAMAN VIRTUAL ---
	const openAddMode = () => {
		setSelectedStudent(null);
		setIsEditing(false);
		setIsAdding(true);
	};

	const openDetailMode = (student: Student) => {
		setIsAdding(false);
		setIsEditing(false);
		setDeleteStep(0);
		setSelectedStudent(student);
	};

	const handleBack = () => {
		setSelectedStudent(null);
		setIsAdding(false);
		setIsEditing(false);
		setDeleteStep(0);
	};

	return (
		<>
			<style>
				{`
					.student-container {
						width: 100%;
						max-width: 900px;
						margin: 0 auto;
						display: flex;
						flex-direction: column;
						gap: 1.5rem;
					}
					.search-box {
						display: flex;
						flex-wrap: wrap; /* Agar responsif di HP kecil */
						gap: 0.5rem;
						margin-bottom: 1.5rem;
					}
					.search-input {
						flex: 1;
						min-width: 200px;
						padding: 0.875rem;
						border-radius: 6px;
						border: 1px solid #d1d5db;
						outline: none;
						font-size: 1rem;
					}
					.search-input:focus { border-color: #3b82f6; }
					.btn-primary {
						padding: 0.875rem 1.5rem;
						background-color: #111827;
						color: white;
						border: none;
						border-radius: 6px;
						font-weight: bold;
						cursor: pointer;
						transition: background 0.2s;
					}
					.btn-primary:hover { background-color: #374151; }
					.btn-success { background-color: #10b981; }
					.btn-success:hover { background-color: #059669; }
					.btn-back {
						display: inline-flex;
						align-items: center;
						gap: 0.5rem;
						padding: 0.5rem 1rem;
						background-color: #f3f4f6;
						color: #374151;
						border: 1px solid #d1d5db;
						border-radius: 6px;
						font-weight: 600;
						cursor: pointer;
						margin-bottom: 1.5rem;
						transition: all 0.2s;
					}
					.btn-back:hover { background-color: #e5e7eb; }
					
					/* Responsif Card Detail */
					.detail-grid {
						display: flex;
						flex-wrap: wrap;
						gap: 2rem;
					}
					.detail-info {
						flex: 1 1 300px;
						display: flex;
						gap: 1.5rem;
						align-items: flex-start;
					}
					.detail-qr {
						flex: 1 1 250px;
						display: flex;
						flex-direction: column;
						align-items: center;
						background-color: #f9fafb;
						padding: 1.5rem;
						border-radius: 8px;
						border: 1px dashed #d1d5db;
					}
				`}
			</style>

			<div className="student-container">
				
				{/* =========================================
					HALAMAN 1: PENCARIAN & DAFTAR SISWA 
				========================================= */}
				{!selectedStudent && !isAdding && (
					<div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
							<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Direktori Siswa</h2>
							<button onClick={openAddMode} className="btn-primary btn-success">
								+ Tambah Siswa Baru
							</button>
						</div>
						
						<div className="search-box">
							<input 
								type="text" 
								placeholder="Cari nama siswa..." 
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
								className="search-input"
							/>
							<button onClick={handleSearchClick} className="btn-primary">
								Cari Siswa
							</button>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
							{!hasSearched ? (
								<div style={{ textAlign: 'center', color: '#6b7280', padding: '3rem 1rem', backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '8px' }}>
									Masukkan nama siswa lalu klik tombol Cari.
								</div>
							) : searchResults.length === 0 ? (
								<div style={{ textAlign: 'center', color: '#ef4444', padding: '2rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '500' }}>
									Tidak ada siswa yang cocok dengan pencarian Anda.
								</div>
							) : (
								searchResults.map(student => (
									<button 
										key={student.id}
										onClick={() => openDetailMode(student)}
										style={{ 
											display: 'flex', alignItems: 'center', gap: '1rem',
											textAlign: 'left', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb',
											backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.2s',
											boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
										}}
									>
										{student.photo_url ? (
											<img src={student.photo_url} alt="Foto" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} />
										) : (
											<div style={{ width: '50px', height: '50px', backgroundColor: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: 'bold' }}>{student.full_name.charAt(0)}</div>
										)}
										<div>
											<div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1.125rem' }}>{student.full_name}</div>
											<div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>ID: {student.qr_identifier.substring(0,8)}...</div>
										</div>
									</button>
								))
							)}
						</div>
					</div>
				)}

				{/* =========================================
					HALAMAN 2: TAMBAH SISWA BARU 
				========================================= */}
				{isAdding && (
					<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
						<button onClick={handleBack} className="btn-back">⬅ Kembali ke Pencarian</button>
						
						<form ref={formRef} onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
							<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem' }}>Tambah Data Siswa</h3>
							
							<div>
								<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Nama Lengkap</label>
								<input type="text" name="full_name" required className="search-input" />
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Upload Foto (Opsional)</label>
								<input type="file" name="photo" accept="image/jpeg, image/png" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px' }} />
							</div>

							<button type="submit" disabled={isLoading} className="btn-primary btn-success" style={{ marginTop: '1rem', width: '100%' }}>
								{isLoading ? 'Menyimpan...' : 'Simpan Siswa ke Database'}
							</button>
						</form>
					</div>
				)}

				{/* =========================================
					HALAMAN 3: DETAIL & EDIT SISWA 
				========================================= */}
				{selectedStudent && !isAdding && (
					<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
						<button onClick={handleBack} className="btn-back">⬅ Kembali ke Hasil Pencarian</button>

						{/* TAMPILAN DETAIL */}
						{!isEditing ? (
							<div>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
									<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Profil Siswa</h3>
									<button onClick={() => setIsEditing(true)} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✏️ Edit Data</button>
								</div>

								<div className="detail-grid">
									{/* Info & Foto */}
									<div className="detail-info">
										{selectedStudent.photo_url ? (
											<img src={selectedStudent.photo_url} alt="Foto" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #d1d5db', flexShrink: 0 }} />
										) : (
											<div style={{ width: '120px', height: '120px', backgroundColor: '#e5e7eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0, fontWeight: 'bold', fontSize: '1.25rem' }}>Tanpa Foto</div>
										)}
										<div>
											<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Nama Lengkap</p>
											<p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>{selectedStudent.full_name}</p>
											<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>ID Registrasi Sistem</p>
											<code style={{ backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '6px', fontSize: '0.875rem', color: '#374151', wordBreak: 'break-all', display: 'inline-block' }}>{selectedStudent.id}</code>
										</div>
									</div>

									{/* QR Code */}
									<div className="detail-qr">
										<p style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Kartu Identitas QR</p>
										<img 
											src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedStudent.qr_identifier}`} 
											alt="QR Code Siswa" 
											style={{ width: '180px', height: '180px', marginBottom: '1rem', borderRadius: '8px' }}
										/>
										<button 
											onClick={() => downloadQRCode(selectedStudent)}
											style={{ width: '100%', padding: '0.75rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}
										>
											⬇ Unduh QR Code
										</button>
									</div>
								</div>

								{/* ZONA BERBAHAYA */}
								<div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #fca5a5', backgroundColor: '#fef2f2', padding: '1.5rem', borderRadius: '8px' }}>
									<h4 style={{ color: '#991b1b', fontWeight: 'bold', marginBottom: '0.5rem' }}>Zona Berbahaya (Hapus Data)</h4>
									<p style={{ fontSize: '0.875rem', color: '#b91c1c', marginBottom: '1.5rem' }}>Aksi ini akan menyembunyikan siswa dari sistem secara permanen. Rekaman absensi lama tetap tersimpan.</p>
									
									{deleteStep === 0 && (
										<button onClick={handleInitiateDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hapus Siswa Ini</button>
									)}
									
									{deleteStep === 1 && (
										<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
											<button onClick={handleInitiateDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Lanjut: Apakah Anda yakin?</button>
											<button onClick={cancelDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
										</div>
									)}

									{deleteStep === 2 && (
										<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
											<button onClick={handleInitiateDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#7f1d1d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>KONFIRMASI FINAL: Hapus Sekarang!</button>
											<button onClick={cancelDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
										</div>
									)}
								</div>
							</div>
						) : (
							/* TAMPILAN EDIT */
							<form ref={formRef} onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem' }}>
									<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Data Siswa</h3>
									<button type="button" onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Batal Edit</button>
								</div>
								
								<div>
									<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Nama Lengkap</label>
									<input type="text" name="full_name" defaultValue={selectedStudent.full_name} required className="search-input" />
								</div>

								<div>
									<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Upload Foto Baru (Biarkan kosong jika tidak ingin mengubah foto)</label>
									<input type="file" name="photo" accept="image/jpeg, image/png" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px' }} />
								</div>

								<button type="submit" disabled={isLoading} className="btn-primary" style={{ backgroundColor: '#3b82f6', marginTop: '1rem', width: '100%' }}>
									{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
								</button>
							</form>
						)}

					</div>
				)}

			</div>
		</>
	);
}