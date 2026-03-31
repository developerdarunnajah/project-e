import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
	// 1. Inisialisasi State
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	
	const navigate = useNavigate();

	// 2. Fungsi Eksekusi Login
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault(); // Mencegah halaman reload saat form disubmit
		setErrorMsg("");
		setIsLoading(true);

		try {
			// Memanggil API Hono yang sudah kita buat di backend
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				// Jika gagal (password salah, dll), tampilkan pesan error dari API
				setErrorMsg(result.message || "Gagal melakukan login.");
				return;
			}

			// 3. Jika Sukses: Simpan Token & Role ke memori browser (Local Storage)
			const { token, user } = result.data;
			localStorage.setItem("authToken", token);
			localStorage.setItem("userRole", user.role);
			localStorage.setItem("userName", user.name);

			// 4. Arahkan pengguna berdasarkan peran (Role)
			if (user.role === "ADMIN") {
				navigate("/admin", { replace: true });
			} else if (user.role === "GURU") {
				navigate("/guru/scanner", { replace: true });
			}

		} catch (error) {
			console.error("Kesalahan jaringan:", error);
			setErrorMsg("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
		} finally {
			setIsLoading(false);
		}
	};

	// 5. Antarmuka Visual (UI)
	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
			<div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
				<h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#111827' }}>Sistem Absensi Sekolah</h2>
				
				{/* Tempat Menampilkan Error */}
				{errorMsg && (
					<div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
						{errorMsg}
					</div>
				)}

				<form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
					<div>
						<label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
							placeholder="Masukkan username Anda"
						/>
					</div>
					
					<div>
						<label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
							placeholder="Masukkan password Anda"
						/>
					</div>

					<button 
						type="submit" 
						disabled={isLoading}
						style={{ 
							marginTop: '0.5rem', 
							padding: '0.75rem', 
							backgroundColor: isLoading ? '#9ca3af' : '#3b82f6', 
							color: 'white', 
							border: 'none', 
							borderRadius: '4px', 
							fontWeight: 'bold', 
							cursor: isLoading ? 'not-allowed' : 'pointer' 
						}}
					>
						{isLoading ? "Memproses..." : "Masuk"}
					</button>
				</form>
			</div>
		</div>
	);
}