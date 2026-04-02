import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentManager from "../components/StudentManager";
import ClassManager from "../components/ClassManager";
import AttendanceRules from "../components/AttendanceRules";
import TeacherManager from "../components/TeacherManager";
import ClassAssignment from "../components/ClassAssignment";

export default function AdminDashboard() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("overview");
	const [adminName, setAdminName] = useState("");
	
	// State Responsivitas
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const name = localStorage.getItem("userName");
		if (name) setAdminName(name);

		// Fungsi untuk mengecek dan menyesuaikan UI berdasarkan ukuran layar realtime
		const handleResize = () => {
			if (window.innerWidth < 768) {
				setIsMobile(true);
				setIsSidebarOpen(false); // Otomatis tutup di HP agar layar lega
			} else {
				setIsMobile(false);
				setIsSidebarOpen(true); // Buka di Desktop
			}
		};

		// Pengecekan saat pertama kali render
		handleResize();

		// Mendengarkan perubahan ukuran jendela secara otomatis
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("userRole");
		localStorage.removeItem("userName");
		navigate("/", { replace: true });
	};

	// --- DATA MENU & IKON (SVG) ---
	const menuItems = [
		{ id: "overview", label: "Ringkasan", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> },
		{ id: "guru", label: "Data Guru", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> },
		{ id: "siswa", label: "Data Siswa", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> },
		{ id: "kelas", label: "Data Kelas", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
		{ id: "aturan", label: "Aturan Jam", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },{ id: "plotting", label: "Plotting Siswa", icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> },
    ];

	// --- KOMPONEN KONTEN UTAMA ---
	const renderContent = () => {
		switch (activeTab) {
			case "overview":
				return (
					<div>
						<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Selamat Datang, {adminName}</h2>
						<p style={{ color: '#6b7280' }}>Gunakan menu di navigasi untuk mengelola data operasional sekolah.</p>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
							<div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
								<h3 style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Total Siswa Aktif</h3>
								<p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb', marginTop: '0.5rem' }}>--</p>
							</div>
							<div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
								<h3 style={{ color: '#14532d', fontWeight: 'bold' }}>Total Guru</h3>
								<p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#16a34a', marginTop: '0.5rem' }}>--</p>
							</div>
							<div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
								<h3 style={{ color: '#7f1d1d', fontWeight: 'bold' }}>Siswa Terlambat Hari Ini</h3>
								<p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626', marginTop: '0.5rem' }}>--</p>
							</div>
						</div>
					</div>
				);
			case "guru": return <TeacherManager />;
			case "siswa": return <StudentManager />;
			case "kelas": return <ClassManager />;
			case "aturan": return <AttendanceRules />;
            case "plotting": return <ClassAssignment />;
			default: return <div>Pilih menu</div>;
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
			
			{/* 1. HEADER KHUSUS MOBILE (Tampil hanya di HP) */}
			{isMobile && (
				<header style={{ 
					display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
					padding: '1rem 1.5rem', backgroundColor: '#111827', color: 'white',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 30
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<button 
							onClick={() => setIsSidebarOpen(true)}
							style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, cursor: 'pointer', display: 'flex' }}
						>
							<svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
						</button>
						<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Admin Panel</h1>
					</div>
				</header>
			)}

			{/* 2. OVERLAY LAYAR GELAP UNTUK MOBILE (Klik untuk menutup sidebar) */}
			{isMobile && isSidebarOpen && (
				<div 
					onClick={() => setIsSidebarOpen(false)}
					style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
				/>
			)}

			{/* 3. SIDEBAR UTAMA */}
			<aside style={{ 
				position: isMobile ? 'fixed' : 'relative',
				top: 0, left: 0, height: '100vh',
				// Logika Lebar: Jika HP dan tertutup = 0px. Jika Desktop tertutup = 80px. Jika terbuka = 260px.
				width: isSidebarOpen ? '260px' : (isMobile ? '0px' : '80px'), 
				backgroundColor: '#111827', color: 'white', 
				display: 'flex', flexDirection: 'column',
				transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				zIndex: 50, overflowX: 'hidden',
				boxShadow: isMobile && isSidebarOpen ? '4px 0 10px rgba(0,0,0,0.3)' : 'none'
			}}>
				{/* Header Sidebar (Logo & Tombol Lipat) */}
				<div style={{ 
					height: '70px', minHeight: '70px', padding: '0 1.5rem', borderBottom: '1px solid #374151',
					display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center',
					minWidth: '260px' // Mencegah teks turun ke bawah saat proses animasi menyempit
				}}>
					<div style={{ opacity: isSidebarOpen ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
						<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Admin Panel</h1>
					</div>
					<button 
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						style={{ marginLeft: '10rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.5rem', display: 'flex' }}
						title={isSidebarOpen ? "Tutup Menu" : "Buka Menu"}
					>
						<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
							{isMobile ? (
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path> // Ikon Silang (X) di HP
							) : (
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path> // Ikon Hamburger di Desktop
							)}
						</svg>
					</button>
				</div>
				
				{/* Daftar Menu List */}
				<nav style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto', overflowX: 'hidden' }}>
					<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						{menuItems.map((item) => (
							<li key={item.id}>
								<button
									onClick={() => {
										setActiveTab(item.id);
										if (isMobile) setIsSidebarOpen(false); // Otomatis sembunyikan overlay di HP saat menu diklik
									}}
									style={{
										width: '100%', display: 'flex', alignItems: 'center', 
										padding: isSidebarOpen ? '0.875rem 1.5rem' : '0.875rem 0', 
										justifyContent: isSidebarOpen ? 'flex-start' : 'center',
										background: activeTab === item.id ? '#1f2937' : 'transparent', 
										color: activeTab === item.id ? '#60a5fa' : '#d1d5db', 
										border: 'none', 
										borderRight: activeTab === item.id ? '4px solid #3b82f6' : '4px solid transparent',
										cursor: 'pointer', transition: 'all 0.2s ease',
										minWidth: '260px'
									}}
									title={!isSidebarOpen && !isMobile ? item.label : undefined}
								>
									{/* Ikon Statis */}
									<span style={{ flexShrink: 0, width: '24px', display: 'flex', justifyContent: 'center' }}>
										{item.icon}
									</span>
									
									{/* Teks Dinamis */}
									<span style={{ 
										marginLeft: '1rem', fontWeight: '500', fontSize: '1rem',
										opacity: isSidebarOpen ? 1 : 0,
										width: isSidebarOpen ? 'auto' : 0,
										overflow: 'hidden', whiteSpace: 'nowrap',
										transition: 'opacity 0.2s'
									}}>
										{item.label}
									</span>
								</button>
							</li>
						))}
					</ul>
				</nav>

				{/* Tombol Logout */}
				<div style={{ padding: '1rem', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'center' }}>
					<button 
						onClick={handleLogout}
						style={{ 
							width: '100%', display: 'flex', alignItems: 'center', 
							justifyContent: isSidebarOpen ? 'flex-start' : 'center',
							padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0', 
							backgroundColor: '#ef4444', color: 'white', border: 'none', 
							borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
							transition: 'background-color 0.2s'
						}}
						title={!isSidebarOpen && !isMobile ? "Keluar Sistem" : undefined}
					>
						<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
						</svg>
						
						{isSidebarOpen && (
							<span style={{ marginLeft: '0.75rem', whiteSpace: 'nowrap' }}>Keluar Sistem</span>
						)}
					</button>
				</div>
			</aside>

			{/* 4. MAIN CONTENT AREA */}
			<main style={{ flex: 1, padding: isMobile ? '1rem' : '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
				<div style={{ 
					flex: 1, backgroundColor: 'white', padding: isMobile ? '1.5rem' : '2rem', 
					borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
				}}>
					{renderContent()}
				</div>
			</main>
			
		</div>
	);
}