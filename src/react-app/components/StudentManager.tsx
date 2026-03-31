import { useState, useRef, useEffect } from "react";

export default function StudentManager() {
	const [fullName, setFullName] = useState("");
	const [selectedFile, setSelectedFile] = useState<Blob | null>(null); // Menyimpan file binary hasil kompresi
	const [previewUrl, setPreviewUrl] = useState<string>(""); // Menyimpan URL sementara untuk pratinjau
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState({ type: "", text: "" });
	const [newStudentData, setNewStudentData] = useState<{name: string, qr_code_token: string, photo_url: string} | null>(null);
	
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Membersihkan memori browser dari URL pratinjau saat komponen ditutup
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	// --- FUNGSI KOMPRESI GAMBAR HD (TO BLOB) ---
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setMessage({ type: "error", text: "Harap unggah file gambar (.jpg, .png)" });
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				// Menaikkan batas resolusi menjadi 800px agar wajah tetap HD saat dicetak
				const MAX_WIDTH = 800; 
				let width = img.width;
				let height = img.height;

				if (width > MAX_WIDTH) {
					height = Math.round((height * MAX_WIDTH) / width);
					width = MAX_WIDTH;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext("2d");
				if (ctx) {
					ctx.drawImage(img, 0, 0, width, height);
					
					// Mengubah canvas menjadi File Binary (Blob) dengan kualitas 90%
					canvas.toBlob(
						(blob) => {
							if (blob) {
								setSelectedFile(blob);
								// Buat URL lokal sementara untuk pratinjau form
								const objectUrl = URL.createObjectURL(blob);
								setPreviewUrl(objectUrl);
							}
						},
						"image/jpeg",
						0.9 
					);
				}
			};
			if (event.target?.result) {
				img.src = event.target.result as string;
			}
		};
		reader.readAsDataURL(file);
	};

	// --- FUNGSI SUBMIT DENGAN FORMDATA ---
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage({ type: "", text: "" });
		setNewStudentData(null);

		try {
			const token = localStorage.getItem("authToken");
			
			// Menggunakan FormData untuk mengirim Teks + File sekaligus
			const formData = new FormData();
			formData.append("full_name", fullName);
			
			if (selectedFile) {
				// Tambahkan file dengan nama bawaan 'photo.jpg'
				formData.append("photo", selectedFile, "photo.jpg"); 
			}

			const response = await fetch("/api/admin/students", {
				method: "POST",
				headers: {
					// CATATAN PENTING: Jangan set Content-Type di sini. 
					// Browser akan otomatis men-setnya menjadi 'multipart/form-data' dengan boundary yang tepat.
					"Authorization": `Bearer ${token}`
				},
				body: formData
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				setMessage({ type: "error", text: result.message || "Gagal menambah data siswa." });
				return;
			}

			setMessage({ type: "success", text: "Data dan Foto berhasil disimpan ke R2!" });
			setNewStudentData(result.data);
			
			// Reset form
			setFullName("");
			setSelectedFile(null);
			setPreviewUrl("");
			if (fileInputRef.current) fileInputRef.current.value = "";

		} catch (error) {
			setMessage({ type: "error", text: "Terjadi kesalahan jaringan saat menghubungi server." });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>Manajemen Data Siswa (R2 Storage)</h2>
			
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
				{/* KOLOM KIRI: FORM */}
				<div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
					<h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Pendaftaran Siswa Baru</h3>
					
					{message.text && (
						<div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce3', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
							{message.text}
						</div>
					)}

					<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Nama Lengkap *</label>
							<input 
								type="text" 
								value={fullName} 
								onChange={(e) => setFullName(e.target.value)} 
								required 
								placeholder="Contoh: Budi Santoso"
								style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} 
							/>
						</div>
						
						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Pas Foto Siswa (Otomatis Kompresi HD)</label>
							<input 
								type="file" 
								accept="image/png, image/jpeg, image/jpg" 
								onChange={handleFileChange}
								ref={fileInputRef}
								style={{ width: '100%', padding: '0.5rem', border: '1px dashed #d1d5db', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white' }} 
							/>
							
							{previewUrl && (
								<div style={{ marginTop: '1rem', textAlign: 'center' }}>
									<p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>Pratinjau Foto:</p>
									<img src={previewUrl} alt="Preview" style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
								</div>
							)}
						</div>

						<button 
							type="submit" 
							disabled={isLoading} 
							style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: isLoading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}
						>
							{isLoading ? "Mengunggah ke R2..." : "Simpan & Buat QR Code"}
						</button>
					</form>
				</div>

				{/* KOLOM KANAN: ID CARD */}
				<div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
					{newStudentData ? (
						<div style={{ textAlign: 'center' }}>
							<h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Kartu Pelajar Siap Cetak</h3>
							
							{/* Menampilkan foto asli dari server R2 */}
							{newStudentData.photo_url && (
								<img src={newStudentData.photo_url} alt="Foto Siswa" style={{ width: '100px', height: '130px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem', border: '2px solid #e5e7eb' }} />
							)}

							<p style={{ marginBottom: '1rem', color: '#4b5563', fontSize: '1.1rem', fontWeight: 'bold' }}>{newStudentData.name}</p>
							
							<img 
								src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newStudentData.qr_code_token}`} 
								alt="QR Code Siswa" 
								style={{ border: '4px solid white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
							/>
							
							<p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#6b7280', wordBreak: 'break-all', backgroundColor: '#e5e7eb', padding: '0.5rem', borderRadius: '4px' }}>
								UUID: {newStudentData.qr_code_token}
							</p>
						</div>
					) : (
						<div style={{ textAlign: 'center', color: '#9ca3af' }}>
							<svg style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem auto', color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
							<p>Isi formulir di samping untuk mendaftarkan siswa.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}