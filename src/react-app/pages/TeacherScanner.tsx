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
	
	// State Navigasi Profil
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	
	// Mengambil nama dari localStorage. Pastikan backend Login Anda mengirimkan nama lengkap + gelar.
	const userName = localStorage.getItem("userName") || "Guru";
	const userRole = localStorage.getItem("userRole") || "GURU";
	const initial = userName.charAt(0).toUpperCase();

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
					setVerifyData(data); 
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

	// --- FUNGSI KONFIRMASI ---
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

	const closeModal = () => {
		setVerifyData(null);
		setIsProcessing(false);
		setError("");
		setTimeout(() => { isScanningRef.current = true; }, 1000); 
	};

	return (
		<div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
			
			{/* NAVBAR DENGAN PROFIL TERBUKA */}
			<header style={{ padding: '1rem', backgroundColor: '#111827', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 40 }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
					<div style={{ width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
						📸
					</div>
					{/* Disembunyikan di HP layar sangat kecil agar nama profil muat */}
					<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, display: window.innerWidth < 400 ? 'none' : 'block' }}>Beranda</h1>
				</div>

				<div style={{ position: 'relative' }}>
					{/* Tombol Profil Navbar (Nama & Gelar Langsung Tampil) */}
					<button 
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}
					>
						<div style={{ textAlign: 'right' }}>
							<div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{userName}</div>
							<div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'capitalize' }}>{userRole === "ADMIN" ? "Administrator" : "Guru"}</div>
						</div>
						
						<div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem', border: '2px solid #6366f1', flexShrink: 0 }}>
							{initial}
						</div>
						<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
					</button>

					{/* Overlay transparan */}
					{isMenuOpen && (
						<div 
							onClick={() => setIsMenuOpen(false)} 
							style={{ position: 'fixed', inset: 0, zIndex: 40 }}
						/>
					)}

					{/* Dropdown Menu (Hanya Tombol Aksi) */}
					{isMenuOpen && (
						<div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.75rem', width: '220px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 50, border: '1px solid #e5e7eb' }}>
							
							{userRole === "ADMIN" && (
								<button 
									onClick={() => navigate("/admin")} 
									style={{ width: '100%', textAlign: 'left', padding: '1rem', background: 'none', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', color: '#374151', fontWeight: '600', transition: 'background 0.2s' }}
									onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
									onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
								>
									⚙️ Menuju Dasbor Admin
								</button>
							)}
							
							<button 
								onClick={() => { localStorage.clear(); navigate("/"); }} 
								style={{ width: '100%', textAlign: 'left', padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold', transition: 'background 0.2s' }}
								onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
								onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
							>
								🚪 Keluar Sistem (Logout)
							</button>
						</div>
					)}
				</div>
			</header>

			{/* KAMERA SCANNER */}
			<main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
					<h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem', color: '#1f2937' }}>QR CODE SCAN</h2>
					
					<div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
					
					{error && (
						<div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
							{error}
						</div>
					)}
				</div>
			</main>

			{/* MODAL KONFIRMASI SIMPEL */}
			{verifyData && (
				<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
					<div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
						
						{/* Header Dinamis */}
						<div style={{ 
							padding: '1.5rem', textAlign: 'center', color: 'white',
							backgroundColor: verifyData.action === "MASUK" ? '#2563eb' : (verifyData.action === "PULANG" ? '#16a34a' : '#9333ea') 
						}}>
							<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, letterSpacing: '0.05em' }}>
								KONFIRMASI {verifyData.action}
							</h3>
							{verifyData.event_name && <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontWeight: '500' }}>Acara: {verifyData.event_name}</p>}
						</div>

						{/* Profil Data */}
						<div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							{verifyData.photo ? (
								<img src={verifyData.photo} alt="Foto" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '4px solid #f3f4f6', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
							) : (
								<div style={{ width: '100px', height: '100px', backgroundColor: '#1f2937', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
									{verifyData.name.charAt(0).toUpperCase()}
								</div>
							)}
							
							<div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{verifyData.role}</div>
							<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0.25rem 0 1.25rem 0', textAlign: 'center' }}>{verifyData.name}</h2>
							
							<span style={{ 
								padding: '0.5rem 1.25rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold',
								backgroundColor: verifyData.status === "TERLAMBAT" ? '#fef2f2' : '#f0fdf4',
								color: verifyData.status === "TERLAMBAT" ? '#dc2626' : '#16a34a',
								border: `1px solid ${verifyData.status === "TERLAMBAT" ? '#fecaca' : '#bbf7d0'}`,
								boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
							}}>
								Status Sistem: {verifyData.status}
							</span>
						</div>

						{/* Tombol Eksekusi */}
						<div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
							<button 
								onClick={closeModal} 
								disabled={isProcessing}
								style={{ flex: 1, padding: '0.875rem', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
								onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
								onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
							>
								Batalkan
							</button>
							<button 
								onClick={handleConfirm} 
								disabled={isProcessing}
								style={{ flex: 1, padding: '0.875rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
								onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
								onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
							>
								{isProcessing ? 'Memproses...' : 'Simpan Data'}
							</button>
						</div>

					</div>
				</div>
			)}
		</div>
	);
}