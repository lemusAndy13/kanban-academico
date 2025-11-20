import { useEffect, useMemo, useState } from "react";
import axios from "../services/axiosConfig";
import Modal from "../components/Modal";

type Role = "student" | "teacher";
type AdminUser = {
	id: number;
	username: string;
	email: string;
	is_active: boolean;
	is_staff: boolean;
	profile_role?: Role | null;
};

export default function AdminPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [search, setSearch] = useState<string>("");
	const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
	const [onlyStaff, setOnlyStaff] = useState<boolean>(false);

	// Create user modal
	const [createOpen, setCreateOpen] = useState(false);
	const [form, setForm] = useState<{username: string; email: string; password: string; role: Role; is_staff: boolean}>({
		username: "", email: "", password: "", role: "student", is_staff: false
	});

	// Set password modal
	const [pwdOpen, setPwdOpen] = useState(false);
	const [pwd, setPwd] = useState("");
	const [pwdUser, setPwdUser] = useState<AdminUser | null>(null);

	const canAccess = localStorage.getItem("is_staff") === "true";

	useEffect(() => {
		if (canAccess) {
			fetchUsers();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canAccess]);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			setError("");
			const { data } = await axios.get("/admin/users/");
			setUsers(data);
		} catch (e: any) {
			const msg = e?.response?.data?.detail || e?.message || "No se pudo cargar usuarios";
			setError(msg);
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async () => {
		try {
			const payload: any = { username: form.username, email: form.email, role: form.role, is_staff: form.is_staff };
			if (form.password) payload.password = form.password;
			const { data } = await axios.post("/admin/users/", payload);
			setUsers(prev => [data, ...prev]);
			setCreateOpen(false);
			setForm({ username: "", email: "", password: "", role: "student", is_staff: false });
			await fetchUsers();
		} catch (e: any) {
			setError(e?.response?.data?.detail || "No se pudo crear el usuario");
		}
	};

	const toggleActive = async (u: AdminUser) => {
		try {
			await axios.patch(`/admin/users/${u.id}/`, { is_active: !u.is_active });
			await fetchUsers();
		} catch (e: any) {
			setError(e?.response?.data?.detail || "No se pudo actualizar el estado");
		}
	};

	const toggleStaff = async (u: AdminUser) => {
		try {
			await axios.patch(`/admin/users/${u.id}/`, { is_staff: !u.is_staff });
			await fetchUsers();
		} catch (e: any) {
			setError(e?.response?.data?.detail || "No se pudo actualizar permisos");
		}
	};

	const openPasswordModal = (u: AdminUser) => {
		setPwdUser(u);
		setPwd("");
		setPwdOpen(true);
	};

	const submitPassword = async () => {
		if (!pwdUser || !pwd) return;
		try {
			await axios.post(`/admin/users/${pwdUser.id}/set_password/`, { password: pwd });
			setPwdOpen(false);
		} catch (e: any) {
			setError(e?.response?.data?.detail || "No se pudo cambiar la contraseña");
		}
	};

	const filtered = useMemo(() => {
		let data = users;
		if (roleFilter !== "all") {
			data = data.filter(u => (u.profile_role || "student") === roleFilter);
		}
		if (onlyStaff) data = data.filter(u => u.is_staff);
		if (search.trim()) {
			const q = search.toLowerCase();
			data = data.filter(u => u.username.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
		}
		return data;
	}, [users, roleFilter, onlyStaff, search]);

	if (!canAccess) {
		return (
			<div className="container">
				<h1>Administración</h1>
				<p>No autorizado.</p>
			</div>
		);
	}

	return (
		<div style={{ padding: 24 }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<h1 style={{ margin: 0 }}>Administración</h1>
				<div style={{ display: "flex", gap: 8 }}>
					<button className="btn btn-ghost" onClick={fetchUsers} disabled={loading}>Refrescar</button>
					<button className="btn btn-primary btn-large" onClick={() => setCreateOpen(true)}>Nuevo usuario</button>
				</div>
			</div>

			<p className="muted" style={{ marginTop: 6 }}>Gestión de usuarios (crear estudiantes y catedráticos) — similar al módulo de cursos.</p>
			{error && <div className="alert" style={{ marginTop: 8 }}>{error}</div>}

			<div className="card" style={{ marginTop: 16 }}>
				<div className="row" style={{ gap: 12, alignItems: "center" }}>
					<input className="input" placeholder="Buscar por usuario o email" value={search} onChange={(e)=>setSearch(e.target.value)} />
					<div className="role-toggle" role="tablist" aria-label="Filtro rol">
						<button type="button" className={`role-option ${roleFilter==='all'?'active':''}`} onClick={()=>setRoleFilter('all')}>Todos</button>
						<button type="button" className={`role-option ${roleFilter==='student'?'active':''}`} onClick={()=>setRoleFilter('student')}>Estudiantes</button>
						<button type="button" className={`role-option ${roleFilter==='teacher'?'active':''}`} onClick={()=>setRoleFilter('teacher')}>Catedráticos</button>
					</div>
					<label className="checkbox" style={{ marginLeft: 8 }}>
						<input type="checkbox" checked={onlyStaff} onChange={(e)=>setOnlyStaff(e.target.checked)} />
						<span>Solo staff</span>
					</label>
				</div>
			</div>

			<div className="cards-grid" style={{ marginTop: 16 }}>
				{filtered.map((u) => (
					<div key={u.id} className="card-item">
						<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<h3 style={{ margin: 0 }}>{u.username}</h3>
							<div className="pill">{u.profile_role || '-'}</div>
						</div>
						<div className="muted" style={{ marginTop: 4 }}>{u.email || '-'}</div>
						<div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
							<button className="btn btn-ghost" onClick={() => toggleActive(u)}>{u.is_active ? "Desactivar" : "Activar"}</button>
							<button className="btn btn-ghost" onClick={() => toggleStaff(u)}>{u.is_staff ? "Quitar staff" : "Hacer staff"}</button>
							<button className="btn btn-ghost" onClick={() => openPasswordModal(u)}>Cambiar contraseña</button>
						</div>
					</div>
				))}
			</div>

			<Modal
				open={createOpen}
				title="Nuevo usuario"
				onClose={() => setCreateOpen(false)}
				footer={(
					<>
						<button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancelar</button>
						<button className="btn btn-primary" onClick={handleCreate}>Crear</button>
					</>
				)}
			>
				<div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
					<div>
						<label className="form-label">Usuario</label>
						<input className="input" value={form.username} onChange={(e)=>setForm(f=>({...f, username: e.target.value}))} />
					</div>
					<div>
						<label className="form-label">Email</label>
						<input className="input" type="email" value={form.email} onChange={(e)=>setForm(f=>({...f, email: e.target.value}))} />
					</div>
					<div>
						<label className="form-label">Contraseña (opcional)</label>
						<input className="input" type="text" value={form.password} onChange={(e)=>setForm(f=>({...f, password: e.target.value}))} />
					</div>
					<div>
						<label className="form-label">Rol</label>
						<select className="input" value={form.role} onChange={(e)=>setForm(f=>({...f, role: e.target.value as Role}))}>
							<option value="student">Estudiante</option>
							<option value="teacher">Catedrático</option>
						</select>
					</div>
					<div style={{ display: "flex", alignItems: "flex-end" }}>
						<label className="checkbox">
							<input type="checkbox" checked={form.is_staff} onChange={(e)=>setForm(f=>({...f, is_staff: e.target.checked}))} />
							<span>Administrador (staff)</span>
						</label>
					</div>
				</div>
			</Modal>

			<Modal
				open={pwdOpen}
				title={`Cambiar contraseña para ${pwdUser?.username ?? ""}`}
				onClose={() => setPwdOpen(false)}
				footer={(
					<>
						<button className="btn btn-ghost" onClick={() => setPwdOpen(false)}>Cancelar</button>
						<button className="btn btn-primary" onClick={submitPassword}>Guardar</button>
					</>
				)}
			>
				<div className="form-group">
					<label className="form-label">Nueva contraseña</label>
					<input className="input" type="text" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="********" />
				</div>
			</Modal>
		</div>
	);
}


