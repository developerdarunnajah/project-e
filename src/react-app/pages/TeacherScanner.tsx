import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

export default function TeacherScanner() {
	const navigate = useNavigate();
	
	// State untuk UI
	const [teacherName, setTeacherName] = useState("");
	const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [scanMessage, setScanMessage] = useState("");
	const [studentData, setStudentData] = useState<{ name: string, photo: string, status: string, time: string } | null>(null);
	
	// Gunakan useRef agar nilai isProcessing bisa dibaca di dalam fungsi kamera tanpa me-render ulang kamera
	const isProcessingRef = useRef(false);

	useEffect(() => {
		// Ambil nama guru dari local storage
		const name = localStorage.getItem("userName");
		if (name) setTeacherName(name);

		// Inisialisasi Kamera Scanner
		const scanner = new Html5QrcodeScanner(
			"reader",
			{ 
				fps: 10, 
				qrbox: { width: 250, height: 250 },
				aspectRatio: 1.0 
			},
			/* verbose= */ false
		);

		const onScanSuccess = async (decodedText: string) => {
			// Jika sedang memproses data lain, abaikan scan ini
			if (isProcessingRef.current) return;
			
			isProcessingRef.current = true;
			setScanStatus('idle');
			setStudentData(null);

			try {
				const token = localStorage.getItem("authToken");
				const response = await fetch("/api/scan", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${token}`
					},
					body: JSON.stringify({ qr_identifier: decodedText })
				});

				const data = await response.json();

				if (data.success) {
					setScanStatus('success');
					setScanMessage(data.message);
					setStudentData(data.student);
				} else {
					setScanStatus('error');
					setScanMessage(data.message);
				}
			} catch (error) {
				setScanStatus('error');
				setScanMessage("Terjadi kesalahan jaringan.");
			} finally {
				// Beri jeda 3 detik sebelum kamera bisa membaca QR lagi
				setTimeout(() => {
					isProcessingRef.current = false;
					setScanStatus('idle');
					setStudentData(null);
					setScanMessage("");
				}, 3000);
			}
		};

		const onScanFailure = (_error: any) => {
			// Abaikan error saat kamera tidak mendeteksi QR (karena akan terus berjalan tiap frame)
		};

		// Nyalakan kamera
		scanner.render(onScanSuccess, onScanFailure);

		// Matikan kamera secara otomatis jika guru pindah halaman/keluar
		return () => {
			scanner.clear().catch(console.error);
		};
	}, []);

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("userRole");
		localStorage.removeItem("userName");
		navigate("/", { replace: true });
	};

	return (
		<div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
			
			{/* HEADER */}
			<div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
				<div>
					<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Terminal Absensi</h1>
					<p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Petugas: {teacherName}</p>
				</div>
				<button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
					Tutup Sesi
				</button>
			</div>

			{/* AREA SCANNER & HASIL */}
			<div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
				
				{/* KOTAK KAMERA */}
				<div>
					<h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>Arahkan QR Code ke Kamera</h2>
					{/* Div 'reader' ini adalah tempat HTML5-QRCode menyisipkan kameranya */}
					<div id="reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e5e7eb' }}></div>
				</div>

				{/* PANEL NOTIFIKASI HASIL SCAN */}
				<div style={{ 
					minHeight: '150px', 
					padding: '1.5rem', 
					borderRadius: '8px', 
					display: 'flex', 
					flexDirection: 'column', 
					alignItems: 'center', 
					justifyContent: 'center',
					textAlign: 'center',
					backgroundColor: scanStatus === 'idle' ? '#f9fafb' : (scanStatus === 'success' ? '#dcfce3' : '#fee2e2'),
					border: `2px solid ${scanStatus === 'idle' ? '#e5e7eb' : (scanStatus === 'success' ? '#10b981' : '#ef4444')}`
				}}>
					
					{scanStatus === 'idle' && (
						<p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Menunggu pindaian kartu pelajar...</p>
					)}

					{scanStatus === 'error' && (
						<div style={{ color: '#b91c1c' }}>
							<svg style={{ width: '3rem', height: '3rem', margin: '0 auto 0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Akses Ditolak</h3>
							<p style={{ marginTop: '0.5rem' }}>{scanMessage}</p>
						</div>
					)}

					{scanStatus === 'success' && studentData && (
						<div style={{ color: '#15803d', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							{studentData.photo ? (
								<img src={studentData.photo} alt="Foto Siswa" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b981', marginBottom: '1rem' }} />
							) : (
								<div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1rem' }}>
									{studentData.name.charAt(0)}
								</div>
							)}
							<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{studentData.name}</h3>
							<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
								<span style={{ backgroundColor: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold' }}>
									{studentData.status}
								</span>
								<span style={{ backgroundColor: 'white', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', border: '1px solid #10b981' }}>
									{studentData.time}
								</span>
							</div>
							<p style={{ marginTop: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>{scanMessage}</p>
						</div>
					)}
				</div>

			</div>
		</div>
	);
}