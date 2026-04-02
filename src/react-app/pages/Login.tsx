import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	
	const [currentSlide, setCurrentSlide] = useState(1);
	const totalSlides = 5;

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentSlide((prev) => (prev % totalSlides) + 1);
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password })
			});
			const data = await res.json();

			if (data.success) {
				localStorage.setItem("authToken", data.data.token);
				localStorage.setItem("userRole", data.data.user.role);
				localStorage.setItem("userName", data.data.user.name);
				
				if (data.data.user.role === "ADMIN") {
					navigate("/admin", { replace: true });
				} else {
					navigate("/guru/scanner", { replace: true });
				}
			} else {
				setError(data.message);
			}
		} catch (err) {
			setError("Terjadi kesalahan jaringan atau server tidak merespons.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<style>
				{`
					.login-wrapper {
						display: flex;
						height: 100vh;
						width: 100vw;
						flex-direction: column;
						margin: 0;
						padding: 0;
						overflow: hidden;
					}
					
					/* SLIDESHOW AREA (40% Atas di Mobile) */
					.slideshow-area {
						flex: 0 0 40%;
						position: relative;
						background-color: #111827;
					}

					/* FORM AREA (60% Bawah di Mobile) */
					.form-area {
						display: flex;
						align-items: center;
						justify-content: center;
						background-color: #ffffff; /* Latar belakang putih bersih */
					}

					/* DESKTOP VIEW (Lebar di atas 768px) */
					@media (min-width: 768px) {
						.login-wrapper {
							flex-direction: row;
						}
						.slideshow-area {
							flex: 0 0 60%; /* 60% Kiri */
						}
						.form-area {
							flex: 0 0 40%; /* 40% Kanan */
						}
					}

					/* ANIMASI GAMBAR */
					.slide-image {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						object-fit: cover;
						opacity: 0;
						transition: opacity 1.5s ease-in-out;
					}
					.slide-image.active {
						opacity: 1;
					}

					/* CUSTOM FORM STYLES */
					.form-container {
						width: 100%;
						max-width: 380px; /* Lebar optimal form tanpa border */
					}
					.custom-input {
						width: 100%;
						padding: 0.875rem 1rem;
						border-radius: 8px;
						border: 1px solid #e5e7eb;
						background-color: #f9fafb;
						font-size: 1rem;
						outline: none;
						transition: all 0.2s ease;
						box-sizing: border-box;
					}
					.custom-input:focus {
						border-color: #3b82f6;
						background-color: #ffffff;
						box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
					}
					.custom-button {
						width: 100%;
						padding: 0.875rem;
						background-color: #111827; /* Warna tombol gelap lebih elegan */
						color: white;
						border: none;
						border-radius: 8px;
						font-size: 1rem;
						font-weight: 600;
						cursor: pointer;
						transition: background-color 0.2s;
						margin-top: 1rem;
					}
					.custom-button:hover:not(:disabled) {
						background-color: #374151;
					}
					.custom-button:disabled {
						background-color: #9ca3af;
						cursor: not-allowed;
					}
				`}
			</style>

			<div className="login-wrapper">
				
				{/* 1. BAGIAN SLIDESHOW */}
				<div className="slideshow-area">
					{[1, 2, 3, 4, 5].map((num) => (
						<img 
							key={num}
							src={`/api/photos/slideshow%2F${num}.jpg`}
							alt={`Fasilitas Sekolah ${num}`}
							className={`slide-image ${currentSlide === num ? 'active' : ''}`}
						/>
					))}
					
					<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)', zIndex: 10 }}></div>
					
					<div style={{ position: 'absolute', bottom: '3rem', left: '3rem', zIndex: 20, color: 'white', paddingRight: '2rem' }}>
						<h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
							Absensi
						</h1>
						<p style={{ fontSize: '1.125rem', color: '#e5e7eb', opacity: 0.9, maxWidth: '80%' }}>
							Sistem Absensi SMKS DARUN NAJAH
						</p>
					</div>
				</div>

				{/* 2. BAGIAN FORM LOGIN */}
				<div className="form-area">
					<div className="form-container">
						
						<div style={{ marginBottom: '2.5rem' }}>
							<h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>Login</h2>
						</div>

						{error && (
							<div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #fecaca' }}>
								{error}
							</div>
						)}

						<form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
							<div>
								<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>Username</label>
								<input 
									type="text" 
									required 
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="custom-input"
									placeholder="Masukkan username Anda"
								/>
							</div>

							<div>
								<label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>Kata Sandi</label>
								<input 
									type="password" 
									required 
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="custom-input"
									placeholder="••••••••"
								/>
							</div>

							<button 
								type="submit" 
								disabled={isLoading}
								className="custom-button"
							>
								{isLoading ? 'Memeriksa Kredensial...' : 'Masuk ke Dasbor'}
							</button>
						</form>
						
					</div>
				</div>

			</div>
		</>
	);
}