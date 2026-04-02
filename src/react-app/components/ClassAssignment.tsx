import { useState, useEffect } from "react";

interface Student { 
	id: string; 
	full_name: string; 
	class_id: number | null; 
	class_name: string | null;
}
interface ClassItem { id: number; name: string; }

export default function ClassAssignment() {
	const [students, setStudents] = useState<Student[]>([]);
	const [classes, setClasses] = useState<ClassItem[]>([]);
	
	const [activeMode, setActiveMode] = useState<'assign' | 'migrate'>('assign');
	
	const [sourceClass, setSourceClass] = useState(""); 
	const [targetClass, setTargetClass] = useState("");
	const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const fetchData = async () => {
		const token = localStorage.getItem("authToken");
		try {
			const [resStudents, resClasses] = await Promise.all([
				fetch("/api/admin/students", { headers: { "Authorization": `Bearer ${token}` } }),
				fetch("/api/admin/classes", { headers: { "Authorization": `Bearer ${token}` } })
			]);
			const dataStudents = await resStudents.json();
			const dataClasses = await resClasses.json();
			
			if (dataStudents.success) setStudents(dataStudents.data);
			if (dataClasses.success) setClasses(dataClasses.data);
		} catch (err) {
			console.error("Gagal memuat data awal", err);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		setSelectedStudents([]);
		setSourceClass("");
		setTargetClass("");
		setSearchQuery("");
	}, [activeMode]);

	const filteredStudents = students.filter(s => {
		const matchName = s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
		
		if (activeMode === 'assign') {
			return matchName && (s.class_id === null || s.class_id === undefined);
		} else {
			if (!sourceClass) return false; 
			// PERBAIKAN: Konversi sourceClass (string) menjadi Number agar sesuai dengan s.class_id
			return matchName && s.class_id === Number(sourceClass);
		}
	});

	const toggleStudent = (id: string) => {
		setSelectedStudents(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
	};

	const handleSelectAllFiltered = () => {
		const filteredIds = filteredStudents.map(s => s.id);
		const allSelected = filteredIds.every(id => selectedStudents.includes(id));
		if (allSelected) {
			setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
		} else {
			const newSelections = [...new Set([...selectedStudents, ...filteredIds])];
			setSelectedStudents(newSelections);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!targetClass || selectedStudents.length === 0) {
			return alert("Pilih Tujuan Kelas dan centang minimal 1 siswa.");
		}
		if (activeMode === 'migrate' && sourceClass === targetClass) {
			return alert("Kelas Asal dan Kelas Tujuan tidak boleh sama.");
		}
		
		setIsLoading(true);
		const token = localStorage.getItem("authToken");

		try {
			const res = await fetch("/api/admin/class-assign", {
				method: "POST",
				headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
				// PERBAIKAN: Konversi targetClass menjadi Number agar backend menerimanya sebagai Integer
				body: JSON.stringify({ target_class_id: Number(targetClass), student_ids: selectedStudents })
			});
			const data = await res.json();
			if (data.success) {
				alert(data.message);
				setSelectedStudents([]);
				fetchData(); 
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
		<div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
			
			<div style={{ paddingBottom: '1rem', borderBottom: '2px solid #f3f4f6' }}>
				<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Manajemen Plotting Kelas</h2>
				<p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Pilih mode di bawah ini sesuai dengan kebutuhan operasional sekolah.</p>
			</div>

			<div style={{ display: 'flex', gap: '1rem', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '8px' }}>
				<button 
					onClick={() => setActiveMode('assign')}
					style={{ flex: 1, padding: '0.875rem', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
						backgroundColor: activeMode === 'assign' ? 'white' : 'transparent',
						color: activeMode === 'assign' ? '#2563eb' : '#6b7280',
						boxShadow: activeMode === 'assign' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
					}}
				>
					Logika 1: Masukkan Siswa Baru
				</button>
				<button 
					onClick={() => setActiveMode('migrate')}
					style={{ flex: 1, padding: '0.875rem', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
						backgroundColor: activeMode === 'migrate' ? 'white' : 'transparent',
						color: activeMode === 'migrate' ? '#2563eb' : '#6b7280',
						boxShadow: activeMode === 'migrate' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
					}}
				>
					Logika 2: Mutasi / Kenaikan Kelas (A ke B)
				</button>
			</div>

			<form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
				
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
					
					{activeMode === 'migrate' && (
						<div>
							<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Kelas Asal (A)</label>
							<select 
								value={sourceClass} 
								onChange={(e) => { setSourceClass(e.target.value); setSelectedStudents([]); }} 
								style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
							>
								<option value="">-- Pilih Kelas Asal --</option>
								{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
							</select>
						</div>
					)}

					<div>
						<label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>{activeMode === 'migrate' ? 'Kelas Tujuan (B)' : 'Masukkan ke Kelas'}</label>
						<select 
							required 
							value={targetClass} 
							onChange={(e) => setTargetClass(e.target.value)} 
							style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #3b82f6', backgroundColor: 'white' }}
						>
							<option value="">-- Pilih Kelas Tujuan --</option>
							{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
						</select>
					</div>
				</div>

				<div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
						<h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Pilih Siswa ({selectedStudents.length} dipilih)</h3>
						<input type="text" placeholder="Cari nama siswa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', width: '250px' }} />
					</div>

					<div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
						<div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontWeight: 'bold', color: '#374151' }}>
								{activeMode === 'assign' ? "Siswa Belum Punya Kelas" : (sourceClass ? "Siswa dari Kelas Asal" : "Menunggu Pilihan Kelas Asal...")}
							</span>
							
							{filteredStudents.length > 0 && (
								<button type="button" onClick={handleSelectAllFiltered} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer' }}>
									{filteredStudents.every(s => selectedStudents.includes(s.id)) ? "Batal Pilih Semua" : "Pilih Semua"}
								</button>
							)}
						</div>
						
						<div style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: 'white', padding: '0.5rem' }}>
							{activeMode === 'migrate' && !sourceClass ? (
								<p style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>Silakan pilih Kelas Asal (A) terlebih dahulu.</p>
							) : filteredStudents.length === 0 ? (
								<p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
									{activeMode === 'assign' ? "Semua siswa sudah masuk ke dalam kelas." : "Tidak ada siswa di kelas ini."}
								</p>
							) : (
								filteredStudents.map(student => (
									<label key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', backgroundColor: selectedStudents.includes(student.id) ? '#eff6ff' : 'transparent', transition: 'background 0.2s' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
											<input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleStudent(student.id)} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
											<span style={{ fontWeight: '500', color: '#1f2937' }}>{student.full_name}</span>
										</div>
									</label>
								))
							)}
						</div>
					</div>
				</div>

				<button type="submit" disabled={isLoading} style={{ padding: '1rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.125rem', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
					{isLoading ? 'Memproses Data...' : (activeMode === 'assign' ? 'Plotting Siswa Baru' : 'Eksekusi Mutasi Kelas')}
				</button>

			</form>
		</div>
	);
}