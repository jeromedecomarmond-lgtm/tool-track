import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";

// ─── DONNÉES INITIALES VIDES ─────────────────────────────────────────────────
const INITIAL_USERS     = [];
const INITIAL_TOOLS     = [];
const INITIAL_MESSAGES  = [];
const INITIAL_CHANTIERS = [];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (d) => new Date(d).toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const daysSince = (iso) => iso ? Math.floor((Date.now() - new Date(iso)) / 86400000) : null;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f1117;
    --surface: #1a1d26;
    --surface2: #22263a;
    --border: #2e3347;
    --accent: #f5a623;
    --accent2: #e8520a;
    --green: #27c97a;
    --red: #e84040;
    --blue: #3a8ef6;
    --text: #e8eaf0;
    --muted: #7a8099;
    --font-head: 'Barlow Condensed', sans-serif;
    --font-body: 'Barlow', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  input, select, textarea { font-family: var(--font-body); }
  button { cursor: pointer; font-family: var(--font-head); }
  ::-webkit-scrollbar { width: 6px; } 
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .app { display: flex; height: 100vh; overflow: hidden; }
  
  /* SIDEBAR */
  .sidebar { width: 210px; min-width: 210px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
  .sidebar-logo { padding: 18px 14px 14px; border-bottom: 1px solid var(--border); }
  .sidebar-logo h1 { font-family: var(--font-head); font-size: 24px; font-weight: 800; letter-spacing: 1px; color: var(--accent); line-height: 1; }
  .sidebar-logo p { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 10px 8px; display: flex; flex-direction: column; gap: 4px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 10px; cursor: pointer;
    transition: all .15s; font-size: 13px; font-weight: 700;
    color: var(--muted); border: 1px solid transparent;
    background: none; text-align: left; width: 100%; position: relative;
    letter-spacing: .2px;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); border-color: var(--border); }
  .nav-item.active { background: rgba(245,166,35,.13); color: var(--accent); border-color: rgba(245,166,35,.3); }
  .nav-item .icon { font-size: 20px; flex-shrink: 0; }
  .badge { background: var(--red); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; font-family: var(--font-body); margin-left: auto; }
  .sidebar-user { padding: 10px; border-top: 1px solid var(--border); }
  .user-pill { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--surface2); border-radius: 10px; border: 1px solid var(--border); }
  .avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: var(--accent); color: #000; flex-shrink: 0; }
  .avatar.admin { background: var(--accent); }
  .avatar.viewer { background: var(--blue); color: #fff; }
  .user-info .name { font-size: 12px; font-weight: 700; line-height: 1.2; }
  .user-info .role { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }

  /* BOTTOM NAV — mobile */
  .bottom-nav { display: none; }

  @media (max-width: 680px) {
    .sidebar { display: none; }
    .bottom-nav {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: var(--surface); border-top: 2px solid var(--border);
      padding: 6px 4px 10px; gap: 2px;
    }
    .bottom-nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 3px; padding: 5px 2px; border-radius: 10px;
      border: none; background: none; color: var(--muted);
      font-size: 9px; font-weight: 800; cursor: pointer;
      text-transform: uppercase; letter-spacing: .3px; position: relative;
      transition: all .15s; font-family: var(--font-head);
    }
    .bottom-nav-item .bn-icon { font-size: 22px; line-height: 1; }
    .bottom-nav-item.active { color: var(--accent); }
    .bottom-nav-item .badge { position: absolute; top: 2px; right: 8px; }
    .main { padding-bottom: 75px; }
    .form-row { grid-template-columns: 1fr; }
    .detail-grid { grid-template-columns: 1fr; }
  }

  /* MAIN */
  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .topbar { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--surface); position: sticky; top: 0; z-index: 10; }
  .topbar h2 { font-family: var(--font-head); font-size: 26px; font-weight: 800; letter-spacing: .5px; }
  .content { padding: 24px; flex: 1; }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; font-weight: 700; letter-spacing: .4px; transition: all .15s; }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: #ffba42; }
  .btn-ghost { background: var(--surface2); color: var(--text); }
  .btn-ghost:hover { background: var(--border); }
  .btn-danger { background: var(--red); color: #fff; }
  .btn-green { background: var(--green); color: #000; }
  .btn-blue { background: var(--blue); color: #fff; }
  .btn-sm { padding: 5px 10px; font-size: 12px; }

  /* CARDS GRID */
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .tool-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
  .tool-card-top { padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
  .tool-emoji { width: 52px; height: 52px; background: var(--surface2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
  .tool-meta { flex: 1; min-width: 0; }
  .tool-name { font-family: var(--font-head); font-size: 17px; font-weight: 700; line-height: 1.2; }
  .tool-ref { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .tool-card-body { padding: 0 16px 12px; }
  .tool-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }
  .tool-card-footer { padding: 10px 16px; background: var(--surface2); border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .status-badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: .5px; }
  .status-store { background: rgba(39,201,122,.15); color: var(--green); }
  .status-assigned { background: rgba(58,142,246,.15); color: var(--blue); }
  .status-nonfunctional { background: rgba(232,82,10,.2); color: #f07030; }
  .tool-card.nonfunctional { border-color: rgba(232,82,10,.35); }
  .tool-card.obsolete { opacity: .65; filter: grayscale(.5); }
  .assignee-chip { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted); }
  .price-tag { display: inline-flex; align-items: center; gap: 4px; background: rgba(232,82,10,.13); color: #f07030; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 20px; border: 1px solid rgba(232,82,10,.3); }
  .repair-tag { display: inline-flex; align-items: center; gap: 4px; background: rgba(155,89,182,.13); color: #9b59b6; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 20px; border: 1px solid rgba(155,89,182,.3); }
  .price-tag-lg { display: inline-flex; align-items: center; gap: 5px; background: rgba(232,82,10,.13); color: #f07030; font-size: 15px; font-weight: 800; padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(232,82,10,.35); }
  .price-warning { font-size: 11px; color: var(--muted); font-style: italic; margin-top: 3px; }

  /* PHOTO */
  .tool-photo-card { width: 100%; height: 160px; object-fit: cover; border-radius: 0; display: block; }
  .tool-photo-placeholder { width: 100%; height: 160px; background: var(--surface2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--muted); font-size: 13px; }
  .tool-photo-placeholder .big-emoji { font-size: 48px; }
  .tool-photo-detail { width: 100%; height: 220px; object-fit: cover; border-radius: 10px; }
  .tool-photo-detail-placeholder { width: 100%; height: 220px; background: var(--surface2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 72px; }
  .photo-upload-zone { border: 2px dashed var(--border); border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; transition: all .2s; color: var(--muted); font-size: 13px; }
  .photo-upload-zone:hover { border-color: var(--accent); color: var(--accent); }
  .photo-upload-zone input[type=file] { display: none; }
  .photo-preview { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-top: 8px; }
  .tool-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: all .2s; }

  /* FILTERS */
  .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  .filter-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); color: var(--muted); font-size: 12px; font-weight: 600; transition: all .15s; }
  .filter-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
  .filter-btn:hover:not(.active) { border-color: var(--accent); color: var(--accent); }
  .search-bar { flex: 1; min-width: 180px; position: relative; }
  .search-bar input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 7px 12px 7px 32px; color: var(--text); font-size: 13px; outline: none; }
  .search-bar input:focus { border-color: var(--accent); }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 14px; pointer-events: none; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; backdrop-filter: blur(4px); }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
  .modal-header { padding: 20px 24px 0; display: flex; align-items: center; justify-content: space-between; }
  .modal-header h3 { font-family: var(--font-head); font-size: 22px; font-weight: 800; }
  .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
  .modal-footer { padding: 0 24px 20px; display: flex; justify-content: flex-end; gap: 8px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
  .form-input { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text); font-size: 13px; outline: none; width: 100%; }
  .form-input:focus { border-color: var(--accent); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .close-btn { background: var(--surface2); border: none; width: 30px; height: 30px; border-radius: 8px; color: var(--muted); font-size: 18px; display: flex; align-items: center; justify-content: center; }
  .close-btn:hover { color: var(--text); }

  /* MESSAGES */
  .messages-list { display: flex; flex-direction: column; gap: 10px; }
  .msg-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; transition: all .15s; }
  .msg-card.unread { border-color: var(--accent); background: rgba(245,166,35,.05); }
  .msg-card.push { border-left: 3px solid var(--green); }
  .msg-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .msg-from { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .msg-time { font-size: 11px; color: var(--muted); }
  .msg-text { font-size: 13px; color: var(--muted); line-height: 1.5; }
  .msg-tool { font-size: 11px; color: var(--blue); margin-top: 6px; }
  .msg-actions { display: flex; gap: 6px; margin-top: 10px; }
  .unread-dot { width: 7px; height: 7px; background: var(--accent); border-radius: 50%; }

  /* USERS */
  .users-list { display: flex; flex-direction: column; gap: 10px; }
  .user-row { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; }
  .user-row-info { flex: 1; }
  .user-row-name { font-weight: 600; font-size: 15px; }
  .user-row-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .role-tag { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; }
  .role-admin { background: rgba(245,166,35,.2); color: var(--accent); }
  .role-viewer { background: rgba(58,142,246,.2); color: var(--blue); }
  .avatar-lg { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }

  /* STATS */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .stat-num { font-family: var(--font-head); font-size: 38px; font-weight: 800; line-height: 1; }
  .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .stat-accent { color: var(--accent); }
  .stat-green { color: var(--green); }
  .stat-blue { color: var(--blue); }
  .stat-red { color: var(--red); }

  /* HISTORY */
  .history-list { display: flex; flex-direction: column; }
  .history-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .history-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .history-text { font-size: 12px; color: var(--muted); }
  .history-date { font-size: 11px; color: var(--border); }

  /* REMINDER ALERT */
  .reminder-banner { background: rgba(232,82,10,.12); border: 1px solid rgba(232,82,10,.4); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .reminder-banner p { font-size: 13px; color: #f07030; }

  /* DETAIL VIEW */
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .detail-item { background: var(--surface2); border-radius: 8px; padding: 10px 12px; }
  .detail-key { font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; }
  .detail-val { font-size: 14px; font-weight: 600; margin-top: 2px; }

  /* USER SELECT ROLE LOGIN */
  .login-screen { position: fixed; inset: 0; background: var(--bg); display: flex; align-items: center; justify-content: center; z-index: 200; flex-direction: column; gap: 16px; }
  .login-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px; width: 340px; }
  .login-title { font-family: var(--font-head); font-size: 32px; font-weight: 800; color: var(--accent); margin-bottom: 4px; }
  .login-sub { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
  .user-select-list { display: flex; flex-direction: column; gap: 8px; }
  .user-select-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--surface2); border-radius: 10px; cursor: pointer; border: 1px solid transparent; transition: all .15s; }
  .user-select-item:hover { border-color: var(--accent); }

  /* ASSIGN FORM */
  .assign-section { background: var(--surface2); border-radius: 10px; padding: 14px; }
  .assign-section h4 { font-family: var(--font-head); font-size: 16px; font-weight: 700; margin-bottom: 10px; color: var(--accent); }

  /* NOTIFICATION TOAST */
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--surface); border: 1px solid var(--green); border-radius: 12px; padding: 14px 18px; max-width: 320px; z-index: 999; box-shadow: 0 8px 32px rgba(0,0,0,.5); animation: slideIn .3s ease; }
  .toast.warn { border-color: var(--accent); }
  @keyframes slideIn { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
  .toast-title { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
  .toast-text { font-size: 12px; color: var(--muted); }

  /* WRITE MESSAGE BOX */
  .write-box { background: var(--surface2); border-radius: 10px; padding: 14px; margin-bottom: 20px; }
  .write-box h4 { font-family: var(--font-head); font-size: 15px; font-weight: 700; margin-bottom: 10px; }

  @media (max-width: 640px) {
    .sidebar { width: 60px; min-width: 60px; }
    .sidebar-logo, .user-info, .nav-item span { display: none; }
    .nav-item { justify-content: center; }
    .form-row { grid-template-columns: 1fr; }
    .detail-grid { grid-template-columns: 1fr; }
  }
`;

// ─── APP ─────────────────────────────────────────────────────────────────────
// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tools, setTools] = useState(INITIAL_TOOLS);
  const [chantiers, setChantiers] = useState(INITIAL_CHANTIERS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("tools");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // { type, data }
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [filterChantier, setFilterChantier] = useState("all");
  const [search, setSearch] = useState("");
  const [writeMsg, setWriteMsg] = useState({ toolId: "", text: "", type: "info" });
  const toastRef = useRef();

  const isAdmin = currentUser?.role === "admin";
  const unread = messages.filter(m => !m.read).length;

  // ── FIREBASE REAL-TIME SYNC ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [];
    let loaded = 0;
    const checkLoaded = () => { loaded++; if (loaded >= 4) setLoading(false); };

    unsubs.push(onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      checkLoaded();
    }));
    unsubs.push(onSnapshot(collection(db, "tools"), snap => {
      setTools(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      checkLoaded();
    }));
    unsubs.push(onSnapshot(collection(db, "chantiers"), snap => {
      setChantiers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      checkLoaded();
    }));
    unsubs.push(onSnapshot(collection(db, "messages"), snap => {
      setMessages(snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date)));
      checkLoaded();
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  // Simulated reminders check
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      tools.forEach(t => {
        if (t.status === "assigned" && t.assignedTo === currentUser?.id) {
          const days = daysSince(t.lastReminder);
          if (days === null || days >= 3) {
            showToast(`⏰ Rappel: "${t.name}" vous est confié sur ${t.location}. Avez-vous terminé ?`, "warn");
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser, tools]);

  const showToast = (text, type = "ok") => {
    clearTimeout(toastRef.current);
    setToast({ text, type });
    toastRef.current = setTimeout(() => setToast(null), 4000);
  };

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="login-screen">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>TOOL TRACK</div>
            <div style={{ color: "var(--muted)", marginTop: 8, fontSize: 13 }}>Connexion à la base de données...</div>
          </div>
        </div>
      </>
    );
  }

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <>
        <style>{css}</style>
        <div className="login-screen">
          <div className="login-card">
            <div className="login-title">TOOL TRACK</div>
            {users.length === 0 ? (
              <>
                <div className="login-sub">Bienvenue ! Créez le premier administrateur pour démarrer.</div>
                <FirstAdminForm onSave={async (u) => { await setDoc(doc(db, "users", String(u.id)), u); setCurrentUser(u); setPage("tools"); }} />
              </>
            ) : (
              <>
                <div className="login-sub">Choisissez votre profil</div>
                <div className="user-select-list">
                  {users.map(u => (
                    <PinLogin key={u.id} user={u} onSuccess={(u) => { setCurrentUser(u); setPage(u.role === "admin" ? "tools" : "mytools"); }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── TOOL DETAIL MODAL ───────────────────────────────────────────────────────
  const openTool = (tool) => setModal({ type: "tool", data: tool });

  // ── ASSIGN TOOL ─────────────────────────────────────────────────────────────
  const assignTool = async (toolId, viewerId, chantier, direction) => {
    const newViewer = viewerId ? users.find(u => u.id === viewerId) : null;
    const tool = tools.find(t => t.id === toolId);
    const prevOwner = tool.assignedTo ? users.find(u => u.id === tool.assignedTo) : null;
    const fromLocation = tool.location || "Store";
    const fromPerson = prevOwner ? prevOwner.name : "Store";
    const toLocation = chantier || "Store";
    const toPerson = newViewer ? newViewer.name : null;
    const today = new Date().toLocaleDateString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

    let action = "";
    if (direction === "out") {
      action = `📤 ${fromLocation} → ${toLocation}${toPerson ? ` — Confié à ${toPerson}` : ""}`;
    } else if (newViewer && chantier) {
      action = `🔄 Transféré de ${fromPerson} (${fromLocation}) → ${toPerson} (${toLocation})`;
    } else {
      action = `🏠 Retour store — depuis ${fromLocation}${prevOwner ? ` (${prevOwner.name})` : ""}`;
    }

    const updatedTool = {
      ...tool,
      status: (newViewer || chantier) && toLocation !== "Store" ? "assigned" : "store",
      assignedTo: newViewer ? viewerId : null,
      location: toLocation,
      history: [...tool.history, { date: today, action, by: currentUser.name }],
      lastReminder: newViewer ? new Date().toISOString() : null,
    };
    await setDoc(doc(db, "tools", String(toolId)), updatedTool);

    showToast(direction === "out" ? `✅ Confié à ${toPerson} — ${toLocation}` : newViewer ? `🔄 Transféré à ${toPerson} — ${toLocation}` : `🏠 Outil retourné au store`);
    setModal(null);
  };

  // ── SEND MESSAGE ────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!writeMsg.text.trim()) return;
    const id = String(Date.now());
    const newMsg = {
      id,
      from: currentUser.id,
      to: null,
      type: writeMsg.type,
      text: writeMsg.text,
      toolId: writeMsg.toolId || null,
      date: new Date().toISOString(),
      read: false,
    };
    await setDoc(doc(db, "messages", id), newMsg);
    setWriteMsg({ toolId: "", text: "", type: "info" });
    showToast("📨 Message envoyé à tous les admins");
  };

  // ── ADD TOOL ────────────────────────────────────────────────────────────────
  const fmtPrice = (p) => p ? `Rs ${p.toLocaleString("fr-MU")}` : null;

  const addTool = async (form) => {
    const id = String(Date.now());
    const newTool = {
      id,
      name: form.name, ref: form.ref || "",
      purchaseDate: form.purchaseDate || "", price: form.price ? Number(String(form.price).replace(/\s/g, "")) : null,
      obsolete: false, obsoleteDate: null,
      description: form.description || "",
      photo: form.photo || "🔧",
      photoUrl: form.photoUrl || null,
      status: "store", assignedTo: null, location: "Store",
      history: [{ date: new Date().toLocaleDateString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric" }), action: "📦 Ajouté au store", by: currentUser.name }],
      lastReminder: null,
      totalRepairCost: 0,
    };
    await setDoc(doc(db, "tools", id), newTool);
    showToast("✅ Outil ajouté au store");
    setModal(null);
  };

  // ── ADD USER ────────────────────────────────────────────────────────────────
  const addUser = async (form) => {
    const id = String(Date.now());
    const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const newUser = { id, name: form.name, role: form.role, avatar: initials, phone: form.phone || "", email: form.email || "", pin: form.pin };
    await setDoc(doc(db, "users", id), newUser);
    showToast("✅ Profil créé");
    return newUser;
  };

  // ── CHANTIERS CRUD ───────────────────────────────────────────────────────────
  const addChantier = async (name, color) => {
    if (!name.trim()) return;
    const id = String(Date.now());
    await setDoc(doc(db, "chantiers", id), { id, name: name.trim(), color });
    showToast("✅ Chantier ajouté");
  };
  const deleteChantier = async (id) => {
    const c = chantiers.find(c => c.id === id);
    const hasTools = tools.some(t => t.location === c?.name && t.status === "assigned");
    if (hasTools) { showToast("⚠️ Des outils sont encore sur ce chantier !", "warn"); return; }
    await deleteDoc(doc(db, "chantiers", String(id)));
    showToast("🗑 Chantier supprimé");
  };

  // ── FILTERED TOOLS ──────────────────────────────────────────────────────────
  const filteredTools = tools.filter(t => {
    const matchStatus = filterStatus === "all" ? true : t.status === filterStatus;
    // Peintre ET chantier sont mutuellement exclusifs — un seul actif à la fois
    const matchPeintre = filterUser === "all" || String(t.assignedTo) === filterUser || (filterUser === "none" && !t.assignedTo);
    const matchChantier = filterChantier === "all" || t.location === filterChantier;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.ref.toLowerCase().includes(search.toLowerCase());
    if (!isAdmin) return t.assignedTo === currentUser.id || t.status === "store";
    return matchStatus && matchPeintre && matchChantier && matchSearch;
  });

  const myTools = tools.filter(t => t.assignedTo === currentUser.id);
  const viewers = users.filter(u => u.role === "viewer");

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>TOOL<br />TRACK</h1>
            <p>Gestion d'outils</p>
          </div>
          <nav className="sidebar-nav">
            {isAdmin && <button className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}><span className="icon">📊</span><span>Dashboard</span></button>}
            {isAdmin && <button className={`nav-item ${page === "tools" ? "active" : ""}`} onClick={() => setPage("tools")}><span className="icon">🔧</span><span>Outils</span></button>}
            {isAdmin && <button className={`nav-item ${page === "chantiers" ? "active" : ""}`} onClick={() => setPage("chantiers")}><span className="icon">🏗</span><span>Chantiers</span></button>}
            {!isAdmin && <button className={`nav-item ${page === "mytools" ? "active" : ""}`} onClick={() => setPage("mytools")}><span className="icon">📦</span><span>Mes outils</span></button>}
            <button className={`nav-item ${page === "messages" ? "active" : ""}`} onClick={() => setPage("messages")}>
              <span className="icon">💬</span><span>Messages</span>
              {unread > 0 && <span className="badge">{unread}</span>}
            </button>
            {isAdmin && <button className={`nav-item ${page === "users" ? "active" : ""}`} onClick={() => setPage("users")}><span className="icon">👷</span><span>Équipe</span></button>}
          </nav>
          <div className="sidebar-user">
            <div className="user-pill">
              <div className={`avatar ${currentUser.role}`}>{currentUser.avatar}</div>
              <div className="user-info">
                <div className="name">{currentUser.name.split(" ")[0]}</div>
                <div className="role">{currentUser.role}</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8, justifyContent: "center" }} onClick={() => setCurrentUser(null)}>⇄ Changer</button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main">
          {/* ── DASHBOARD ── */}
          {page === "dashboard" && isAdmin && (
            <>
              <div className="topbar"><h2>Dashboard</h2></div>
              <div className="content">
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-num stat-accent">{tools.length}</div><div className="stat-label">Outils total</div></div>
                  <div className="stat-card"><div className="stat-num stat-green">{tools.filter(t => t.status === "store").length}</div><div className="stat-label">🟢 En store</div></div>
                  <div className="stat-card"><div className="stat-num stat-blue">{tools.filter(t => t.status === "assigned").length}</div><div className="stat-label">🔵 Chantiers</div></div>
                  <div className="stat-card"><div className="stat-num" style={{ color: "#f07030" }}>{tools.filter(t => t.status === "nonfunctional").length}</div><div className="stat-label">🔴 Non fonctionnels</div></div>
                  <div className="stat-card"><div className="stat-num" style={{ color: "#aaa" }}>{tools.filter(t => t.status === "obsolete").length}</div><div className="stat-label">⚫ Obsolètes</div></div>
                  <div className="stat-card"><div className="stat-num stat-red">{messages.filter(m => !m.read).length}</div><div className="stat-label">Messages non lus</div></div>
                </div>
                <h3 style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Outils sur chantiers</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tools.filter(t => t.status === "assigned").map(t => {
                    const assignee = users.find(u => u.id === t.assignedTo);
                    const days = daysSince(t.lastReminder);
                    return (
                      <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 22 }}>{t.photo}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name} <span style={{ color: "var(--muted)", fontSize: 11 }}>({t.ref})</span></div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>📍 {t.location} — 👷 {assignee?.name || "—"}</div>
                        </div>
                        {days !== null && days >= 3 && <span style={{ background: "rgba(232,82,10,.2)", color: "var(--accent2)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>⚠️ {days}j sans news</span>}
                        <button className="btn btn-ghost btn-sm" onClick={() => openTool(t)}>Détails</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── TOOLS (ADMIN) ── */}
          {page === "tools" && isAdmin && (
            <>
              <div className="topbar">
                <h2>Outils</h2>
                <button className="btn btn-primary" onClick={() => setModal({ type: "addTool" })}>+ Ajouter un outil</button>
              </div>
              <div className="content">
                <div className="filters">
                  <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input placeholder="Chercher un outil..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  {[
                    { val: "all", label: "Tous" },
                    { val: "store", label: "🟢 Store" },
                    { val: "assigned", label: "🔵 Chantier" },
                    { val: "nonfunctional", label: "🔴 Non fonctionnel" },
                    { val: "obsolete", label: "⚫ Obsolète" },
                  ].map(s => (
                    <button key={s.val} className={`filter-btn ${filterStatus === s.val ? "active" : ""}`} onClick={() => { setFilterStatus(s.val); setFilterUser("all"); setFilterChantier("all"); }}>
                      {s.label}
                    </button>
                  ))}
                  <select className="form-input" style={{ width: "auto", fontSize: 12 }} value={filterUser} onChange={e => { setFilterUser(e.target.value); setFilterChantier("all"); }}>
                    <option value="all">Tous les peintres</option>
                    <option value="none">Non assigné</option>
                    {viewers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <select className="form-input" style={{ width: "auto", fontSize: 12 }} value={filterChantier} onChange={e => { setFilterChantier(e.target.value); setFilterUser("all"); }}>
                    <option value="all">Tous les chantiers</option>
                    <option value="Store">Store</option>
                    {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="cards-grid">
                  {filteredTools.length === 0 && (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Aucun outil</div>
                      <div style={{ fontSize: 13 }}>Cliquez sur "+ Ajouter un outil" pour commencer</div>
                    </div>
                  )}
                  {filteredTools.map(t => {
                    const assignee = users.find(u => u.id === t.assignedTo);
                    return (
                      <div key={t.id} className={`tool-card${t.status === "nonfunctional" ? " nonfunctional" : t.status === "obsolete" ? " obsolete" : ""}`} onClick={() => openTool(t)} style={{ cursor: "pointer" }}>
                        {t.photoUrl
                          ? <img src={t.photoUrl} alt={t.name} className="tool-photo-card" />
                          : <div className="tool-photo-placeholder"><span className="big-emoji">{t.photo}</span><span style={{ fontSize: 11 }}>Aucune photo</span></div>
                        }
                        <div className="tool-card-top">
                          <div className="tool-meta" style={{ width: "100%" }}>
                            <div className="tool-name">{t.name}</div>
                            {t.ref && <div className="tool-ref">🏭 {t.ref}</div>}
                          </div>
                        </div>
                        <div className="tool-card-body">
                          <div className="tool-desc">{t.description}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Acheté le {fmt(t.purchaseDate)} · 📍 {t.location}</div>
                          {t.status === "nonfunctional" && t.obsoleteType && (
                            <div style={{ marginTop: 6, fontSize: 11, color: "#f07030", background: "rgba(232,82,10,.1)", padding: "4px 8px", borderRadius: 6 }}>
                              🔴 {t.repairCost ? `🔎 Suivi en cours — Rs ${t.repairCost.toLocaleString("fr-MU")}` : "🔎 Suivi en cours"}
                            </div>
                          )}
                        </div>
                        <div className="tool-card-footer">
                          {{
                            store: <span className="status-badge status-store">🟢 Store</span>,
                            assigned: <span className="status-badge status-assigned">🔵 Chantier</span>,
                            nonfunctional: <span className="status-badge status-nonfunctional">🔴 Non fonctionnel</span>,
                            obsolete: <span className="status-badge status-obsolete">⚫ Obsolète</span>,
                          }[t.status] || <span className="status-badge">{t.status}</span>}
                          {t.price && <span className="price-tag">🇲🇺 Rs {t.price.toLocaleString("fr-MU")}</span>}
                          {t.totalRepairCost > 0 && (
                            <span className="repair-tag" title="Total cumulatif des réparations">
                              🔧 Rs {t.totalRepairCost.toLocaleString("fr-MU")}
                            </span>
                          )}
                          {assignee && <span className="assignee-chip"><div style={{ width: 20, height: 20, fontSize: 9, borderRadius: 5, background: "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{assignee.avatar}</div>{assignee.name.split(" ")[0]}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── MY TOOLS (VIEWER) ── */}
          {page === "mytools" && !isAdmin && (
            <>
              <div className="topbar"><h2>Mes outils</h2></div>
              <div className="content">
                {myTools.length > 0 && (
                  <div className="reminder-banner">
                    <span>⏰</span>
                    <p>Vous avez <strong>{myTools.length} outil(s)</strong> sous votre responsabilité. Signalez leur disponibilité dès que le chantier est terminé via la section Messages.</p>
                  </div>
                )}
                {myTools.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>Aucun outil ne vous est actuellement confié.</div>}
                <div className="cards-grid">
                  {myTools.map(t => (
                    <div key={t.id} className="tool-card" onClick={() => openTool(t)} style={{ cursor: "pointer" }}>
                      {t.photoUrl
                        ? <img src={t.photoUrl} alt={t.name} className="tool-photo-card" />
                        : <div className="tool-photo-placeholder"><span className="big-emoji">{t.photo}</span><span style={{ fontSize: 11 }}>Aucune photo</span></div>
                      }
                      <div className="tool-card-top">
                        <div className="tool-meta" style={{ width: "100%" }}>
                          <div className="tool-name">{t.name}</div>
                          {t.ref && <div className="tool-ref">🏭 {t.ref}</div>}
                        </div>
                      </div>
                      <div className="tool-card-body">
                        <div className="tool-desc">{t.description}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>📍 {t.location} · Depuis le {fmt(t.history.at(-1)?.date)}</div>
                      </div>
                      <div className="tool-card-footer">
                        <span className="status-badge status-assigned">Sous ma responsabilité</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CHANTIERS ── */}
          {page === "chantiers" && isAdmin && (
            <ChantierPage chantiers={chantiers} tools={tools} users={users} addChantier={addChantier} deleteChantier={deleteChantier} />
          )}

          {/* ── MESSAGES ── */}
          {page === "messages" && (
            <>
              <div className="topbar"><h2>Messages</h2></div>
              <div className="content">
                {/* Write box for viewers */}
                <div className="write-box">
                  <h4>📨 {isAdmin ? "Envoyer un message à l'équipe" : "Envoyer un message aux admins"}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <select className="form-input" value={writeMsg.toolId} onChange={e => setWriteMsg(p => ({ ...p, toolId: e.target.value }))}>
                      <option value="">— Outil concerné (optionnel) —</option>
                      {(isAdmin ? tools : myTools).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select className="form-input" value={writeMsg.type} onChange={e => setWriteMsg(p => ({ ...p, type: e.target.value }))}>
                      <option value="info">ℹ️ Info générale</option>
                      <option value="push">✅ Outil disponible / à récupérer</option>
                    </select>
                    <textarea className="form-input" rows={3} placeholder="Votre message..." value={writeMsg.text} onChange={e => setWriteMsg(p => ({ ...p, text: e.target.value }))} />
                    <button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-end" }} onClick={sendMessage}>Envoyer</button>
                  </div>
                </div>

                <div className="messages-list">
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                      <div style={{ fontSize: 13 }}>Aucun message pour le moment</div>
                    </div>
                  )}
                  {messages.map(m => {
                    const sender = users.find(u => u.id === m.from);
                    const tool = tools.find(t => t.id === m.toolId);
                    return (
                      <div key={m.id} className={`msg-card ${m.read ? "" : "unread"} ${m.type === "push" ? "push" : ""}`}>
                        <div className="msg-header">
                          <div className="msg-from">
                            {!m.read && <span className="unread-dot" />}
                            <div className={`avatar ${sender?.role}`} style={{ width: 24, height: 24, fontSize: 10, background: sender?.role === "admin" ? "var(--accent)" : "var(--blue)", color: sender?.role === "admin" ? "#000" : "#fff" }}>{sender?.avatar}</div>
                            {sender?.name}
                            {m.type === "push" && <span style={{ background: "rgba(39,201,122,.2)", color: "var(--green)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>PUSH</span>}
                          </div>
                          <span className="msg-time">{fmtTime(m.date)}</span>
                        </div>
                        <div className="msg-text">{m.text}</div>
                        {tool && <div className="msg-tool">🔧 {tool.name} — {tool.location}</div>}
                        {isAdmin && !m.read && (
                          <div className="msg-actions">
                            <button className="btn btn-green btn-sm" onClick={() => { setDoc(doc(db, "messages", String(m.id)), {...m, read: true}); showToast("Message marqué comme lu"); }}>✓ Lu</button>
                            {m.type === "push" && tool && <button className="btn btn-blue btn-sm" onClick={() => { openTool(tool); setDoc(doc(db, "messages", String(m.id)), {...m, read: true}); }}>Traiter → Récupérer l'outil</button>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── USERS (ADMIN ONLY) ── */}
          {page === "users" && isAdmin && (
            <>
              <div className="topbar"><h2>Équipe</h2><button className="btn btn-primary" onClick={() => setModal({ type: "addUser" })}>+ Ajouter un profil</button></div>
              <div className="content">
                {["admin", "viewer"].map(role => (
                  <div key={role} style={{ marginBottom: 28 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: role === "admin" ? "var(--accent)" : "var(--blue)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      {role === "admin" ? "🔑 Administrateurs" : "🖌 Peintres"}
                      <span style={{ fontSize: 12, fontWeight: 600, background: role === "admin" ? "rgba(245,166,35,.15)" : "rgba(58,142,246,.15)", color: role === "admin" ? "var(--accent)" : "var(--blue)", padding: "2px 8px", borderRadius: 10 }}>
                        {users.filter(u => u.role === role).length}
                      </span>
                    </div>
                    <div className="cards-grid">
                      {users.filter(u => u.role === role).map(u => {
                        const assignedTools = tools.filter(t => t.assignedTo === u.id);
                        const isSelf = u.id === currentUser.id;
                        return (
                          <div key={u.id} style={{ background: "var(--surface)", border: `1px solid ${isSelf ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", transition: "all .2s" }}>
                            {/* TOP COLOR BAND */}
                            <div style={{ height: 6, background: role === "admin" ? "var(--accent)" : "var(--blue)" }} />
                            <div style={{ padding: 16 }}>
                              {/* AVATAR + NAME */}
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 12, background: role === "admin" ? "var(--accent)" : "var(--blue)", color: role === "admin" ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{u.avatar}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{u.name}{isSelf && <span style={{ fontSize: 10, background: "rgba(245,166,35,.2)", color: "var(--accent)", padding: "1px 6px", borderRadius: 8, marginLeft: 6, fontFamily: "var(--font-body)" }}>Moi</span>}</div>
                                  <span className={`role-tag role-${u.role}`} style={{ marginTop: 3, display: "inline-block" }}>{role === "admin" ? "Admin" : "Peintre"}</span>
                                </div>
                              </div>
                              {/* CONTACT */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                                {u.phone && <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>📞 {u.phone}</div>}
                                {u.email && <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>✉️ {u.email}</div>}
                              </div>
                              {/* OUTILS ASSIGNÉS (peintres) */}
                              {role === "viewer" && (
                                <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
                                  {assignedTools.length === 0
                                    ? <div style={{ fontSize: 11, color: "var(--muted)" }}>Aucun outil confié actuellement</div>
                                    : <>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Outils confiés</div>
                                        {assignedTools.map(t => (
                                          <div key={t.id} style={{ fontSize: 12, color: "var(--blue)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                            <span>{t.photo}</span> {t.name} <span style={{ color: "var(--muted)", fontSize: 10 }}>— {t.location}</span>
                                          </div>
                                        ))}
                                      </>
                                  }
                                </div>
                              )}
                              {/* DELETE */}
                              {!isSelf && (
                                <button className="btn btn-danger btn-sm" style={{ width: "100%", justifyContent: "center" }}
                                  onClick={() => {
                                    if (assignedTools.length > 0) { showToast("⚠️ Ce peintre a encore des outils confiés !", "warn"); return; }
                                    deleteDoc(doc(db, "users", String(u.id)));
                                    showToast("🗑 Profil supprimé");
                                  }}>
                                  🗑 Supprimer ce profil
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav">
        {isAdmin && (
          <button className={`bottom-nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}>
            <span className="bn-icon">📊</span>Stats
          </button>
        )}
        {isAdmin && (
          <button className={`bottom-nav-item ${page === "tools" ? "active" : ""}`} onClick={() => setPage("tools")}>
            <span className="bn-icon">🔧</span>Outils
          </button>
        )}
        {isAdmin && (
          <button className={`bottom-nav-item ${page === "chantiers" ? "active" : ""}`} onClick={() => setPage("chantiers")}>
            <span className="bn-icon">🏗</span>Chantiers
          </button>
        )}
        {!isAdmin && (
          <button className={`bottom-nav-item ${page === "mytools" ? "active" : ""}`} onClick={() => setPage("mytools")}>
            <span className="bn-icon">📦</span>Mes outils
          </button>
        )}
        <button className={`bottom-nav-item ${page === "messages" ? "active" : ""}`} onClick={() => setPage("messages")}>
          <span className="bn-icon">💬</span>Messages
          {unread > 0 && <span className="badge">{unread}</span>}
        </button>
        {isAdmin && (
          <button className={`bottom-nav-item ${page === "users" ? "active" : ""}`} onClick={() => setPage("users")}>
            <span className="bn-icon">👷</span>Équipe
          </button>
        )}
        <button className="bottom-nav-item" onClick={() => setCurrentUser(null)}>
          <span className="bn-icon">⇄</span>Profil
        </button>
      </nav>

      {/* ── MODALS ── */}
      {modal && (
        <ModalRouter modal={modal} setModal={setModal} users={users} tools={tools} setTools={setTools} viewers={viewers} chantiers={chantiers} currentUser={currentUser} addTool={addTool} addUser={addUser} assignTool={assignTool} />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast ${toast.type === "warn" ? "warn" : ""}`}>
          <div className="toast-text">{toast.text}</div>
        </div>
      )}
    </>
  );
}

// ─── MODAL ROUTER ─────────────────────────────────────────────────────────────
function ModalRouter({ modal, setModal, users, tools, setTools, viewers, chantiers, currentUser, addTool, addUser, assignTool }) {
  const isAdmin = currentUser.role === "admin";
  if (modal.type === "addTool") return <AddToolModal onClose={() => setModal(null)} onSave={addTool} />;
  if (modal.type === "addUser") return <AddUserModal onClose={() => setModal(null)} onSave={addUser} />;
  if (modal.type === "tool") return <ToolDetailModal tool={modal.data} onClose={() => setModal(null)} users={users} viewers={viewers} chantiers={chantiers} isAdmin={isAdmin} assignTool={assignTool} setTools={setTools} currentUser={currentUser} />;
  return null;
}

// ─── TOOL DETAIL MODAL ────────────────────────────────────────────────────────
function ToolDetailModal({ tool, onClose, users, viewers, chantiers, isAdmin, assignTool, setTools, currentUser }) {
  const [assignForm, setAssignForm] = useState({ viewerId: "", chantier: "" });
  const [moveForm, setMoveForm] = useState({ destination: "", newViewerId: "" });
  const assignee = users.find(u => u.id === tool.assignedTo);

  // ── FIL DE SUIVI OBSOLESCENCE ──
  const [newEntryNote, setNewEntryNote] = useState("");
  const [newEntryStatus, setNewEntryStatus] = useState(tool.obsoleteType || "suivi-cours");
  const [newEntryCost, setNewEntryCost] = useState("");
  const [declareDate, setDeclareDate] = useState(new Date().toISOString().slice(0,10));
  const threadRef = useRef();

  const STATUSES = [
    { val: "suivi-cours",   label: "🔎 Suivi en cours",              color: "#9b59b6" },
    { val: "remis",         label: "✅ Remis en service → Store",    color: "#27c97a" },
    { val: "obsolete-final",label: "⚫ Déclarer obsolète définitif", color: "#888"   },
  ];
  const getStatus = (val) => STATUSES.find(s => s.val === val) || STATUSES[0];

  const now = () => new Date().toLocaleString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const fmtCost = (v) => v ? `Rs ${Number(v).toLocaleString("fr-MU")}` : null;

  // Déclarer l'outil non fonctionnel (ouvrir le fil)
  const declareNonFunctional = async () => {
    const costNum = newEntryCost ? Number(String(newEntryCost).replace(/\s/g, "")) : null;
    const firstEntry = {
      id: Date.now(), type: "thread",
      status: "suivi-cours",
      note: newEntryNote || "Outil déclaré non fonctionnel.",
      cost: costNum,
      by: currentUser.name,
      datetime: now(),
      timestamp: Date.now(),
    };
    const histAction = `🔴 Déclaré non fonctionnel${costNum ? ` — Coût réparation : Rs ${costNum.toLocaleString("fr-MU")}` : ""}`;
    const updatedTool = {
      ...tool,
      status: "nonfunctional",
      obsolete: false,
      obsoleteDate: declareDate,
      obsoleteType: "suivi-cours",
      repairCost: costNum ?? tool.repairCost ?? null,
      totalRepairCost: costNum ? (tool.totalRepairCost || 0) + costNum : (tool.totalRepairCost || 0),
      obsoleteThread: [firstEntry],
      history: [...tool.history, { date: new Date().toLocaleDateString("fr-MU"), action: histAction, by: currentUser.name }],
    };
    await setDoc(doc(db, "tools", String(tool.id)), updatedTool);
    setNewEntryNote("");
    setNewEntryCost("");
    onClose();
  };

  // Ajouter une entrée au fil de suivi
  const addThreadEntry = async () => {
    if (!newEntryNote.trim() && newEntryStatus === tool.obsoleteType && !newEntryCost) return;
    const costNum = newEntryCost ? Number(String(newEntryCost).replace(/\s/g, "")) : null;
    const entry = {
      id: Date.now(), type: "thread",
      status: newEntryStatus,
      note: newEntryNote,
      cost: costNum,
      by: currentUser.name,
      datetime: now(),
      timestamp: Date.now(),
    };
    const statusChanged = newEntryStatus !== tool.obsoleteType;
    let newToolStatus = tool.status;
    if (newEntryStatus === "remis") newToolStatus = "store";
    else if (newEntryStatus === "obsolete-final") newToolStatus = "obsolete";
    else newToolStatus = "nonfunctional";

    let histAction = statusChanged ? `Statut changé → ${getStatus(newEntryStatus).label}` : "Note ajoutée";
    if (newEntryNote) histAction += ` — "${newEntryNote}"`;
    if (costNum) histAction += ` — Coût : Rs ${costNum.toLocaleString("fr-MU")}`;

    const updatedTool = {
      ...tool,
      status: newToolStatus,
      obsolete: newToolStatus === "obsolete",
      obsoleteType: newEntryStatus === "remis" ? null : newEntryStatus,
      repairCost: costNum ?? tool.repairCost ?? null,
      totalRepairCost: costNum ? (tool.totalRepairCost || 0) + costNum : (tool.totalRepairCost || 0),
      obsoleteThread: [...(tool.obsoleteThread || []), entry],
      history: [...tool.history, { date: new Date().toLocaleDateString("fr-MU"), action: histAction, by: currentUser.name }],
    };
    await setDoc(doc(db, "tools", String(tool.id)), updatedTool);
    setNewEntryNote("");
    setNewEntryCost("");
    setTimeout(() => threadRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 100);
  };

  const toggleObsolete = async () => {
    const updatedTool = {
      ...tool, obsolete: false, obsoleteDate: null, obsoleteType: null,
      obsoleteThread: tool.obsoleteThread || [],
      history: [...tool.history, { date: new Date().toLocaleDateString("fr-MU"), action: "↩ Remis en service manuellement", by: currentUser.name }],
    };
    await setDoc(doc(db, "tools", String(tool.id)), updatedTool);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{tool.photo} {tool.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* PHOTO */}
          {tool.photoUrl
            ? <img src={tool.photoUrl} alt={tool.name} className="tool-photo-detail" />
            : <div className="tool-photo-detail-placeholder">{tool.photo}</div>
          }
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-key">Fournisseur</div><div className="detail-val">{tool.ref || "—"}</div></div>
            <div className="detail-item"><div className="detail-key">Achat</div><div className="detail-val">{new Date(tool.purchaseDate).toLocaleDateString("fr-MU")}</div></div>
            <div className="detail-item"><div className="detail-key">Statut</div><div className="detail-val">
              {{ store: "🟢 En store", assigned: "🔵 Sur chantier", nonfunctional: "🔴 Non fonctionnel", obsolete: "⚫ Obsolète" }[tool.status] || tool.status}
            </div></div>
            <div className="detail-item" style={{ gridColumn: "1/-1" }}><div className="detail-key">Localisation</div><div className="detail-val">📍 {tool.location}</div></div>
            {assignee && <div className="detail-item" style={{ gridColumn: "1/-1" }}><div className="detail-key">Responsable</div><div className="detail-val">👷 {assignee.name}</div></div>}
            {tool.price && (
              <div className="detail-item" style={{ gridColumn: "1/-1", background: "rgba(232,82,10,.08)", border: "1px solid rgba(232,82,10,.25)" }}>
                <div className="detail-key">Valeur d'achat</div>
                <div style={{ marginTop: 4 }}>
                  <div className="price-tag-lg">🇲🇺 Rs {tool.price.toLocaleString("fr-MU")}</div>
                  <div className="price-warning">⚠️ En cas de perte ou dommage, le montant de <strong>Rs {tool.price.toLocaleString("fr-MU")}</strong> sera à rembourser par le responsable de l'outil. Merci d'en prendre soin.</div>
                </div>
              </div>
            )}
            {tool.totalRepairCost > 0 && (
              <div className="detail-item" style={{ gridColumn: "1/-1", background: "rgba(155,89,182,.08)", border: "1px solid rgba(155,89,182,.3)" }}>
                <div className="detail-key">Total réparations</div>
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(155,89,182,.15)", border: "1px solid rgba(155,89,182,.35)", borderRadius: 8, padding: "6px 14px" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#9b59b6" }}>🔧 Rs {tool.totalRepairCost.toLocaleString("fr-MU")}</span>
                  </div>
                  <div className="price-warning">Cumul de toutes les réparations effectuées sur cet outil.</div>
                </div>
              </div>
            )}
            {(tool.status === "nonfunctional" || tool.obsolete) && (
              <div className="detail-item" style={{ gridColumn: "1/-1", background: "rgba(120,120,140,.1)", border: "1px solid rgba(120,120,140,.3)" }}>
                <div className="detail-key">Statut réparation</div>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
                  {tool.obsoleteType && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: getStatus(tool.obsoleteType).color }}>
                      {getStatus(tool.obsoleteType).label}
                    </span>
                  )}
                  {tool.obsoleteDate && <div style={{ fontSize: 11, color: "var(--muted)" }}>Depuis le {fmt(tool.obsoleteDate)}</div>}
                  {tool.repairCost && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(232,82,10,.12)", border: "1px solid rgba(232,82,10,.3)", borderRadius: 8, padding: "5px 10px", marginTop: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#f07030" }}>🇲🇺 Coût réparation : Rs {tool.repairCost.toLocaleString("fr-MU")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="detail-item" style={{ gridColumn: "1/-1" }}><div className="detail-key">Description</div><div className="detail-val" style={{ fontSize: 13, fontWeight: 400 }}>{tool.description}</div></div>
          </div>

          {/* ADMIN ACTIONS CIRCULATION */}
          {isAdmin && tool.status === "store" && (
            <div className="assign-section">
              <h4>📤 Sortir du store → Chantier</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <select className="form-input" value={assignForm.viewerId} onChange={e => setAssignForm(p => ({ ...p, viewerId: e.target.value }))}>
                  <option value="">— Confier à (peintre) —</option>
                  {viewers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <select className="form-input" value={assignForm.chantier} onChange={e => setAssignForm(p => ({ ...p, chantier: e.target.value }))}>
                  <option value="">— Choisir un chantier —</option>
                  {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" disabled={!assignForm.viewerId || !assignForm.chantier} onClick={() => assignTool(tool.id, Number(assignForm.viewerId), assignForm.chantier, "out")}>Sortir & Confier</button>
              </div>
            </div>
          )}
          {isAdmin && tool.status === "assigned" && (
            <div className="assign-section">
              <h4>🔄 Mouvement de l'outil</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <select className="form-input" value={moveForm.destination} onChange={e => setMoveForm(p => ({ ...p, destination: e.target.value }))}>
                  <option value="">— Destination —</option>
                  <option value="Store">🏠 Retour Store</option>
                  {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select className="form-input" value={moveForm.newViewerId} onChange={e => setMoveForm(p => ({ ...p, newViewerId: e.target.value }))}>
                  <option value="">— Retour store (ou choisir nouveau peintre) —</option>
                  {viewers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <button className="btn btn-green btn-sm" disabled={!moveForm.destination} onClick={() => assignTool(tool.id, moveForm.newViewerId ? Number(moveForm.newViewerId) : null, moveForm.destination === "Store" ? null : moveForm.destination, moveForm.newViewerId ? "out" : "in")}>
                  {moveForm.newViewerId ? "Transférer à un autre peintre" : "Récupérer → Store"}
                </button>
              </div>
            </div>
          )}

          {/* ── FIL DE SUIVI OBSOLESCENCE ── */}
          {isAdmin && (
            <div style={{ background: "rgba(120,120,140,.07)", border: "1px solid rgba(120,120,140,.25)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "#aaa", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                🔴 Suivi réparation / non fonctionnel
                {(tool.status === "nonfunctional" || tool.status === "obsolete") && tool.obsoleteType && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: getStatus(tool.obsoleteType).color + "30", color: getStatus(tool.obsoleteType).color }}>{getStatus(tool.obsoleteType).label}</span>
                )}
              </div>

              {/* CAS 1 : PAS ENCORE NON FONCTIONNEL → formulaire de déclaration */}
              {tool.status !== "nonfunctional" && tool.status !== "obsolete" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Signaler un problème et ouvrir un fil de suivi :</div>
                  <input className="form-input" type="date" value={declareDate} onChange={e => setDeclareDate(e.target.value)} />
                  <div className="form-group">
                    <label className="form-label">🇲🇺 Coût de réparation estimé (Rs) — optionnel</label>
                    <input className="form-input" type="text" inputMode="numeric" placeholder="ex: 4 500"
                      value={newEntryCost}
                      onChange={e => {
                        const raw = e.target.value.replace(/\s/g,"").replace(/[^0-9]/g,"");
                        setNewEntryCost(raw.replace(/\B(?=(\d{3})+(?!\d))/g," "));
                      }}
                    />
                  </div>
                  <textarea className="form-input" rows={2} placeholder="Note : ex. câble coupé, moteur grillé, chute..." value={newEntryNote} onChange={e => setNewEntryNote(e.target.value)} />
                  <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.25)", color: "#f07030", alignSelf: "flex-start", border: "1px solid rgba(232,82,10,.4)" }} onClick={declareNonFunctional}>🔴 Ouvrir le suivi</button>
                </div>
              )}

              {/* CAS 2 : DÉJÀ OBSOLÈTE → fil de conversation */}
              {(tool.status === "nonfunctional" || tool.status === "obsolete") && (
                <>
                  {/* THREAD */}
                  <div ref={threadRef} style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, paddingRight: 4 }}>
                    {(tool.obsoleteThread || []).map((entry, i) => {
                      const st = getStatus(entry.status);
                      const isMe = entry.by === currentUser.name;
                      return (
                        <div key={entry.id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "88%", background: isMe ? "rgba(58,142,246,.15)" : "var(--surface2)", border: `1px solid ${isMe ? "rgba(58,142,246,.3)" : "var(--border)"}`, borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "8px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? "var(--blue)" : "var(--accent)" }}>{entry.by}</span>
                              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: st.color + "25", color: st.color, fontWeight: 700 }}>{st.label}</span>
                              {entry.cost && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(232,82,10,.2)", color: "#f07030", fontWeight: 700 }}>🇲🇺 Rs {entry.cost.toLocaleString("fr-MU")}</span>}
                            </div>
                            {entry.note && <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{entry.note}</div>}
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 5, textAlign: isMe ? "right" : "left" }}>{entry.datetime}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SAISIE NOUVELLE ENTRÉE */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>Mettre à jour le statut</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {STATUSES.map(s => (
                        <button key={s.val} onClick={() => setNewEntryStatus(s.val)} style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid`, fontSize: 11, fontWeight: 700, cursor: "pointer", background: newEntryStatus === s.val ? s.color + "25" : "var(--surface2)", borderColor: newEntryStatus === s.val ? s.color : "var(--border)", color: newEntryStatus === s.val ? s.color : "var(--muted)", transition: "all .15s" }}>{s.label}</button>
                      ))}
                    </div>
                    <input className="form-input" type="text" inputMode="numeric"
                      placeholder="🇲🇺 Coût réparation (Rs) — optionnel ex: 4 500"
                      value={newEntryCost}
                      onChange={e => {
                        const raw = e.target.value.replace(/\s/g,"").replace(/[^0-9]/g,"");
                        setNewEntryCost(raw.replace(/\B(?=(\d{3})+(?!\d))/g," "));
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <textarea className="form-input" rows={2} style={{ flex: 1, resize: "none" }}
                        placeholder={`Note de ${currentUser.name}...`}
                        value={newEntryNote} onChange={e => setNewEntryNote(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addThreadEntry(); } }}
                      />
                      <button className="btn btn-blue btn-sm" style={{ alignSelf: "flex-end", flexShrink: 0 }} onClick={addThreadEntry}>Envoyer</button>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* HISTORY */}
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>📋 Historique</div>
            <div className="history-list">
              {[...tool.history].reverse().map((h, i) => (
                <div key={i} className="history-item">
                  <div className="history-dot" />
                  <div>
                    <div className="history-text">{h.action}</div>
                    <div className="history-date">{h.date} — par {h.by}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADD TOOL MODAL ───────────────────────────────────────────────────────────
function AddToolModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", ref: "", purchaseDate: "", price: "", description: "", photo: "🔧", photoUrl: null });
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(p => ({ ...p, photoUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Ajouter un outil</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">

          {/* PHOTO UPLOAD */}
          <div className="form-group">
            <label className="form-label">📷 Photo de l'outil</label>
            <div className="photo-upload-zone" onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} />
              {form.photoUrl
                ? <img src={form.photoUrl} alt="aperçu" className="photo-preview" />
                : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 0" }}>
                    <span style={{ fontSize: 36 }}>📷</span>
                    <span>Cliquez pour choisir une photo depuis votre appareil</span>
                    <span style={{ fontSize: 11, opacity: .6 }}>JPG, PNG, HEIC — recommandé 800×600px</span>
                  </div>
              }
            </div>
            {form.photoUrl && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => setForm(p => ({ ...p, photoUrl: null }))}>
                🗑 Supprimer la photo
              </button>
            )}
          </div>

          <div className="form-row">
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Fournisseur</label><input className="form-input" value={form.ref} onChange={e => setForm(p => ({ ...p, ref: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Date d'achat</label><input className="form-input" type="date" value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} /></div>
          <div className="form-group">
            <label className="form-label">🇲🇺 Prix d'achat (Rs)</label>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              placeholder="ex: 20 000"
              value={form.price}
              onChange={e => {
                const raw = e.target.value.replace(/\s/g, "").replace(/[^0-9]/g, "");
                const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                setForm(p => ({ ...p, price: formatted }));
              }}
            />
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" disabled={!form.name} onClick={() => onSave(form)}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD USER MODAL ───────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSave }) {
  const APP_URL = "tool-track-rosy.vercel.app";
  const generatePin = () => String(Math.floor(1000 + Math.random() * 9000));
  const [form, setForm] = useState({ name: "", role: "viewer", phone: "", email: "", pin: generatePin() });
  const [saved, setSaved] = useState(false);
  const [savedUser, setSavedUser] = useState(null);

  const handleSave = async () => {
    const user = await onSave(form);
    setSavedUser({ ...form });
    setSaved(true);
  };

  const sendWhatsApp = () => {
    const msg = encodeURIComponent(
      `Bonjour ${savedUser.name} 👋\n\nTu es invité(e) sur *Tool Track* — l'app de gestion des outils.\n\n` +
      `📱 Installe l'app : https://${APP_URL}\n` +
      `👤 Ton profil : *${savedUser.name}*\n` +
      `🔑 Ton code PIN : *${savedUser.pin}*\n\n` +
      `_Sur ton téléphone, ouvre le lien dans Safari (iPhone) ou Chrome (Android) et ajoute-le à ton écran d'accueil pour l'avoir comme une vraie app !_`
    );
    const phone = savedUser.phone.replace(/\s/g, "").replace(/^\+/, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{saved ? "✅ Profil créé !" : "Nouveau profil"}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {!saved ? (
            <>
              <div className="form-group"><label className="form-label">Nom complet *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Rôle *</label>
                <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="viewer">Peintre / Spectateur</option>
                  <option value="admin">Admin / Responsable</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Téléphone WhatsApp</label><input className="form-input" placeholder="+230 ..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">🔑 Code PIN (4 chiffres)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="form-input" style={{ flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: 8, textAlign: "center" }}
                    maxLength={4} value={form.pin}
                    onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, pin: generatePin() }))}>🔄 Nouveau</button>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Ce PIN sera envoyé à la personne via WhatsApp</div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: savedUser.role === "admin" ? "var(--accent)" : "var(--blue)", color: savedUser.role === "admin" ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>
                {savedUser.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800 }}>{savedUser.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{savedUser.role === "admin" ? "🔑 Admin" : "🖌 Peintre"}</div>
              </div>
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 24px", width: "100%" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Code PIN</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 36, fontWeight: 800, color: "var(--accent)", letterSpacing: 8 }}>{savedUser.pin}</div>
              </div>
              {savedUser.phone && (
                <button className="btn btn-green" style={{ width: "100%", justifyContent: "center", fontSize: 15 }} onClick={sendWhatsApp}>
                  📲 Envoyer l'invitation via WhatsApp
                </button>
              )}
              {!savedUser.phone && (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Aucun téléphone renseigné — communiquez le PIN manuellement :<br/>
                  <strong style={{ color: "var(--accent)", fontSize: 18, letterSpacing: 4 }}>{savedUser.pin}</strong>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {!saved ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
              <button className="btn btn-primary" disabled={!form.name || form.pin.length !== 4} onClick={handleSave}>Créer le profil</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHANTIER PAGE ────────────────────────────────────────────────────────────
const CHANTIER_COLORS = ["#3a8ef6","#27c97a","#f5a623","#e84040","#9b59b6","#e67e22","#1abc9c","#e91e8c"];

function ChantierPage({ chantiers, tools, users, addChantier, deleteChantier }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CHANTIER_COLORS[0]);

  return (
    <>
      <div className="topbar"><h2>Chantiers</h2></div>
      <div className="content">

        {/* ADD CARD */}
        <div style={{ background: "var(--surface)", border: "1px dashed var(--accent)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, color: "var(--accent)", marginBottom: 12 }}>🏗 Nouveau chantier</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="Nom du chantier ex: Chantier Port-Louis Centre..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && newName.trim() && (addChantier(newName, newColor), setNewName(""))} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Couleur :</span>
              {CHANTIER_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: newColor === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer", flexShrink: 0 }} />
              ))}
            </div>
            <button className="btn btn-primary" disabled={!newName.trim()} onClick={() => { addChantier(newName, newColor); setNewName(""); }}>+ Créer</button>
          </div>
        </div>

        {/* CHANTIER CARDS */}
        {chantiers.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>Aucun chantier créé. Ajoutez-en un ci-dessus.</div>}
        <div className="cards-grid">
          {chantiers.map(c => {
            const toolsOnSite = tools.filter(t => t.location === c.name && t.status === "assigned");
            const peintreIds = [...new Set(toolsOnSite.map(t => t.assignedTo))];
            const peintres = peintreIds.map(id => users.find(u => u.id === id)).filter(Boolean);
            const isActive = toolsOnSite.length > 0;
            return (
              <div key={c.id} style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderTop: `4px solid ${c.color}`, borderRadius: 12, overflow: "hidden", transition: "all .2s" }}>
                <div style={{ padding: 16 }}>
                  {/* HEADER */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{c.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block", background: isActive ? "rgba(39,201,122,.15)" : "rgba(120,120,140,.12)", color: isActive ? "var(--green)" : "var(--muted)" }}>
                        {isActive ? "🟢 Actif" : "⚪ Inactif"}
                      </span>
                    </div>
                    <button onClick={() => deleteChantier(c.id)} title={isActive ? "Des outils sont encore sur ce chantier" : "Supprimer"} style={{ background: isActive ? "rgba(120,120,140,.1)" : "rgba(232,82,10,.1)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: isActive ? "not-allowed" : "pointer", fontSize: 15, opacity: isActive ? .4 : 1 }}>🗑</button>
                  </div>

                  {/* OUTILS */}
                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>🔧 Outils sur ce chantier ({toolsOnSite.length})</div>
                    {toolsOnSite.length === 0
                      ? <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Aucun outil actuellement</div>
                      : toolsOnSite.map(t => (
                          <div key={t.id} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            <span>{t.photo}</span>
                            <span style={{ color: "var(--text)" }}>{t.name}</span>
                            <span style={{ fontSize: 10, color: "var(--muted)" }}>({t.ref})</span>
                          </div>
                        ))
                    }
                  </div>

                  {/* PEINTRES */}
                  {peintres.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, width: "100%", marginBottom: 2 }}>👷 Peintres</div>
                      {peintres.map(p => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(58,142,246,.12)", border: "1px solid rgba(58,142,246,.2)", borderRadius: 20, padding: "3px 10px" }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, background: "var(--blue)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.avatar}</div>
                          <span style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600 }}>{p.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── PIN LOGIN ────────────────────────────────────────────────────────────────
function PinLogin({ user, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handlePin = (digit) => {
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);
    if (newPin.length === 4) {
      if (!user.pin || newPin === user.pin) {
        setTimeout(() => onSuccess(user), 200);
      } else {
        setError(true);
        setTimeout(() => { setPin(""); setError(false); }, 1000);
      }
    }
  };

  if (!open) {
    return (
      <div className="user-select-item" onClick={() => setOpen(true)}>
        <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0, background: user.role === "admin" ? "var(--accent)" : "var(--blue)", color: user.role === "admin" ? "#000" : "#fff" }}>{user.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{user.role === "admin" ? "🔑 Administrateur" : "🖌 Peintre"}</div>
        </div>
        <span style={{ fontSize: 18, color: "var(--muted)" }}>›</span>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 16, border: `1px solid ${error ? "var(--red)" : "var(--border)"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, background: user.role === "admin" ? "var(--accent)" : "var(--blue)", color: user.role === "admin" ? "#000" : "#fff" }}>{user.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: error ? "var(--red)" : "var(--muted)" }}>{error ? "❌ Code incorrect" : "Entrez votre PIN"}</div>
        </div>
        <button onClick={() => { setOpen(false); setPin(""); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>×</button>
      </div>
      {/* PIN DOTS */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? (error ? "var(--red)" : "var(--accent)") : "var(--border)", transition: "all .15s" }} />
        ))}
      </div>
      {/* KEYPAD */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
          <button key={i} onClick={() => {
            if (d === "⌫") { setPin(p => p.slice(0,-1)); setError(false); }
            else if (d !== "") handlePin(String(d));
          }}
          style={{ padding: "14px 0", borderRadius: 10, border: "1px solid var(--border)", background: d === "⌫" ? "rgba(232,82,10,.1)" : "var(--surface)", color: d === "⌫" ? "var(--red)" : "var(--text)", fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, cursor: d === "" ? "default" : "pointer", opacity: d === "" ? 0 : 1 }}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── FIRST ADMIN FORM ─────────────────────────────────────────────────────────
function FirstAdminForm({ onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(String(Math.floor(1000 + Math.random() * 9000)));

  const handleCreate = () => {
    if (!name.trim()) return;
    const initials = name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const id = String(Date.now());
    onSave({ id, name: name.trim(), role: "admin", avatar: initials, phone, email, pin });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      <div className="form-group">
        <label className="form-label">Votre nom *</label>
        <input className="form-input" placeholder="ex: Jean Dupont" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Téléphone</label>
        <input className="form-input" placeholder="+230 ..." value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" placeholder="vous@email.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">🔑 Votre code PIN *</label>
        <input className="form-input" style={{ fontSize: 22, fontWeight: 800, letterSpacing: 8, textAlign: "center" }}
          maxLength={4} placeholder="4 chiffres" value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Retenez bien ce PIN — il vous servira à vous connecter</div>
      </div>
      <button className="btn btn-primary" disabled={!name.trim() || pin.length !== 4} onClick={handleCreate} style={{ justifyContent: "center", marginTop: 4 }}>
        🚀 Créer et démarrer
      </button>
    </div>
  );
}
