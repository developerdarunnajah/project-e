import { useState, useEffect, useRef } from "react";

interface ClassItem {
	id: number;
	name: string;
}

export default function ClassManager() {
	const [classes, setClasses] = useState<ClassItem[]>([]);
	const [isAdding, setIsAdding] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);

	const fetchClasses = async () => {
		const token = localStorage.getItem("authToken");
		try {
			const res = await fetch("/api/admin/classes", {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				setClasses(data.data);
			}
		} catch (err) {
			console.error("Gagal memuat data kelas", err);
		}
	};

	useEffect(() => {
		fetchClasses();
	}, []);

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formRef.current) return;
		setIsLoading(true);

		const formData = new FormData(formRef.current);
		const dataObj = Object.fromEntries(formData.entries());
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch("/api/admin/classes", {
				method: "POST",
				headers: { 
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify(dataObj)
			});
			const data = await res.json();
			if (data.success) {
				alert("Kelas baru berhasil ditambahkan!");
				setIsAdding(false);
				fetchClasses();
			} else {
				alert(data.message);
			}
		} catch (err) {
			alert("Terjadi kesalahan jaringan.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: '800px', margin: '0 auto' }}>
			{!isAdding ? (
				<div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
						<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Master Data Kelas</h2>
						<button 
							onClick={() => setIsAdding(true)} 
							style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
						>
							+ Tambah Kelas
						</button>
					</div>

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
						{classes.length === 0 ? (
							<p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>Belum ada data kelas.</p>
						) : (
							classes.map((cls) => (
								<div key={cls.id} style={{ padding: '1.25rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
									<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{cls.name}</h3>
								</div>
							))
						)}
					</div>
				</div>
			) : (
				<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
					<button onClick={() => setIsAdding(false)} style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
						⬅ Kembali
					</button>

					<form ref={formRef} onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Tambah Kelas Baru</h3>
						
						<div>
							<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nama Kelas</label>
							<input type="text" name="name" required placeholder="Contoh: XII-RPL-1" style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
						</div>

						<button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
							{isLoading ? 'Menyimpan...' : 'Simpan Kelas'}
						</button>
					</form>
				</div>
			)}
		</div>
	);
}