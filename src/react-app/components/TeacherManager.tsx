import { useState, useEffect, useRef } from "react";

interface Teacher {
	id: string;
	front_title: string | null;
	full_name: string;
	back_title: string | null;
	username: string;
	photo_url: string | null; // Tambahan field foto
}

export default function TeacherManager() {
	const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
	const [searchResults, setSearchResults] = useState<Teacher[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [hasSearched, setHasSearched] = useState(false);
	
	const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	
	const [deleteStep, setDeleteStep] = useState(0); 
	const [isLoading, setIsLoading] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);

	const fetchTeachers = async () => {
		const token = localStorage.getItem("authToken");
		try {
			const res = await fetch("/api/admin/teachers", {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				setAllTeachers(data.data);
				if (hasSearched) {
					setSearchResults(data.data.filter((t: Teacher) => 
						t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
						t.username.toLowerCase().includes(searchQuery.toLowerCase())
					));
				}
			}
		} catch (err) {
			console.error("Gagal memuat data guru", err);
		}
	};

	useEffect(() => {
		fetchTeachers();
	}, []);

	const handleSearchClick = () => {
		const results = allTeachers.filter(t => 
			t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
			t.username.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setSearchResults(results);
		setHasSearched(true);
	};

	const formatName = (t: Teacher) => {
		const front = t.front_title ? `${t.front_title} ` : "";
		const back = t.back_title ? `, ${t.back_title}` : "";
		return `${front}${t.full_name}${back}`;
	};

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formRef.current) return;
		setIsLoading(true);

		const formData = new FormData(formRef.current);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch("/api/admin/teachers", {
				method: "POST",
				headers: { "Authorization": `Bearer ${token}` }, // Dihapus Header Content-Type karena FormData
				body: formData
			});
			const data = await res.json();
			if (data.success) {
				alert("Data Guru baru berhasil ditambahkan!");
				handleBack(); 
				setHasSearched(false);
				setSearchQuery("");
				fetchTeachers();
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
		if (!selectedTeacher || !formRef.current) return;
		setIsLoading(true);

		const formData = new FormData(formRef.current);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch(`/api/admin/teachers/${selectedTeacher.id}`, {
				method: "PUT",
				headers: { "Authorization": `Bearer ${token}` }, // Dihapus Header Content-Type karena FormData
				body: formData
			});
			const data = await res.json();
			if (data.success) {
				alert("Data Guru berhasil diperbarui");
				setIsEditing(false); 
				fetchTeachers();
				
				// Update state lokal untuk visual langsung (tanpa hard refresh)
				const updatedPhoto = data.photo_url || selectedTeacher.photo_url;
				setSelectedTeacher({
					...selectedTeacher,
					front_title: formData.get("front_title") as string,
					full_name: formData.get("full_name") as string,
					back_title: formData.get("back_title") as string,
					username: formData.get("username") as string,
					photo_url: updatedPhoto as string
				});
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
		if (!selectedTeacher) return;
		const token = localStorage.getItem("authToken");
		try {
			const res = await fetch(`/api/admin/teachers/${selectedTeacher.id}`, {
				method: "DELETE",
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			
			if (data.success) {
				alert("Akun Guru berhasil dihapus.");
				handleBack();
				fetchTeachers();
			} else {
				alert(data.message);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan.");
		}
	};

	const openAddMode = () => {
		setSelectedTeacher(null);
		setIsEditing(false);
		setIsAdding(true);
	};

	const openDetailMode = (teacher: Teacher) => {
		setIsAdding(false);
		setIsEditing(false);
		setDeleteStep(0);
		setSelectedTeacher(teacher);
	};

	const handleBack = () => {
		setSelectedTeacher(null);
		setIsAdding(false);
		setIsEditing(false);
		setDeleteStep(0);
	};

	return (
		<>
			<style>
				{`
					.teacher-container { width: 100%; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
					.search-box { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
					.search-input { flex: 1; min-width: 200px; padding: 0.875rem; border-radius: 6px; border: 1px solid #d1d5db; outline: none; font-size: 1rem; background-color: #f9fafb; }
					.search-input:focus { border-color: #3b82f6; background-color: white; }
					.btn-primary { padding: 0.875rem 1.5rem; background-color: #111827; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
					.btn-primary:hover { background-color: #374151; }
					.btn-success { background-color: #10b981; }
					.btn-success:hover { background-color: #059669; }
					.btn-back { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 1.5rem; transition: all 0.2s; }
					.btn-back:hover { background-color: #e5e7eb; }
					.name-grid { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 1rem; }
					@media (max-width: 640px) { .name-grid { grid-template-columns: 1fr; } }
				`}
			</style>

			<div className="teacher-container">
				
				{/* HALAMAN 1: DAFTAR PENCARIAN GURU */}
				{!selectedTeacher && !isAdding && (
					<div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
							<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Direktori Guru & Staf</h2>
							<button onClick={openAddMode} className="btn-primary btn-success">
								+ Registrasi Guru Baru
							</button>
						</div>
						
						<div className="search-box">
							<input 
								type="text" 
								placeholder="Cari nama atau username..." 
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
								className="search-input"
							/>
							<button onClick={handleSearchClick} className="btn-primary">Cari Data</button>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
							{!hasSearched ? (
								<div style={{ textAlign: 'center', color: '#6b7280', padding: '3rem 1rem', backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '8px' }}>
									Masukkan nama atau username lalu klik tombol Cari.
								</div>
							) : searchResults.length === 0 ? (
								<div style={{ textAlign: 'center', color: '#ef4444', padding: '2rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '500' }}>
									Tidak ada guru yang cocok dengan pencarian Anda.
								</div>
							) : (
								searchResults.map(teacher => (
									<button 
										key={teacher.id}
										onClick={() => openDetailMode(teacher)}
										style={{ 
											display: 'flex', alignItems: 'center', gap: '1.25rem',
											textAlign: 'left', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb',
											backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.2s',
											boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
										}}
									>
										{teacher.photo_url ? (
											<img src={teacher.photo_url} alt="Foto" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} />
										) : (
											<div style={{ flexShrink: 0, width: '50px', height: '50px', backgroundColor: '#1f2937', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
												{teacher.full_name.charAt(0).toUpperCase()}
											</div>
										)}
										<div>
											<div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1.125rem' }}>{formatName(teacher)}</div>
											<div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Username: <strong>{teacher.username}</strong></div>
										</div>
									</button>
								))
							)}
						</div>
					</div>
				)}

				{/* HALAMAN 2: TAMBAH GURU BARU */}
				{isAdding && (
					<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
						<button onClick={handleBack} className="btn-back">⬅ Kembali ke Direktori</button>
						
						<form ref={formRef} onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
							<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem' }}>Registrasi Akun Guru</h3>
							
							<div>
								<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Struktur Nama</label>
								<div className="name-grid">
									<input type="text" name="front_title" placeholder="Gelar Depan (Opsional)" className="search-input" />
									<input type="text" name="full_name" placeholder="Nama Inti (Wajib)" required className="search-input" style={{ backgroundColor: 'white', borderColor: '#9ca3af' }} />
									<input type="text" name="back_title" placeholder="Gelar Belakang (Opsional)" className="search-input" />
								</div>
								<p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>Contoh: [Drs.] [Budi Santoso] [S.Pd.]</p>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Upload Foto Profil (Opsional)</label>
								<input type="file" name="photo" accept="image/jpeg, image/png" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px' }} />
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
								<div>
									<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Username Login</label>
									<input type="text" name="username" required className="search-input" placeholder="Tanpa spasi (Misal: budi.s)" style={{ width: '100%' }} />
								</div>

								<div>
									<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Kata Sandi Awal</label>
									<input type="password" name="password" required className="search-input" placeholder="Minimal 6 karakter" style={{ width: '100%' }} />
								</div>
							</div>

							<button type="submit" disabled={isLoading} className="btn-primary btn-success" style={{ marginTop: '1rem', width: '100%' }}>
								{isLoading ? 'Memproses...' : 'Simpan Akun Guru'}
							</button>
						</form>
					</div>
				)}

				{/* HALAMAN 3: DETAIL & EDIT GURU */}
				{selectedTeacher && !isAdding && (
					<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
						<button onClick={handleBack} className="btn-back">⬅ Kembali ke Hasil Pencarian</button>

						{/* TAMPILAN DETAIL */}
						{!isEditing ? (
							<div>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
									<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Informasi Akun Guru</h3>
									<button onClick={() => setIsEditing(true)} style={{ padding: '0.6rem 1.25rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✏️ Edit & Reset Password</button>
								</div>

								<div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
									{/* Info Profil Utama */}
									<div style={{ flex: '1 1 300px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
										{selectedTeacher.photo_url ? (
											<img src={selectedTeacher.photo_url} alt="Foto Profil" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '16px', flexShrink: 0, border: '1px solid #d1d5db' }} />
										) : (
											<div style={{ width: '100px', height: '100px', backgroundColor: '#1f2937', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2.5rem', flexShrink: 0 }}>
												{selectedTeacher.full_name.charAt(0).toUpperCase()}
											</div>
										)}
										<div>
											<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Nama Resmi Beserta Gelar</p>
											<p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>{formatName(selectedTeacher)}</p>
											<p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>ID Registrasi Sistem</p>
											<code style={{ backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '6px', fontSize: '0.875rem', color: '#374151', wordBreak: 'break-all', display: 'inline-block' }}>{selectedTeacher.id}</code>
										</div>
									</div>

									{/* Panel Kredensial Login */}
									<div style={{ flex: '1 1 250px', backgroundColor: '#eff6ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
										<p style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Akses Scanner Absensi</p>
										<div style={{ marginBottom: '1rem' }}>
											<p style={{ fontSize: '0.875rem', color: '#60a5fa', marginBottom: '0.25rem' }}>Username</p>
											<p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1d4ed8' }}>{selectedTeacher.username}</p>
										</div>
										<div>
											<p style={{ fontSize: '0.875rem', color: '#60a5fa', marginBottom: '0.25rem' }}>Status Akun</p>
											<span style={{ backgroundColor: '#dcfce3', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>Aktif</span>
										</div>
									</div>
								</div>

								{/* ZONA BERBAHAYA (Tetap sama) */}
								<div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #fca5a5', backgroundColor: '#fef2f2', padding: '1.5rem', borderRadius: '8px' }}>
									<h4 style={{ color: '#991b1b', fontWeight: 'bold', marginBottom: '0.5rem' }}>Zona Berbahaya (Cabut Akses)</h4>
									<p style={{ fontSize: '0.875rem', color: '#b91c1c', marginBottom: '1.5rem' }}>Mencabut akses akan membuat guru ini tidak bisa login ke Scanner. Data absensi yang pernah mereka rekam tetap aman.</p>
									{deleteStep === 0 && <button onClick={handleInitiateDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cabut Akses Akun</button>}
									{deleteStep === 1 && (
										<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
											<button onClick={handleInitiateDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Lanjut: Cabut Akses?</button>
											<button onClick={cancelDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
										</div>
									)}
									{deleteStep === 2 && (
										<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
											<button onClick={handleInitiateDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#7f1d1d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>KONFIRMASI FINAL: Hapus Akses!</button>
											<button onClick={cancelDelete} style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
										</div>
									)}
								</div>
							</div>
						) : (
							/* TAMPILAN EDIT */
							<form ref={formRef} onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem' }}>
									<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Informasi & Kredensial</h3>
									<button type="button" onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Batal Edit</button>
								</div>
								
								<div>
									<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Struktur Nama</label>
									<div className="name-grid">
										<input type="text" name="front_title" defaultValue={selectedTeacher.front_title || ""} placeholder="Gelar Depan" className="search-input" />
										<input type="text" name="full_name" defaultValue={selectedTeacher.full_name} required placeholder="Nama Inti (Wajib)" className="search-input" style={{ backgroundColor: 'white', borderColor: '#9ca3af' }} />
										<input type="text" name="back_title" defaultValue={selectedTeacher.back_title || ""} placeholder="Gelar Belakang" className="search-input" />
									</div>
								</div>

								<div>
									<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Update Foto (Biarkan kosong jika tidak berubah)</label>
									<input type="file" name="photo" accept="image/jpeg, image/png" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px' }} />
								</div>

								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
									<div>
										<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Username Login</label>
										<input type="text" name="username" defaultValue={selectedTeacher.username} required className="search-input" style={{ width: '100%' }} />
									</div>

									<div>
										<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Reset Kata Sandi</label>
										<input type="password" name="password" className="search-input" placeholder="Kosongkan jika tidak ingin diubah" style={{ width: '100%' }} />
									</div>
								</div>

								<button type="submit" disabled={isLoading} className="btn-primary" style={{ backgroundColor: '#3b82f6', marginTop: '1rem', width: '100%' }}>
									{isLoading ? 'Menyimpan...' : 'Simpan Perubahan Data'}
								</button>
							</form>
						)}
					</div>
				)}
			</div>
		</>
	);
}