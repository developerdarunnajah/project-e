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
	
	// State Modal & Data Verifikasi
	const [verifyData, setVerifyData] = useState<VerifyResult | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	
	const isScanningRef = useRef(true); 

	useEffect(() => {
		const scanner = new Html5QrcodeScanner("reader", { 
			fps: 10, 
			qrbox: { width: 250, height: 250 },
			aspectRatio: 1.0
		}, false);

		const onScanSuccess = async (decodedText: string) => {
			if (!isScanningRef.current) return;
			
			isScanningRef.current = false;
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
					setVerifyData(data); // Membuka pop-up konfirmasi
				} else {
					setError(data.message);
					setTimeout(() => { setError(""); isScanningRef.current = true; }, 3000); 
				}
			} catch (err) {
				setError("Terjadi kesalahan jaringan atau server tidak merespons.");
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
				body: JSON.stringify({ qr_identifier: verifyData.qr })
			});
			const data = await res.json();

			if (data.success) {
				alert(`✅ Berhasil: Data absensi tersimpan.`);
				closeModal();
			} else {
				alert(`❌ Gagal: ${data.message}`);
				setIsProcessing(false);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan saat menyimpan data.");
			setIsProcessing(false);
		}
	};

	// --- FUNGSI BATAL ---
	const closeModal = () => {
		setVerifyData(null);
		setIsProcessing(false);
		setError("");
		setTimeout(() => { isScanningRef.current = true; }, 1000); 
	};

	const userRole = localStorage.getItem("userRole");

	return (
		<div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
			
			{/* NAVBAR */}
			<header style={{ padding: '1rem 1.5rem', backgroundColor: '#111827', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Sistem Pemindai</h1>
				<div style={{ display: 'flex', gap: '1rem' }}>
					{userRole === "ADMIN" && (
						<button onClick={() => navigate("/admin")} style={{ padding: '0.5rem 1rem', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Dasbor Admin</button>
					)}
					<button onClick={() => { localStorage.clear(); navigate("/"); }} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Keluar</button>
				</div>
			</header>

			{/* KAMERA SCANNER */}
			<main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
					<h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem', color: '#1f2937' }}>Arahkan QR Code ke Kamera</h2>
					
					<div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
					
					{error && (
						<div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold' }}>
							{error}
						</div>
					)}
				</div>
			</main>

			{/* MODAL KONFIRMASI SIMPEL */}
			{verifyData && (
				<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
					<div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
						
						{/* Header Dinamis */}
						<div style={{ 
							padding: '1.5rem', textAlign: 'center', color: 'white',
							backgroundColor: verifyData.action === "MASUK" ? '#2563eb' : (verifyData.action === "PULANG" ? '#16a34a' : '#9333ea') 
						}}>
							<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
								KONFIRMASI {verifyData.action}
							</h3>
							{verifyData.event_name && <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Acara: {verifyData.event_name}</p>}
						</div>

						{/* Profil Data */}
						<div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							{verifyData.photo ? (
								<img src={verifyData.photo} alt="Foto" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #f3f4f6', marginBottom: '1rem' }} />
							) : (
								<div style={{ width: '100px', height: '100px', backgroundColor: '#1f2937', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
									{verifyData.name.charAt(0).toUpperCase()}
								</div>
							)}
							
							<div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{verifyData.role}</div>
							<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0.25rem 0 1rem 0', textAlign: 'center' }}>{verifyData.name}</h2>
							
							<span style={{ 
								padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold',
								backgroundColor: verifyData.status === "TERLAMBAT" ? '#fef2f2' : '#f0fdf4',
								color: verifyData.status === "TERLAMBAT" ? '#dc2626' : '#16a34a',
								border: `1px solid ${verifyData.status === "TERLAMBAT" ? '#fecaca' : '#bbf7d0'}`
							}}>
								Status: {verifyData.status}
							</span>
						</div>

						{/* Tombol Eksekusi */}
						<div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
							<button 
								onClick={closeModal} 
								disabled={isProcessing}
								style={{ flex: 1, padding: '0.875rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
							>
								Batal
							</button>
							<button 
								onClick={handleConfirm} 
								disabled={isProcessing}
								style={{ flex: 1, padding: '0.875rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
							>
								{isProcessing ? 'Memproses...' : 'Konfirmasi Kehadiran'}
							</button>
						</div>

					</div>
				</div>
			)}
		</div>
	);
}