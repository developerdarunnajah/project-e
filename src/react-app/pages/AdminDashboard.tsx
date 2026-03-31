import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentManager from "../components/StudentManager";
import ClassManager from "../components/ClassManager";
import AttendanceRules from "../components/AttendanceRules";
import TeacherManager from "../components/TeacherManager";

export default function AdminDashboard() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("overview");
	const [adminName, setAdminName] = useState("");

	// Mengambil nama admin dari memori browser saat komponen dimuat
	useEffect(() => {
		const name = localStorage.getItem("userName");
		if (name) setAdminName(name);
	}, []);

	// Fungsi untuk keluar (Logout)
	const handleLogout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("userRole");
		localStorage.removeItem("userName");
		navigate("/", { replace: true });
	};

	// --- KOMPONEN KONTEN SEMENTARA ---
	const renderContent = () => {
		switch (activeTab) {
			case "overview":
				return (
					<div>
						<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Selamat Datang, {adminName}</h2>
						<p>Gunakan menu di samping untuk mengelola data sekolah.</p>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
							<div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
								<h3>Total Siswa</h3>
								<p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1d4ed8' }}>--</p>
							</div>
							<div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
								<h3>Total Guru</h3>
								<p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>--</p>
							</div>
							<div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
								<h3>Siswa Terlambat Hari Ini</h3>
								<p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b91c1c' }}>--</p>
							</div>
						</div>
					</div>
				);
case "guru":
    return <TeacherManager />;
    case "siswa":
    return <StudentManager />;
    case "kelas":
    return <ClassManager />;
			case "aturan":
    return <AttendanceRules />;			default:
				return <div>Pilih menu</div>;
		}
	};

	return (
		<div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
			
			{/* SIDEBAR */}
			<aside style={{ width: '250px', backgroundColor: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column' }}>
				<div style={{ padding: '1.5rem', borderBottom: '1px solid #374151' }}>
					<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Admin Panel</h1>
					<p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Sistem Absensi</p>
				</div>
				
				<nav style={{ flex: 1, padding: '1rem 0' }}>
					<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						{/* Fungsi helper untuk styling tombol menu */}
						{[
							{ id: "overview", label: "Ringkasan" },
							{ id: "guru", label: "Data Guru" },
							{ id: "siswa", label: "Data Siswa" },
							{ id: "kelas", label: "Data Kelas" },
							{ id: "aturan", label: "Aturan Jam" },
						].map((item) => (
							<li key={item.id}>
								<button
									onClick={() => setActiveTab(item.id)}
									style={{
										width: '100%', textAlign: 'left', padding: '0.75rem 1.5rem', background: activeTab === item.id ? '#374151' : 'transparent', color: activeTab === item.id ? 'white' : '#d1d5db', border: 'none', cursor: 'pointer', transition: 'background 0.2s'
									}}
								>
									{item.label}
								</button>
							</li>
						))}
					</ul>
				</nav>

				<div style={{ padding: '1rem', borderTop: '1px solid #374151' }}>
					<button 
						onClick={handleLogout}
						style={{ width: '100%', padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
					>
						Keluar (Logout)
					</button>
				</div>
			</aside>

			{/* MAIN CONTENT AREA */}
			<main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
				<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '80vh' }}>
					{renderContent()}
				</div>
			</main>
			
		</div>
	);
}