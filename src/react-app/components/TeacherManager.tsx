import { useState, useEffect } from "react";

type Teacher = {
	id: string;
	front_title: string | null;
	full_name: string;
	back_title: string | null;
	username: string;
};

export default function TeacherManager() {
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState({ type: "", text: "" });

	// Form State
	const [frontTitle, setFrontTitle] = useState("");
	const [fullName, setFullName] = useState("");
	const [backTitle, setBackTitle] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const fetchTeachers = async () => {
		try {
			const token = localStorage.getItem("authToken");
			const response = await fetch("/api/admin/teachers", {
				headers: { "Authorization": `Bearer ${token}` }
			});
			const result = await response.json();
			if (result.success) setTeachers(result.data);
		} catch (error) {
			console.error("Gagal mengambil data guru", error);
		}
	};

	useEffect(() => {
		fetchTeachers();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage({ type: "", text: "" });

		try {
			const token = localStorage.getItem("authToken");
			const response = await fetch("/api/admin/teachers", {
				method: "POST",
				headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
				body: JSON.stringify({
					front_title: frontTitle,
					full_name: fullName,
					back_title: backTitle,
					username: username,
					password: password
				})
			});
			const result = await response.json();

			if (!response.ok || !result.success) {
				setMessage({ type: "error", text: result.message || "Gagal menambah guru." });
				return;
			}

			setMessage({ type: "success", text: result.message });
			
			// Reset Form
			setFrontTitle("");
			setFullName("");
			setBackTitle("");
			setUsername("");
			setPassword("");
			
			// Refresh data
			fetchTeachers();
		} catch (error) {
			setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>Manajemen Data Guru</h2>
			
			{message.text && (
				<div style={{ padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce3', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
					{message.text}
				</div>
			)}

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
				{/* Kolom Kiri: Form Tambah Guru */}
				<div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
					<h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tambah Akun Guru Baru</h3>
					
					<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<div style={{ flex: 1 }}>
								<label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>Gelar Depan</label>
								<input type="text" value={frontTitle} onChange={(e) => setFrontTitle(e.target.value)} placeholder="Drs." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
							</div>
							<div style={{ flex: 2 }}>
								<label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>Nama Lengkap *</label>
								<input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Budi Santoso" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
							</div>
							<div style={{ flex: 1 }}>
								<label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>Gelar Belakang</label>
								<input type="text" value={backTitle} onChange={(e) => setBackTitle(e.target.value)} placeholder="S.Pd" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
							</div>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username (Untuk Login) *</label>
							<input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required placeholder="budisantoso" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password *</label>
							<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
						</div>

						<button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: isLoading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
							{isLoading ? "Menyimpan..." : "Simpan Data Guru"}
						</button>
					</form>
				</div>

				{/* Kolom Kanan: Tabel Daftar Guru */}
				<div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
					<h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Daftar Akun Guru</h3>
					
					<div style={{ overflowX: 'auto' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
							<thead>
								<tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
									<th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Nama Lengkap</th>
									<th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Username</th>
								</tr>
							</thead>
							<tbody>
								{teachers.length === 0 ? (
									<tr>
										<td colSpan={2} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>Belum ada data guru yang terdaftar.</td>
									</tr>
								) : (
									teachers.map(teacher => {
										// Format penulisan nama dengan gelar
										const prefix = teacher.front_title ? `${teacher.front_title} ` : "";
										const suffix = teacher.back_title ? `, ${teacher.back_title}` : "";
										const displayName = `${prefix}${teacher.full_name}${suffix}`;

										return (
											<tr key={teacher.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
												<td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{displayName}</td>
												<td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{teacher.username}</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}