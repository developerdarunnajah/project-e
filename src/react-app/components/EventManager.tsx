import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface SchoolEvent {
	id: string;
	name: string;
	description?: string;
	qr_token: string;
	date: string; 
}

export default function EventManager() {
	const [events, setEvents] = useState<SchoolEvent[]>([]);
	const [isAdding, setIsAdding] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Ambil daftar acara dari database
	const fetchEvents = async () => {
		const token = localStorage.getItem("authToken");
		try {
			const res = await fetch("/api/admin/events", {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) setEvents(data.data);
		} catch (err) {
			console.error("Gagal memuat acara", err);
		}
	};

	useEffect(() => {
		fetchEvents();
	}, []);

	// Logika Pembuatan Acara Baru
	const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		
		const formData = new FormData(e.currentTarget);
		const payload = Object.fromEntries(formData.entries());
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch("/api/admin/events", {
				method: "POST",
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
				body: JSON.stringify(payload)
			});
			const data = await res.json();
			if (data.success) {
				alert("Acara berhasil dibuat!");
				setIsAdding(false);
				fetchEvents(); // Muat ulang daftar acara
			} else {
				alert(data.message);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan.");
		} finally {
			setIsLoading(false);
		}
	};

	// Logika Penghapusan Acara
	const handleDelete = async (id: string) => {
		if (!confirm("Peringatan: Hapus acara ini dan semua rekam jejak kehadirannya?")) return;
		const token = localStorage.getItem("authToken");
		
		try {
			const res = await fetch(`/api/admin/events/${id}`, {
				method: "DELETE",
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				fetchEvents();
				setSelectedEvent(null);
			} else {
				alert(data.message);
			}
		} catch (err) {
			alert("Gagal menghapus.");
		}
	};

	// Logika Unduh Gambar QR Code
	const downloadEventQR = async (event: SchoolEvent) => {
		try {
			const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${event.qr_token}`;
			const response = await fetch(qrUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `QR-Acara-${event.name.replace(/\s+/g, '-')}.png`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			alert("Gagal mengunduh QR Code.");
		}
	};

	// Logika Unduh Laporan Excel
	const downloadEventRecap = async (event: SchoolEvent) => {
		setIsLoading(true);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch(`/api/admin/events/${event.id}/recap`, {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const resData = await res.json();

			if (!resData.success) {
				alert(resData.message);
				setIsLoading(false);
				return;
			}

			if (resData.data.length === 0) {
				alert("Belum ada data kehadiran untuk acara ini.");
				setIsLoading(false);
				return;
			}

			// Menyusun Header Excel
			const sheetData = [
				[`Laporan Kehadiran: ${event.name}`], 
				[`Tanggal Acara: ${event.date}`],
				[], 
				["No", "Nama Guru / Staf", "Waktu Kehadiran", "Status"] 
			];

			// Memasukkan Data ke Baris
			resData.data.forEach((row: any, index: number) => {
				const front = row.front_title ? `${row.front_title} ` : "";
				const back = row.back_title ? `, ${row.back_title}` : "";
				const fullName = `${front}${row.full_name}${back}`;
				
				// Konversi Timestamp murni ke Jam WIB (Terkunci ke Asia/Jakarta)
				const d = new Date(row.scanned_at * 1000);
				const timeStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });

				sheetData.push([String(index + 1), fullName, timeStr, row.status]);
			});

			// Menyusun file Excel .xlsx
			const wb = XLSX.utils.book_new();
			const ws = XLSX.utils.aoa_to_sheet(sheetData);
			
			// Merapikan lebar kolom di dalam Excel
			ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 20 }, { wch: 15 }];
			
			XLSX.utils.book_append_sheet(wb, ws, "Kehadiran Acara");
			XLSX.writeFile(wb, `Kehadiran_${event.name.replace(/\s+/g, '_')}_${event.date}.xlsx`);

		} catch (err) {
			alert("Gagal menyusun data Excel.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: '900px', margin: '0 auto' }}>
			
			{/* HALAMAN 1: DAFTAR ACARA */}
			{!isAdding && !selectedEvent && (
				<div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
						<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manajemen Acara Guru</h2>
						<button onClick={() => setIsAdding(true)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
							+ Buat Acara Baru
						</button>
					</div>

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
						{events.length === 0 ? (
							<div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
								<p style={{ color: '#6b7280' }}>Belum ada acara yang dijadwalkan.</p>
							</div>
						) : (
							events.map(event => (
								<div key={event.id} onClick={() => setSelectedEvent(event)} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
									<div style={{ color: '#9333ea', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tanggal: {event.date}</div>
									<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>{event.name}</h3>
									<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lihat detail & laporan ➔</div>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* HALAMAN 2: FORM TAMBAH ACARA */}
			{isAdding && (
				<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
					<button type="button" onClick={() => setIsAdding(false)} style={{ marginBottom: '1.5rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6b7280', fontWeight: 'bold' }}>⬅ Kembali ke Daftar</button>
					
					<form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '2px solid #f3f4f6', paddingBottom: '1rem' }}>Buat Acara Baru</h3>
						
						<div>
							<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Nama Acara / Kegiatan</label>
							<input type="text" name="name" required placeholder="Misal: Rapat Pleno Kelulusan Tahun 2026" style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }} />
						</div>
						
						{/* Tambahan Input Deskripsi sesuai Skema Database */}
						<div>
							<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Deskripsi (Opsional)</label>
							<textarea name="description" placeholder="Penjelasan singkat mengenai acara atau agenda rapat..." rows={3} style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', resize: 'none' }} />
						</div>
						
						<div>
							<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>Tanggal Pelaksanaan</label>
							<input type="date" name="date" required style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }} />
						</div>
						
						<button type="submit" disabled={isLoading} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
							{isLoading ? 'Menyimpan...' : 'Terbitkan Acara & Buat QR Code'}
						</button>
					</form>
				</div>
			)}

			{/* HALAMAN 3: DETAIL ACARA & QR CODE */}
			{selectedEvent && (
				<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
					<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
						<button type="button" onClick={() => setSelectedEvent(null)} style={{ marginBottom: '1.5rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6b7280', fontWeight: 'bold' }}>⬅ Kembali ke Daftar</button>
					</div>
					
					<h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>{selectedEvent.name}</h2>
					
					{selectedEvent.description && (
						<p style={{ color: '#4b5563', marginBottom: '1rem', maxWidth: '600px', margin: '0 auto 1rem auto' }}>{selectedEvent.description}</p>
					)}
					
					<p style={{ color: '#6b7280', marginBottom: '2rem', fontWeight: 'bold' }}>Pelaksanaan: {selectedEvent.date}</p>

					{/* Container Gambar QR */}
					<div style={{ display: 'inline-block', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '16px', border: '2px dashed #d1d5db', marginBottom: '2.5rem' }}>
						<img 
							src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedEvent.qr_token}`} 
							alt="QR Acara" 
							style={{ width: '250px', height: '250px', display: 'block', margin: '0 auto' }}
						/>
						<div style={{ marginTop: '1rem', fontWeight: 'bold', color: '#374151', letterSpacing: '0.1em' }}>
							{selectedEvent.qr_token}
						</div>
					</div>

					{/* Tombol Aksi */}
					<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
						<button onClick={() => downloadEventQR(selectedEvent)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
							⬇ Unduh Gambar QR
						</button>
						
						<button 
							onClick={() => downloadEventRecap(selectedEvent)} 
							disabled={isLoading}
							style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}
						>
							{isLoading ? 'Menyusun Laporan...' : '📊 Ekstrak Excel Kehadiran'}
						</button>

						<button onClick={() => handleDelete(selectedEvent.id)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
							Hapus Acara
						</button>
					</div>
				</div>
			)}
		</div>
	);
}