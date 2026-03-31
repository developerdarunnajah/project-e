import { useState, useEffect } from "react";

// Struktur data default untuk 7 hari (1 = Senin, 7 = Minggu)
const defaultRules = [
	{ day_of_week: 1, name: "Senin", check_in_start: "06:00", check_in_end: "07:15", check_out_start: "14:00", check_out_end: "16:00" },
	{ day_of_week: 2, name: "Selasa", check_in_start: "06:00", check_in_end: "07:15", check_out_start: "14:00", check_out_end: "16:00" },
	{ day_of_week: 3, name: "Rabu", check_in_start: "06:00", check_in_end: "07:15", check_out_start: "14:00", check_out_end: "16:00" },
	{ day_of_week: 4, name: "Kamis", check_in_start: "06:00", check_in_end: "07:15", check_out_start: "14:00", check_out_end: "16:00" },
	{ day_of_week: 5, name: "Jumat", check_in_start: "06:00", check_in_end: "07:15", check_out_start: "11:30", check_out_end: "13:00" },
	{ day_of_week: 6, name: "Sabtu", check_in_start: "00:00", check_in_end: "00:00", check_out_start: "00:00", check_out_end: "00:00" }, // Libur
	{ day_of_week: 7, name: "Minggu", check_in_start: "00:00", check_in_end: "00:00", check_out_start: "00:00", check_out_end: "00:00" }, // Libur
];

export default function AttendanceRules() {
	const [rules, setRules] = useState(defaultRules);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState({ type: "", text: "" });

	// Mengambil data aturan dari server saat pertama kali dimuat
	useEffect(() => {
		const fetchRules = async () => {
			try {
				const token = localStorage.getItem("authToken");
				const response = await fetch("/api/admin/rules", {
					headers: { "Authorization": `Bearer ${token}` }
				});
				const result = await response.json();
				
				if (result.success && result.data.length > 0) {
					// Gabungkan data dari database dengan nama hari agar UI rapi
					const mergedRules = defaultRules.map(dr => {
						const dbRule = result.data.find((r: any) => r.day_of_week === dr.day_of_week);
						return dbRule ? { ...dr, ...dbRule } : dr;
					});
					setRules(mergedRules);
				}
			} catch (error) {
				console.error("Gagal memuat aturan:", error);
			}
		};
		fetchRules();
	}, []);

	const handleChange = (dayIndex: number, field: string, value: string) => {
		const newRules = [...rules];
		(newRules[dayIndex] as any)[field] = value;
		setRules(newRules);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage({ type: "", text: "" });

		try {
			const token = localStorage.getItem("authToken");
			const response = await fetch("/api/admin/rules", {
				method: "POST",
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
				body: JSON.stringify({ rules })
			});
			const result = await response.json();

			if (!response.ok || !result.success) {
				setMessage({ type: "error", text: result.message || "Gagal menyimpan aturan." });
				return;
			}
			setMessage({ type: "success", text: result.message });
		} catch (error) {
			setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
			<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Aturan Jam Absensi</h2>
			<p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>Atur rentang waktu (jam & menit) kapan siswa diizinkan melakukan pemindaian (Scan) kartu.</p>
			
			{message.text && (
				<div style={{ padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce3', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
					{message.text}
				</div>
			)}

			<form onSubmit={handleSave}>
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
						<thead>
							<tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
								<th style={{ padding: '1rem', fontWeight: '600' }}>Hari</th>
								<th style={{ padding: '1rem', fontWeight: '600' }}>Mulai Masuk (Check-In)</th>
								<th style={{ padding: '1rem', fontWeight: '600' }}>Batas Terlambat</th>
								<th style={{ padding: '1rem', fontWeight: '600' }}>Mulai Pulang (Check-Out)</th>
								<th style={{ padding: '1rem', fontWeight: '600' }}>Batas Pulang</th>
							</tr>
						</thead>
						<tbody>
							{rules.map((rule, index) => (
								<tr key={rule.day_of_week} style={{ borderBottom: '1px solid #e5e7eb' }}>
									<td style={{ padding: '1rem', fontWeight: 'bold', color: '#374151' }}>{rule.name}</td>
									<td style={{ padding: '0.5rem 1rem' }}>
										<input type="time" value={rule.check_in_start} onChange={(e) => handleChange(index, 'check_in_start', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} required />
									</td>
									<td style={{ padding: '0.5rem 1rem' }}>
										<input type="time" value={rule.check_in_end} onChange={(e) => handleChange(index, 'check_in_end', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} required />
									</td>
									<td style={{ padding: '0.5rem 1rem' }}>
										<input type="time" value={rule.check_out_start} onChange={(e) => handleChange(index, 'check_out_start', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} required />
									</td>
									<td style={{ padding: '0.5rem 1rem' }}>
										<input type="time" value={rule.check_out_end} onChange={(e) => handleChange(index, 'check_out_end', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} required />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
					<button type="submit" disabled={isLoading} style={{ padding: '0.75rem 2rem', backgroundColor: isLoading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
						{isLoading ? "Menyimpan ke Database..." : "Simpan Aturan Jam"}
					</button>
				</div>
			</form>
		</div>
	);
}