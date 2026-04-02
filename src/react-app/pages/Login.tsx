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
            box-sizing: border-box; /* Pastikan wrapper menghitung batas layar */
        }
        
        .slideshow-area {
            flex: 0 0 40%;
            position: relative;
            background-color: #111827;
        }

        .form-area {
            flex: 1; /* Mengambil sisa ruang yang ada */
            display: flex;
            align-items: center;
            justify-content: center; /* Memaksa konten di tengah secara horizontal */
            background-color: #ffffff; 
            padding: 1.5rem; /* Padding merata di semua sisi (atas, kanan, bawah, kiri) */
            box-sizing: border-box; /* KUNCI: Agar padding 1.5rem tidak mendorong form ke kanan */
            width: 100%;
        }

        @media (min-width: 768px) {
            .login-wrapper {
                flex-direction: row;
            }
            .slideshow-area {
                flex: 0 0 60%;
            }
            .form-area {
                flex: 0 0 40%;
            }
        }

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

        .form-container {
            width: 100%; /* Mengisi lebar form-area */
            max-width: 340px; /* Dipersempit sedikit agar lebih estetik di HP */
            margin: 0 auto; /* Memastikan container berada di tengah jika ada ruang sisa */
            box-sizing: border-box;
        }

        .custom-input {
            width: 100%;
            padding: 0.875rem 1rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background-color: #f9fafb;
            font-size: 1rem;
            outline: none;
            box-sizing: border-box; /* KUNCI: Mencegah input 'meluber' ke kanan */
        }

        .custom-button {
            width: 100%;
            padding: 0.875rem;
            background-color: #111827; 
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            box-sizing: border-box; /* KUNCI: Mencegah tombol lebih lebar dari input */
            margin-top: 0.5rem;
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
                    
                    <div style={{ position: 'absolute', bottom: '2rem', left: '1.5rem', zIndex: 20, color: 'white', paddingRight: '1.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                            Absensi
                        </h1>
                        <p style={{ fontSize: '1rem', color: '#e5e7eb', opacity: 0.9 }}>
                            Sistem Absensi SMKS DARUN NAJAH
                        </p>
                    </div>
                </div>

                {/* 2. BAGIAN FORM LOGIN */}
                <div className="form-area">
                    <div className="form-container">
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>Login</h2>
                        </div>

                        {error && (
                            <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #fecaca', textAlign: 'center' }}>
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
                                {isLoading ? 'Memeriksa Kredensial...' : 'Masuk'}
                            </button>
                        </form>
                        
                    </div>
                </div>

            </div>
        </>
    );
}