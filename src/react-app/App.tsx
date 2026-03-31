import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login"; // <-- Tambahkan baris impor ini
import AdminDashboard from "./pages/AdminDashboard";
import TeacherScanner from "./pages/TeacherScanner";

// --- DUMMY COMPONENTS (Akan kita ganti di tahap selanjutnya) ---
const NotFound = () => <div className="p-4"><h1>404 - Halaman Tidak Ditemukan</h1></div>;

// --- KOMPONEN PELINDUNG RUTE ---
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
	const userRole = localStorage.getItem("userRole"); 
	
	if (!userRole) {
		return <Navigate to="/" replace />;
	}
	if (userRole !== allowedRole) {
		return <div>Akses Ditolak. Anda bukan {allowedRole}.</div>;
	}
	
	return <>{children}</>;
};

function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Rute Publik memanggil komponen Login yang asli */}
				<Route path="/" element={<Login />} />

				<Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
				<Route path="/guru/scanner" element={<ProtectedRoute allowedRole="GURU"><TeacherScanner /></ProtectedRoute>} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;