import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

interface VerifyResult {
	action: string;
	role: string;
	name: string;
	photo?: string | null;
	status: string;
	event_name?: string;
	qr: string;
}

export default function TeacherScanner() {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [notes, setNotes] = useState("");
	
	// State Modal & Data Verifikasi
	const [verifyData, setVerifyData] = useState<VerifyResult | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	
	// Menggunakan Ref agar fungsi callback scanner selalu mendapatkan status terbaru tanpa re-render
	const isScanningRef = useRef(true); 

	useEffect(() => {
		const scanner = new Html5QrcodeScanner("reader", { 
			fps: 10, 
			qrbox: { width: 250, height: 250 },
			aspectRatio: 1.0
		}, false);

		const onScanSuccess = async (decodedText: string) => {
			// Jika sedang memproses/menampilkan modal, abaikan scan baru
			if (!isScanningRef.current) return;
			
			isScanningRef.current = false; // Jeda scanner secara logika
			setError("");

			const token = localStorage.getItem("authToken");
			try {
				const res = await fetch("/api/scan/verify", {
					method: "POST",
					headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
					body: JSON.stringify({ qr_identifier: decodedText })
				});
				const data = await res.json();

				if (data.success) {
					setVerifyData(data); // Membuka popup modal
				} else {
					setError(data.message);
					setTimeout(() => { setError(""); isScanningRef.current = true; }, 3000); // Resume scanner setelah 3 detik
				}
			} catch (err) {
				setError("Terjadi kesalahan jaringan.");
				setTimeout(() => { setError(""); isScanningRef.current = true; }, 3000);
			}
		};

		scanner.render(onScanSuccess, () => {});

		return () => {
			scanner.clear().catch(console.error);
		};
	}, []);

	// --- FUNGSI KONFIRMASI (SIMPAN KE DB) ---
	const handleConfirm = async () => {
		if (!verifyData) return;
		setIsProcessing(true);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch("/api/scan/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
				body: JSON.stringify({ qr_identifier: verifyData.qr, notes: notes })
			});
			const data = await res.json();

			if (data.success) {
				alert(`✅ Berhasil: ${data.action} - ${data.name}`);
				closeModal();
			} else {
				alert(`❌ Gagal: ${data.message}`);
				setIsProcessing(false);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan.");
			setIsProcessing(false);
		}
	};

	// --- FUNGSI BATAL ---
	const closeModal = () => {
		setVerifyData(null);
		setNotes("");
		setIsProcessing(false);
		setError("");
		// Beri jeda 1 detik sebelum kamera membaca lagi agar tidak tercetak dua kali tak sengaja
		setTimeout(() => { isScanningRef.current = true; }, 1000); 
	};

	const userRole = localStorage.getItem("userRole");

	return (
		<div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
			
			{/* NAVBAR ATAS */}
			<header style={{ padding: '1rem 1.5rem', backgroundColor: '#111827', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Terminal Scanner</h1>
				<div style={{ display: 'flex', gap: '1rem' }}>
					{userRole === "ADMIN" && (
						<button onClick={() => navigate("/admin")} style={{ padding: '0.5rem 1rem', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Dasbor Admin</button>
					)}
					<button onClick={() => { localStorage.clear(); navigate("/"); }} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Keluar</button>
				</div>
			</header>

			{/* AREA PEMINDAI UTAMA */}
			<main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
					<h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem', color: '#1f2937' }}>Arahkan QR Code ke Kamera</h2>
					
					{/* Kamera akan di-render di dalam div ini */}
					<div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
					
					{error && (
						<div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold' }}>
							{error}
						</div>
					)}
				</div>
			</main>

			{/* ======================================================== */}
			{/* MODAL KONFIRMASI (Tampil Saat QR Dikenali) */}
			{/* ======================================================== */}
			{verifyData && (
				<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
					<div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
						
						{/* Header Modal - Berubah Warna Sesuai Aksi */}
						<div style={{ 
							padding: '1.5rem', textAlign: 'center', color: 'white',
							backgroundColor: verifyData.action === "MASUK" ? '#2563eb' : (verifyData.action === "PULANG" ? '#16a34a' : '#9333ea') 
						}}>
							<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
								KONFIRMASI {verifyData.action}
							</h3>
							{verifyData.event_name && <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Acara: {verifyData.event_name}</p>}
						</div>

						{/* Konten Modal */}
						<div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							{verifyData.photo ? (
								<img src={verifyData.photo} alt="Foto" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #f3f4f6', marginBottom: '1rem' }} />
							) : (
								<div style={{ width: '100px', height: '100px', backgroundColor: '#1f2937', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
									{verifyData.name.charAt(0).toUpperCase()}
								</div>
							)}
							
							<div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{verifyData.role}</div>
							<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0.25rem 0 0.5rem 0', textAlign: 'center' }}>{verifyData.name}</h2>
							
							{/* Label Status Terlambat (merah) atau Hadir (hijau) */}
							<span style={{ 
								padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold',
								backgroundColor: verifyData.status === "TERLAMBAT" ? '#fef2f2' : '#f0fdf4',
								color: verifyData.status === "TERLAMBAT" ? '#dc2626' : '#16a34a',
								border: `1px solid ${verifyData.status === "TERLAMBAT" ? '#fecaca' : '#bbf7d0'}`
							}}>
								Status Sistem: {verifyData.status}
							</span>

							{/* Kolom Catatan (Hanya relevan untuk absen siswa) */}
							{verifyData.role === "SISWA" && (
								<div style={{ width: '100%', marginTop: '1.5rem' }}>
									<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Catatan Petugas (Opsional)</label>
									<textarea 
										value={notes} 
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Misal: Alasan terlambat..."
										rows={2}
										style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', resize: 'none' }}
									/>
								</div>
							)}
						</div>

						{/* Tombol Aksi */}
						<div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
							<button 
								onClick={closeModal} 
								disabled={isProcessing}
								style={{ flex: 1, padding: '0.875rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
							>
								Batalkan
							</button>
							<button 
								onClick={handleConfirm} 
								disabled={isProcessing}
								style={{ flex: 1, padding: '0.875rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
							>
								{isProcessing ? 'Menyimpan...' : 'Simpan Data'}
							</button>
						</div>

					</div>
				</div>
			)}

		</div>
	);
}