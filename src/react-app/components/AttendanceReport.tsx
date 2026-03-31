import { useState, useEffect } from "react";

type AttendanceRecord = {
	id: string;
	full_name: string;
	check_in_time: number | null;
	check_out_time: number | null;
	status: string;
};

export default function AttendanceReport() {
	const [records, setRecords] = useState<AttendanceRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [todayDate, setTodayDate] = useState("");

	const fetchAttendance = async () => {
		try {
			const token = localStorage.getItem("authToken");
			const response = await fetch("/api/admin/attendance/today", {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const result = await response.json();
			
			if (result.success) {
				setRecords(result.data);
				// Format tanggal YYYY-MM-DD menjadi format lokal untuk ditampilkan
				const dateObj = new Date(result.date);
				setTodayDate(dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
			}
		} catch (error) {
			console.error("Gagal mengambil data absensi:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// Ambil data pertama kali komponen dimuat
		fetchAttendance();
		
		// Set interval untuk refresh otomatis setiap 30 detik (Standar Real-time Monitoring)
		const interval = setInterval(fetchAttendance, 30000);
		return () => clearInterval(interval); // Bersihkan memori saat pindah menu
	}, []);

	// Fungsi konversi UNIX Timestamp ke Jam:Menit
	const formatTime = (timestamp: number | null) => {
		if (!timestamp) return "-";
		const date = new Date(timestamp * 1000);
		return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', timeZone: "Asia/Jakarta" });
	};

	// Pewarnaan status yang dinamis
	const getStatusBadge = (status: string) => {
		switch(status.toUpperCase()) {
			case 'HADIR': return <span style={{ backgroundColor: '#dcfce3', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>HADIR</span>;
			case 'TERLAMBAT': return <span style={{ backgroundColor: '#fef08a', color: '#a16207', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>TERLAMBAT</span>;
			default: return <span style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>{status}</span>;
		}
	};

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
				<div>
					<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Monitoring Absensi Harian</h2>
					<p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{todayDate || "Memuat tanggal..."}</p>
				</div>
				<button onClick={fetchAttendance} style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
					Refresh Data
				</button>
			</div>

			<div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
				<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
					<thead>
						<tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
							<th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Nama Siswa</th>
							<th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Waktu Masuk</th>
							<th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Waktu Keluar</th>
							<th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Status</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
									Memuat data absensi...
								</td>
							</tr>
						) : records.length === 0 ? (
							<tr>
								<td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
									Belum ada data absensi hari ini.
								</td>
							</tr>
						) : (
							records.map((record) => (
								<tr key={record.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
									<td style={{ padding: '1rem', fontWeight: '500', color: '#111827' }}>{record.full_name}</td>
									<td style={{ padding: '1rem', color: '#4b5563' }}>{formatTime(record.check_in_time)}</td>
									<td style={{ padding: '1rem', color: '#4b5563' }}>{formatTime(record.check_out_time)}</td>
									<td style={{ padding: '1rem' }}>{getStatusBadge(record.status)}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}