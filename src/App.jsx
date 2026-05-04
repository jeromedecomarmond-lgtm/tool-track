import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";

// ─── HOOK LOADING BUTTON ──────────────────────────────────────────────────────
// Rend un bouton temporairement inactif après confirmation pour éviter les doublons
function useLoadingBtn() {
  const [loading, setLoading] = useState(false);
  const trigger = useCallback(async (fn) => {
    if (loading) return;
    setLoading(true);
    try { await fn(); } finally {
      // Redevient actif après 2 secondes ou quand le composant se remonte
      setTimeout(() => setLoading(false), 2000);
    }
  }, [loading]);
  return [loading, trigger];
}

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
  .btn:disabled, .btn.loading { opacity: .35; cursor: not-allowed; pointer-events: none; filter: grayscale(.4); }
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
  .tool-photo-card { width: 100%; height: auto; max-height: 120px; object-fit: contain; background: var(--surface2); display: block; }
  .tool-photo-placeholder { width: 100%; height: 80px; background: var(--surface2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--muted); font-size: 13px; }
  .tool-photo-placeholder .big-emoji { font-size: 30px; }
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
  const [requests, setRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
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

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const unread = messages.filter(m => !m.read && String(m.from) !== String(currentUser?.id)).length;

  // ── FILTRAGE PAR COMPAGNIE ───────────────────────────────────────────────────
  const myCompanyId = currentUser?.companyId || null;
  const filteredUsers = isSuperAdmin ? users : users.filter(u => u.companyId === myCompanyId);
  const filteredTools = isSuperAdmin ? tools : tools.filter(t => t.companyId === myCompanyId);
  const filteredChantiers = isSuperAdmin ? chantiers : chantiers.filter(c => c.companyId === myCompanyId);
  const filteredRequests = isSuperAdmin ? requests : requests.filter(r => r.companyId === myCompanyId);
  const pendingRequests = filteredRequests.filter(r => r.status === "pending").length;
  const viewers = filteredUsers.filter(u => u.role === "viewer");
  const myTools = filteredTools.filter(t => String(t.assignedTo) === String(currentUser?.id));
  const myCompany = companies.find(c => c.id === myCompanyId);

  // ── SESSION PERSISTANTE ──────────────────────────────────────────────────────
  // Sauvegarde l'utilisateur connecté dans le navigateur
  const loginUser = (u) => {
    setCurrentUser(u);
    setPage(u.role === "admin" || u.role === "superadmin" ? "tools" : "mytools");
    try { localStorage.setItem("tooltrack_user_id", u.id); } catch(e) {}
  };
  const logoutUser = () => {
    setCurrentUser(null);
    try { localStorage.removeItem("tooltrack_user_id"); } catch(e) {}
  };

  // ── FIREBASE REAL-TIME SYNC ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [];
    let loaded = 0;
    const checkLoaded = () => { loaded++; if (loaded >= 2) setLoading(false); };

    unsubs.push(onSnapshot(collection(db, "users"), snap => {
      const loadedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(loadedUsers);
      try {
        const savedId = localStorage.getItem("tooltrack_user_id");
        if (savedId) {
          const savedUser = loadedUsers.find(u => u.id === savedId);
          if (savedUser) {
            setCurrentUser(savedUser);
            setPage(savedUser.role === "admin" || savedUser.role === "superadmin" ? "tools" : "mytools");
          } else {
            // User not found in Firebase — clear invalid session
            localStorage.removeItem("tooltrack_user_id");
          }
        }
      } catch(e) {}
      checkLoaded();
    }));
    unsubs.push(onSnapshot(collection(db, "tools"), snap => {
      setTools(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      checkLoaded();
    }));
    unsubs.push(onSnapshot(collection(db, "chantiers"), snap => {
      setChantiers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }));
    unsubs.push(onSnapshot(collection(db, "messages"), snap => {
      setMessages(snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date)));
    }));
    unsubs.push(onSnapshot(collection(db, "requests"), snap => {
      setRequests(snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date)));
    }));
    unsubs.push(onSnapshot(collection(db, "companies"), snap => {
      setCompanies(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  // Simulated reminders check
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      tools.forEach(t => {
        if (t.status === "assigned" && String(t.assignedTo) === String(currentUser?.id)) {
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

  // ── COMPANY BLOCKED SCREEN ──────────────────────────────────────────────────
  if (currentUser && !isSuperAdmin && myCompany && myCompany.active === false) {
    const contactEmail = myCompany.contactEmail || "";
    return (
      <>
        <style>{css}</style>
        <div className="login-screen">
          <div className="login-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>⏸</div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: "var(--red)", marginBottom: 8 }}>Compte suspendu</div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
              L'accès à <strong>{myCompany.name}</strong> a été suspendu.
              {myCompany.suspendReason === "expiration" && (
                <div style={{ marginTop: 8, color: "var(--accent)" }}>
                  Pour renouveler votre accès, envoyez votre preuve de paiement à :<br/>
                  <strong style={{ fontSize: 16 }}>{contactEmail || "Contactez votre administrateur"}</strong>
                </div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={logoutUser}>⇄ Changer de compte</button>
          </div>
        </div>
      </>
    );
  }

  // ── EXPIRY WARNING (5 days before) ──────────────────────────────────────────
  const daysLeft = myCompany?.expiryDate ? Math.ceil((new Date(myCompany.expiryDate) - new Date()) / (1000*60*60*24)) : null;
  const showExpiryWarning = !isSuperAdmin && myCompany && daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

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
        <LoginScreen
          users={users}
          companies={companies}
          onLogin={loginUser}
          db={db}
        />
      </>
    );
  }

  // ── TOOL DETAIL MODAL ───────────────────────────────────────────────────────
  const openTool = (tool) => setModal({ type: "tool", data: tool });

  // ── DELETE TOOL ─────────────────────────────────────────────────────────────
  const deleteTool = async (toolId) => {
    await deleteDoc(doc(db, "tools", String(toolId)));
    showToast("🗑 Outil supprimé");
    setModal(null);
  };

  // ── UPDATE TOOL ─────────────────────────────────────────────────────────────
  const updateTool = async (toolId, updates) => {
    const tool = filteredTools.find(t => String(t.id) === String(toolId));
    if (!tool) return;
    await setDoc(doc(db, "tools", String(toolId)), { ...tool, ...updates });
    showToast("✅ Outil mis à jour");
    setModal(null);
  };

  // ── ASSIGN TOOL ─────────────────────────────────────────────────────────────
  const assignTool = async (toolId, viewerId, chantier, direction) => {
    const newViewer = viewerId ? users.find(u => String(u.id) === String(viewerId)) : null;
    const tool = tools.find(t => t.id === toolId);
    const prevOwner = tool.assignedTo ? users.find(u => String(u.id) === String(tool.assignedTo)) : null;
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
      assignedTo: newViewer ? String(viewerId) : null,
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
      companyId: myCompanyId || null,
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
    const newUser = { id, name: form.name, role: form.role, avatar: initials, phone: form.phone || "", email: form.email || "", pin: form.pin, companyId: myCompanyId || null };
    await setDoc(doc(db, "users", id), newUser);
    showToast("✅ Profil créé");
    return newUser;
  };

  // ── CHANTIERS CRUD ───────────────────────────────────────────────────────────
  const addChantier = async (name, color) => {
    if (!name.trim()) return;
    const id = String(Date.now());
    await setDoc(doc(db, "chantiers", id), { id, name: name.trim(), color, companyId: myCompanyId || null });
    showToast("✅ Chantier ajouté");
  };
  const deleteChantier = async (id) => {
    const c = chantiers.find(c => c.id === id);
    const toolsOnSite = tools.filter(t => t.location === c?.name && t.status === "assigned");
    if (toolsOnSite.length > 0) {
      const toolNames = toolsOnSite.map(t => `• ${t.name}`).join("\n");
      window.alert(
        `⚠️ Impossible de supprimer "${c?.name}"\n\n` +
        `${toolsOnSite.length} outil${toolsOnSite.length > 1 ? "s sont encore" : " est encore"} sur ce chantier :\n\n${toolNames}\n\n` +
        `Retournez ces outils au store ou transférez-les avant de supprimer ce chantier.`
      );
      return;
    }
    if (!window.confirm(`Supprimer le chantier "${c?.name}" ?`)) return;
    await deleteDoc(doc(db, "chantiers", String(id)));
    showToast("🗑 Chantier supprimé");
  };

  // ── SEND REQUEST ─────────────────────────────────────────────────────────────
  const sendRequest = async ({ type, toolId, toolName, toolLocation, targetViewerId, targetViewerName, targetChantier, note }) => {
    const id = String(Date.now());
    const today = new Date().toLocaleString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    // For non-functional — apply immediately + notify
    if (type === "nonfunctional") {
      const tool = tools.find(t => String(t.id) === String(toolId));
      if (tool) {
        const firstEntry = { id: Date.now(), type: "thread", status: "suivi-cours", note: note || "Signalé non fonctionnel.", by: currentUser.name, datetime: today, timestamp: Date.now() };
        const updatedTool = {
          ...tool, status: "nonfunctional", obsolete: false,
          obsoleteDate: new Date().toISOString().slice(0,10),
          obsoleteType: "suivi-cours", obsoleteThread: [firstEntry],
          history: [...tool.history, { date: new Date().toLocaleDateString("fr-MU"), action: `🔴 Signalé non fonctionnel par ${currentUser.name}${note ? ` — "${note}"` : ""}`, by: currentUser.name }],
        };
        await setDoc(doc(db, "tools", String(toolId)), updatedTool);
      }
      // Auto message to admins
      await setDoc(doc(db, "messages", id), {
        id, from: currentUser.id, to: null, type: "push",
        text: `⚠️ ${currentUser.name} a signalé "${toolName}" NON FONCTIONNEL.${note ? ` — "${note}"` : ""} Merci de prendre en charge.`,
        toolId: String(toolId), date: new Date().toISOString(), read: false,
      });
      showToast("⚠️ Signalement envoyé aux admins");
      return;
    }

    // For transfer / return — create pending request
    const reqText = type === "transfer"
      ? `🔄 ${currentUser.name} demande de transférer "${toolName}" (${toolLocation}) → ${targetViewerName} — ${targetChantier}${note ? ` — "${note}"` : ""}`
      : `🏠 ${currentUser.name} demande le retour au store de "${toolName}" (${toolLocation})${note ? ` — "${note}"` : ""}`;

    await setDoc(doc(db, "requests", id), {
      id, type, status: "pending",
      from: currentUser.id, fromName: currentUser.name,
      toolId: String(toolId), toolName, toolLocation,
      targetViewerId: targetViewerId ? String(targetViewerId) : null,
      targetViewerName: targetViewerName || null,
      targetChantier: targetChantier || null,
      note: note || "", text: reqText,
      date: new Date().toISOString(),
      companyId: myCompanyId || null,
    });
    showToast("📨 Demande envoyée aux admins !");
  };
  const displayedTools = filteredTools.filter(t => {
    const matchStatus = filterStatus === "all" ? true : t.status === filterStatus;
    // Employé ET chantier sont mutuellement exclusifs — un seul actif à la fois
    const matchEmployé = filterUser === "all" || String(t.assignedTo) === filterUser || (filterUser === "none" && !t.assignedTo);
    const matchChantier = filterChantier === "all" || t.location === filterChantier;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.ref.toLowerCase().includes(search.toLowerCase());
    if (!isAdmin) return String(t.assignedTo) === String(currentUser.id) || t.status === "store";
    return matchStatus && matchEmployé && matchChantier && matchSearch;
  });

  // filteredTools, filteredUsers, viewers, myTools — définis plus haut avec filtrage compagnie

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* EXPIRY WARNING BANNER */}
      {showExpiryWarning && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "rgba(245,166,35,.95)", color: "#000", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span>
            Votre accès expire dans <strong>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</strong>.
            Envoyez votre preuve de paiement à <strong>{myCompany.contactEmail || "votre administrateur"}</strong> pour renouveler.
          </span>
        </div>
      )}

      {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>TOOL<br />TRACK</h1>
            <p>Gestion d'outils</p>
          </div>
          <nav className="sidebar-nav">
            {isAdmin && <button className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}><span className="icon">📊</span><span>Dashboard</span></button>}
            {isSuperAdmin && <button className={`nav-item ${page === "companies" ? "active" : ""}`} onClick={() => setPage("companies")}><span className="icon">🏢</span><span>Compagnies</span></button>}
            {isAdmin && !isSuperAdmin && <button className={`nav-item ${page === "tools" ? "active" : ""}`} onClick={() => setPage("tools")}><span className="icon">🔧</span><span>Outils</span></button>}
            {isAdmin && !isSuperAdmin && <button className={`nav-item ${page === "chantiers" ? "active" : ""}`} onClick={() => setPage("chantiers")}><span className="icon">🏗</span><span>Chantiers</span></button>}
            {!isAdmin && <button className={`nav-item ${page === "mytools" ? "active" : ""}`} onClick={() => setPage("mytools")}><span className="icon">📦</span><span>Mes outils</span></button>}
            {!isAdmin && <button className={`nav-item ${page === "parc" ? "active" : ""}`} onClick={() => setPage("parc")}><span className="icon">🔧</span><span>Parc outils</span></button>}
            <button className={`nav-item ${page === "requests" ? "active" : ""}`} onClick={() => setPage("requests")}>
              <span className="icon">🔔</span><span>Demandes</span>
              {pendingRequests > 0 && <span className="badge">{pendingRequests}</span>}
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
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8, justifyContent: "center" }} onClick={logoutUser}>⇄ Changer</button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main">
          {/* ── COMPANIES (SUPERADMIN ONLY) ── */}
          {page === "companies" && isSuperAdmin && (
            <CompaniesPage
              companies={companies}
              users={users}
              tools={tools}
              chantiers={chantiers}
              requests={requests}
              db={db}
              currentUser={currentUser}
              showToast={showToast}
              onAdminCreated={(admin) => {
                setModal({ type: "whatsappInvite", data: admin });
              }}
            />
          )}

          {/* ── DASHBOARD ── */}
          {page === "dashboard" && isAdmin && (
            <>
              <div className="topbar"><h2>📊 Dashboard</h2></div>
              <div className="content">

                {isSuperAdmin ? (
                  <>
                    {/* ── STATS GLOBALES ── */}
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--accent)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Vue globale</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
                      {[
                        { label: "🏢 Compagnies", value: companies.length, color: "var(--accent)" },
                        { label: "👷 Équipes total", value: users.filter(u => u.role !== "superadmin").length, color: "var(--green)" },
                        { label: "🏗 Chantiers actifs", value: chantiers.length, color: "var(--blue)" },
                        { label: "⏳ Demandes en attente", value: requests.filter(r => r.status === "pending").length, color: "var(--accent)" },
                        { label: "⏸ Compagnies suspendues", value: companies.filter(c => c.active === false).length, color: "var(--red)" },
                      ].map(s => (
                        <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                          <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, lineHeight: 1.3 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* OUTILS SUMMARY */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800 }}>🔧 Outils — {tools.length} au total</div>
                        <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>🇲🇺 Rs {tools.reduce((s,t) => s + (t.price||0), 0).toLocaleString("fr-MU")}</div>
                      </div>
                      {/* BARRE DE RÉPARTITION */}
                      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 12, marginBottom: 10 }}>
                        {[
                          { status: "store", color: "var(--green)" },
                          { status: "assigned", color: "var(--blue)" },
                          { status: "nonfunctional", color: "#f07030" },
                          { status: "obsolete", color: "#666" },
                        ].map(s => {
                          const count = tools.filter(t => t.status === s.status).length;
                          const pct = tools.length > 0 ? (count / tools.length) * 100 : 0;
                          return pct > 0 ? <div key={s.status} style={{ width: `${pct}%`, background: s.color }} /> : null;
                        })}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {[
                          { label: "🟢 En store", value: tools.filter(t => t.status === "store").length, color: "var(--green)" },
                          { label: "🔵 Sur chantiers", value: tools.filter(t => t.status === "assigned").length, color: "var(--blue)" },
                          { label: "🔴 Non fonct.", value: tools.filter(t => t.status === "nonfunctional").length, color: "#f07030" },
                          { label: "⚫ Obsolètes", value: tools.filter(t => t.status === "obsolete").length, color: "#666" },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: "center" }}>
                            <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── DÉTAILS PAR COMPAGNIE ── */}
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--accent)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Par compagnie</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {companies.map(company => {
                        const cTools = tools.filter(t => t.companyId === company.id);
                        const cUsers = users.filter(u => u.companyId === company.id);
                        const cChantiers = chantiers.filter(c => c.companyId === company.id);
                        const cRequests = requests.filter(r => r.companyId === company.id && r.status === "pending");
                        const isActive = company.active !== false;
                        const daysLeft = company.expiryDate ? Math.ceil((new Date(company.expiryDate) - new Date()) / (1000*60*60*24)) : null;

                        return (
                          <div key={company.id} style={{ background: "var(--surface)", border: `1px solid ${isActive ? "var(--border)" : "rgba(232,82,10,.3)"}`, borderRadius: 12, overflow: "hidden" }}>
                            {/* COLOR BAR */}
                            <div style={{ height: 4, background: company.color || "var(--accent)" }} />
                            <div style={{ padding: "12px 16px" }}>
                              {/* HEADER */}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ width: 36, height: 36, borderRadius: 8, background: company.color || "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
                                  <div>
                                    <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800 }}>{company.name}</div>
                                    <div style={{ fontSize: 10, color: isActive ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                                      {isActive ? "🟢 Active" : "⏸ Suspendue"}
                                      {daysLeft !== null && isActive && daysLeft <= 10 && (
                                        <span style={{ color: daysLeft <= 3 ? "var(--red)" : "var(--accent)", marginLeft: 8 }}>
                                          ⚠️ Expire dans {daysLeft}j
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {cRequests.length > 0 && (
                                  <span style={{ background: "rgba(245,166,35,.2)", color: "var(--accent)", fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>
                                    🔔 {cRequests.length} demande{cRequests.length > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>

                              {/* STATS GRID */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                                {[
                                  { label: "👷 Équipe", value: cUsers.length, color: "var(--blue)" },
                                  { label: "🔧 Outils", value: cTools.length, color: "var(--accent)" },
                                  { label: "🏗 Chantiers", value: cChantiers.length, color: "var(--green)" },
                                  { label: "🟢 Store", value: cTools.filter(t => t.status === "store").length, color: "var(--green)" },
                                  { label: "🔵 Chantiers", value: cTools.filter(t => t.status === "assigned").length, color: "var(--blue)" },
                                  { label: "🔴 Non fonct.", value: cTools.filter(t => t.status === "nonfunctional").length, color: "#f07030" },
                                  { label: "👑 Admins", value: cUsers.filter(u => u.role === "admin").length, color: "var(--accent)" },
                                  { label: "👷 Employés", value: cUsers.filter(u => u.role === "viewer").length, color: "var(--muted)" },
                                ].map(s => (
                                  <div key={s.label} style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
                                  </div>
                                ))}
                              </div>

                              {/* VALEUR TOTALE OUTILS */}
                              {cTools.length > 0 && (
                                <div style={{ marginTop: 10, background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Valeur totale du parc</div>
                                  <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
                                    🇲🇺 Rs {cTools.reduce((sum, t) => sum + (t.price || 0), 0).toLocaleString("fr-MU")}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  // ── DASHBOARD ADMIN NORMAL ──
                  <>
                    <div className="stats-grid">
                      <div className="stat-card"><div className="stat-num stat-accent">{filteredTools.length}</div><div className="stat-label">Outils total</div></div>
                      <div className="stat-card"><div className="stat-num stat-green">{filteredTools.filter(t => t.status === "store").length}</div><div className="stat-label">🟢 En store</div></div>
                      <div className="stat-card"><div className="stat-num stat-blue">{filteredTools.filter(t => t.status === "assigned").length}</div><div className="stat-label">🔵 Chantiers</div></div>
                      <div className="stat-card"><div className="stat-num" style={{ color: "#f07030" }}>{filteredTools.filter(t => t.status === "nonfunctional").length}</div><div className="stat-label">🔴 Non fonctionnels</div></div>
                      <div className="stat-card"><div className="stat-num" style={{ color: "#aaa" }}>{filteredTools.filter(t => t.status === "obsolete").length}</div><div className="stat-label">⚫ Obsolètes</div></div>
                      <div className="stat-card"><div className="stat-num stat-red">{filteredRequests.filter(r => r.status === "pending").length}</div><div className="stat-label">⏳ Demandes</div></div>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Outils sur chantiers</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredTools.filter(t => t.status === "assigned").map(t => {
                        const assignee = filteredUsers.find(u => String(u.id) === String(t.assignedTo));
                        return (
                          <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 22 }}>{t.photo}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                              <div style={{ fontSize: 12, color: "var(--muted)" }}>📍 {t.location} — 👷 {assignee?.name || "—"}</div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => openTool(t)}>Détails</button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
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
                    <option value="all">Tous les employés</option>
                    <option value="none">Non assigné</option>
                    {viewers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <select className="form-input" style={{ width: "auto", fontSize: 12 }} value={filterChantier} onChange={e => { setFilterChantier(e.target.value); setFilterUser("all"); }}>
                    <option value="all">Tous les chantiers</option>
                    <option value="Store">Store</option>
                    {filteredChantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="cards-grid">
                  {displayedTools.length === 0 && (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Aucun outil</div>
                      <div style={{ fontSize: 13 }}>Cliquez sur "+ Ajouter un outil" pour commencer</div>
                    </div>
                  )}
                  {displayedTools.map(t => {
                    const assignee = users.find(u => String(u.id) === String(t.assignedTo));
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
              <div className="topbar">
                <h2>📦 Mes outils</h2>
                <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                  {myTools.length === 0 ? "Aucun outil confié" : `${myTools.length} outil${myTools.length > 1 ? "s" : ""} sous ma responsabilité`}
                </span>
              </div>
              <div className="content">
                {myTools.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Aucun outil confié</div>
                    <div style={{ fontSize: 13 }}>Un admin vous assignera un outil bientôt.</div>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {myTools.map(t => (
                      <ViewerToolCard
                        key={t.id}
                        tool={t}
                        currentUser={currentUser}
                        users={users}
                        viewers={viewers}
                        chantiers={chantiers}
                        onOpen={() => openTool(t)}
                        onRequest={sendRequest}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── PARC OUTILS (VIEWER) ── */}
          {page === "parc" && !isAdmin && (
            <>
              <div className="topbar"><h2>🔧 Parc outils</h2></div>
              <div className="content">

                {/* STATS RAPIDES */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "🟢 En store", count: filteredTools.filter(t => t.status === "store").length, color: "var(--green)" },
                    { label: "🔵 Sur chantiers", count: filteredTools.filter(t => t.status === "assigned").length, color: "var(--blue)" },
                    { label: "🔴 Non fonctionnel", count: filteredTools.filter(t => t.status === "nonfunctional").length, color: "#f07030" },
                    { label: "📦 Mes outils", count: myTools.length, color: "var(--accent)" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* OUTILS EN STORE */}
                {filteredTools.filter(t => t.status === "store").length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--green)", marginBottom: 10 }}>🟢 Disponibles au store</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredTools.filter(t => t.status === "store").map(t => (
                        <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 24 }}>{t.photo}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>📍 Store{t.price ? ` · Rs ${t.price.toLocaleString("fr-MU")}` : ""}</div>
                          </div>
                          <span style={{ fontSize: 11, background: "rgba(39,201,122,.15)", color: "var(--green)", padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>Dispo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OUTILS SUR CHANTIERS — avec option demande */}
                {filteredTools.filter(t => t.status === "assigned").length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--blue)", marginBottom: 10 }}>🔵 Sur chantiers</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredTools.filter(t => t.status === "assigned").map(t => {
                        const assignee = users.find(u => String(u.id) === String(t.assignedTo));
                        const isMyTool = String(t.assignedTo) === String(currentUser.id);
                        return (
                          <ParcToolRow
                            key={t.id} tool={t} assignee={assignee}
                            isMyTool={isMyTool} currentUser={currentUser}
                            onAsk={sendRequest}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* OUTILS NON FONCTIONNELS */}
                {filteredTools.filter(t => t.status === "nonfunctional").length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "#f07030", marginBottom: 10 }}>🔴 Non fonctionnels</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredTools.filter(t => t.status === "nonfunctional").map(t => (
                        <div key={t.id} style={{ background: "var(--surface)", border: "1px solid rgba(232,82,10,.3)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, opacity: 0.75 }}>
                          <span style={{ fontSize: 24 }}>{t.photo}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: "#f07030" }}>🔎 Suivi en cours · {t.location}</div>
                          </div>
                          <span style={{ fontSize: 11, background: "rgba(232,82,10,.15)", color: "#f07030", padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>En répa.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CHANTIERS ── */}
          {page === "chantiers" && isAdmin && (
            <ChantierPage chantiers={filteredChantiers} tools={filteredTools} users={filteredUsers} addChantier={addChantier} deleteChantier={deleteChantier} />
          )}

          {/* ── DEMANDES ── */}
          {page === "requests" && (
            <>
              <div className="topbar">
                <h2>🔔 Demandes</h2>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{filteredRequests.filter(r => r.status === "pending").length} en attente</span>
              </div>
              <div className="content">
                {filteredRequests.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
                    <div>Aucune demande pour le moment</div>
                  </div>
                )}

                {isSuperAdmin ? (
                  // ── SUPERADMIN — lecture seule, groupé par compagnie, chrono + WhatsApp ──
                  companies.map(company => {
                    const companyRequests = requests.filter(r => r.companyId === company.id);
                    if (companyRequests.length === 0) return null;
                    const companyAdmins = users.filter(u => u.companyId === company.id && u.role === "admin");
                    return (
                      <div key={company.id} style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: company.color || "var(--accent)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                          🏢 {company.name}
                          <span style={{ fontSize: 11, background: (company.color || "var(--accent)") + "22", color: company.color || "var(--accent)", padding: "2px 8px", borderRadius: 20 }}>
                            {companyRequests.filter(r => r.status === "pending").length} en attente
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {companyRequests.map(r => {
                            const tool = tools.find(t => String(t.id) === String(r.toolId));
                            const isPending = r.status === "pending";
                            // Calculate time since request
                            const hoursAgo = Math.floor((Date.now() - new Date(r.date)) / (1000*60*60));
                            const timeLabel = hoursAgo < 1 ? "< 1h" : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.floor(hoursAgo/24)}j`;
                            const timeColor = hoursAgo > 48 ? "var(--red)" : hoursAgo > 24 ? "var(--accent)" : "var(--green)";
                            return (
                              <div key={r.id} style={{ background: "var(--surface)", borderRadius: 10, padding: 14, border: `1px solid ${isPending ? "var(--border)" : "var(--surface2)"}`, opacity: isPending ? 1 : 0.6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: isPending ? "rgba(245,166,35,.2)" : r.status === "approved" ? "rgba(39,201,122,.2)" : "rgba(232,82,10,.2)", color: isPending ? "var(--accent)" : r.status === "approved" ? "var(--green)" : "var(--red)" }}>
                                      {isPending ? "⏳ En attente" : r.status === "approved" ? "✅ Approuvé" : "❌ Refusé"}
                                    </span>
                                    {/* CHRONOMETRE */}
                                    {isPending && (
                                      <span style={{ fontSize: 11, fontWeight: 700, color: timeColor, background: timeColor + "22", padding: "2px 8px", borderRadius: 20 }}>
                                        ⏱ {timeLabel}
                                      </span>
                                    )}
                                  </div>
                                  {tool && <span style={{ fontSize: 18 }}>{tool.photo}</span>}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 8 }}>{r.text}</div>
                                {r.adminNote && (
                                  <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
                                    💬 {r.adminNote}
                                  </div>
                                )}
                                {/* WHATSAPP REMINDER — only for pending requests */}
                                {isPending && companyAdmins.length > 0 && (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                    {companyAdmins.map(admin => (
                                      <button key={admin.id} className="btn btn-sm" style={{ background: "rgba(37,211,102,.15)", color: "#25d366", fontSize: 11 }}
                                        onClick={() => {
                                          const msg = encodeURIComponent(
                                            `📋 *TOOL TRACK — Rappel demande en attente*\n\n` +
                                            `Bonjour ${admin.name},\n\n` +
                                            `Une demande attend votre réponse depuis *${timeLabel}* sur Tool Track :\n\n` +
                                            `"${r.text}"\n\n` +
                                            `Merci de traiter cette demande dès que possible.\n` +
                                            `📱 https://tool-track-rosy.vercel.app`
                                          );
                                          const phone = admin.phone?.replace(/\s/g,"").replace(/^\+/,"") || "";
                                          window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
                                        }}>
                                        📲 Rappel → {admin.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // ── ADMIN / EMPLOYÉ — actions normales ──
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredRequests.map(r => {
                      const tool = tools.find(t => String(t.id) === String(r.toolId));
                      const isPending = r.status === "pending";
                      return (
                        <div key={r.id} style={{
                          background: "var(--surface)", borderRadius: 12, padding: 16,
                          border: `1px solid ${isPending ? "var(--accent)" : r.status === "approved" ? "var(--green)" : "var(--red)"}`,
                          opacity: isPending ? 1 : 0.7,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: isPending ? "rgba(245,166,35,.2)" : r.status === "approved" ? "rgba(39,201,122,.2)" : "rgba(232,82,10,.2)", color: isPending ? "var(--accent)" : r.status === "approved" ? "var(--green)" : "var(--red)" }}>
                                {isPending ? "⏳ En attente" : r.status === "approved" ? "✅ Approuvé" : "❌ Refusé"}
                              </span>
                              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{new Date(r.date).toLocaleString("fr-MU")}</div>
                            </div>
                            {tool && <span style={{ fontSize: 20 }}>{tool.photo}</span>}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 10 }}>{r.text}</div>
                          {r.adminNote && (
                            <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
                              💬 Admin : "{r.adminNote}"
                            </div>
                          )}
                          {isAdmin && isPending && (
                            <RequestActions
                              request={r}
                              tool={tool}
                              onApprove={async (adminNote) => {
                                if (r.type === "transfer" && tool) {
                                  await setDoc(doc(db, "tools", String(tool.id)), {
                                    ...tool, status: "assigned", assignedTo: String(r.targetViewerId), location: r.targetChantier,
                                    history: [...(tool.history || []), { date: new Date().toLocaleDateString("fr-MU"), action: `✅ Transfert approuvé → ${r.targetViewerName} (${r.targetChantier}) — par ${currentUser.name}`, by: currentUser.name }],
                                  });
                                } else if (r.type === "return" && tool) {
                                  await setDoc(doc(db, "tools", String(tool.id)), {
                                    ...tool, status: "store", assignedTo: null, location: "Store",
                                    history: [...(tool.history || []), { date: new Date().toLocaleDateString("fr-MU"), action: `✅ Retour store approuvé — par ${currentUser.name}`, by: currentUser.name }],
                                  });
                                }
                                await setDoc(doc(db, "requests", r.id), { ...r, status: "approved", adminNote: adminNote || "", approvedBy: currentUser.name, approvedAt: new Date().toISOString() });
                                showToast("✅ Demande approuvée !");
                              }}
                              onRefuse={async (adminNote) => {
                                await setDoc(doc(db, "requests", r.id), { ...r, status: "refused", adminNote: adminNote || "", refusedBy: currentUser.name, refusedAt: new Date().toISOString() });
                                showToast("❌ Demande refusée");
                              }}
                            />
                          )}
                          {!isAdmin && (
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>
                              {isPending ? "⏳ En attente d'approbation par un admin" : r.status === "approved" ? `✅ Approuvé par ${r.approvedBy}` : `❌ Refusé par ${r.refusedBy}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── MESSAGES ── */}
          {page === "messages" && (
            <MessagesPage
              currentUser={currentUser}
              users={users}
              tools={tools}
              myTools={myTools}
              db={db}
              showToast={showToast}
            />
          )}

          {/* ── USERS (ADMIN ONLY) ── */}
          {page === "users" && isAdmin && (
            <>
              <div className="topbar"><h2>Équipe</h2>{!isSuperAdmin && <button className="btn btn-primary" onClick={() => setModal({ type: "addUser" })}>+ Ajouter un profil</button>}</div>
              <div className="content">
                {isSuperAdmin ? (
                  // SUPERADMIN — voit tout par compagnie
                  companies.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                      <div style={{ fontSize: 40 }}>🏢</div>
                      <div>Créez d'abord des compagnies dans l'onglet 🏢 Compagnies</div>
                    </div>
                  ) : (
                    companies.map(company => {
                      const companyUsers = users.filter(u => u.companyId === company.id);
                      if (companyUsers.length === 0) return null;
                      return (
                        <div key={company.id} style={{ marginBottom: 28 }}>
                          <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: company.color || "var(--accent)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            🏢 {company.name}
                            <span style={{ fontSize: 12, fontWeight: 600, background: (company.color || "var(--accent)") + "22", color: company.color || "var(--accent)", padding: "2px 8px", borderRadius: 10 }}>{companyUsers.length} membre{companyUsers.length > 1 ? "s" : ""}</span>
                          </div>
                          <div className="cards-grid">
                            {companyUsers.map(u => {
                              const assignedTools = tools.filter(t => String(t.assignedTo) === String(u.id));
                              const isSelf = String(u.id) === String(currentUser.id);
                              return (
                                <div key={u.id} style={{ background: "var(--surface)", border: `1px solid ${u.role === "admin" ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden" }}>
                                  <div style={{ height: 5, background: u.role === "admin" ? "var(--accent)" : "var(--blue)" }} />
                                  <div style={{ padding: 14 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                      <div style={{ width: 44, height: 44, borderRadius: 10, background: u.role === "admin" ? "var(--accent)" : "var(--blue)", color: u.role === "admin" ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>{u.avatar}</div>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{u.role === "admin" ? "🔑 Admin" : "👷 Employé"}</div>
                                      </div>
                                    </div>
                                    <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
                                      <div style={{ fontSize: 10, color: "var(--muted)" }}>🔑 PIN</div>
                                      <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: 6 }}>{u.pin}</div>
                                    </div>
                                    {u.phone && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>📞 {u.phone}</div>}
                                    <button className="btn btn-danger btn-sm" style={{ width: "100%", justifyContent: "center" }}
                                      onClick={() => {
                                        if (assignedTools.length > 0) { showToast("⚠️ Ce profil a des outils confiés !", "warn"); return; }
                                        if (window.confirm(`Supprimer ${u.name} ?`)) {
                                          deleteDoc(doc(db, "users", String(u.id)));
                                          showToast("🗑 Profil supprimé");
                                        }
                                      }}>
                                      🗑 Supprimer
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  // ADMIN — voit uniquement sa compagnie
                  ["admin", "viewer"].map(role => {
                  const roleUsers = filteredUsers.filter(u => u.role === role);
                  if (roleUsers.length === 0) return null;
                  const roleColor = role === "admin" ? "var(--accent)" : "var(--blue)";
                  const roleLabel = role === "admin" ? "🔑 Admins" : "👷 Employés";
                  return (
                    <div key={role} style={{ marginBottom: 28 }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: roleColor, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
                        {roleLabel}
                        <span style={{ fontSize: 12, fontWeight: 600, background: roleColor + "22", color: roleColor, padding: "2px 8px", borderRadius: 10 }}>
                          {roleUsers.length}
                        </span>
                      </div>
                      <div className="cards-grid">
                        {roleUsers.map(u => {
                          const assignedTools = filteredTools.filter(t => String(t.assignedTo) === String(u.id));
                          const isSelf = String(u.id) === String(currentUser.id);
                          const canSeePins = currentUser.role === "superadmin" || currentUser.role === "admin";
                          return (
                            <div key={u.id} style={{ background: "var(--surface)", border: `1px solid ${isSelf ? roleColor : "var(--border)"}`, borderRadius: 12, overflow: "hidden" }}>
                              <div style={{ height: 6, background: roleColor }} />
                              <div style={{ padding: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                  <div style={{ width: 52, height: 52, borderRadius: 12, background: roleColor, color: role === "viewer" ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{u.avatar}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>
                                      {u.name}
                                      {isSelf && <span style={{ fontSize: 10, background: "rgba(245,166,35,.2)", color: "var(--accent)", padding: "1px 6px", borderRadius: 8, marginLeft: 6, fontFamily: "var(--font-body)" }}>Moi</span>}
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: roleColor + "22", color: roleColor, marginTop: 3, display: "inline-block" }}>
                                      {role === "admin" ? "Admin" : "Employé"}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                                  {u.phone && <div style={{ fontSize: 12, color: "var(--muted)" }}>📞 {u.phone}</div>}
                                  {u.email && <div style={{ fontSize: 12, color: "var(--muted)" }}>✉️ {u.email}</div>}
                                </div>
                                {canSeePins && u.pin && (
                                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>🔑 Code PIN</div>
                                    <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, letterSpacing: 6, color: "var(--accent)" }}>{u.pin}</div>
                                  </div>
                                )}
                                {role === "viewer" && (
                                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                                    {assignedTools.length === 0
                                      ? <div style={{ fontSize: 11, color: "var(--muted)" }}>Aucun outil confié</div>
                                      : assignedTools.map(t => (
                                          <div key={t.id} style={{ fontSize: 12, color: "var(--blue)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                            <span>{t.photo}</span> {t.name}
                                          </div>
                                        ))
                                    }
                                  </div>
                                )}
                                {!isSelf && (u.role === "viewer" ? true : currentUser.role === "superadmin") && (
                                  <button className="btn btn-danger btn-sm" style={{ width: "100%", justifyContent: "center" }}
                                    onClick={() => {
                                      if (assignedTools.length > 0) { showToast("⚠️ Ce profil a encore des outils confiés !", "warn"); return; }
                                      deleteDoc(doc(db, "users", String(u.id)));
                                      showToast("🗑 Profil supprimé");
                                    }}>
                                    🗑 Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item" onClick={logoutUser}>
          <span className="bn-icon">⇄</span>Profil
        </button>
        {isAdmin && (
          <button className={`bottom-nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}>
            <span className="bn-icon">📊</span>Stats
          </button>
        )}
        {isAdmin && !isSuperAdmin && (
          <button className={`bottom-nav-item ${page === "tools" ? "active" : ""}`} onClick={() => setPage("tools")}>
            <span className="bn-icon">🔧</span>Outils
          </button>
        )}
        {isAdmin && !isSuperAdmin && (
          <button className={`bottom-nav-item ${page === "chantiers" ? "active" : ""}`} onClick={() => setPage("chantiers")}>
            <span className="bn-icon">🏗</span>Chantiers
          </button>
        )}
        {!isAdmin && (
          <button className={`bottom-nav-item ${page === "mytools" ? "active" : ""}`} onClick={() => setPage("mytools")}>
            <span className="bn-icon">📦</span>Mes outils
          </button>
        )}
        {!isAdmin && (
          <button className={`bottom-nav-item ${page === "parc" ? "active" : ""}`} onClick={() => setPage("parc")}>
            <span className="bn-icon">🔧</span>Parc
          </button>
        )}
        <button className={`bottom-nav-item ${page === "requests" ? "active" : ""}`} onClick={() => setPage("requests")}>
          <span className="bn-icon">🔔</span>Demandes
          {pendingRequests > 0 && <span className="badge">{pendingRequests}</span>}
        </button>
        {isAdmin && (
          <button className={`bottom-nav-item ${page === "users" ? "active" : ""}`} onClick={() => setPage("users")}>
            <span className="bn-icon">👷</span>Équipe
          </button>
        )}
      </nav>

      {/* ── MODALS ── */}
      {modal && (
        <ModalRouter modal={modal} setModal={setModal} users={users} tools={tools} setTools={setTools} viewers={viewers} chantiers={chantiers} currentUser={currentUser} addTool={addTool} addUser={addUser} assignTool={assignTool} deleteTool={deleteTool} updateTool={updateTool} myCompany={myCompany} />
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
function ModalRouter({ modal, setModal, users, tools, setTools, viewers, chantiers, currentUser, addTool, addUser, assignTool, deleteTool, updateTool, myCompany }) {
  const isAdmin = currentUser.role === "admin" || currentUser.role === "superadmin";
  if (modal.type === "addTool") return <AddToolModal onClose={() => setModal(null)} onSave={addTool} />;
  if (modal.type === "addUser") return <AddUserModal onClose={() => setModal(null)} onSave={addUser} currentUser={currentUser} myCompany={myCompany} />;
  if (modal.type === "tool") return <ToolDetailModal tool={modal.data} onClose={() => setModal(null)} users={users} viewers={viewers} chantiers={chantiers} isAdmin={isAdmin} assignTool={assignTool} setTools={setTools} currentUser={currentUser} deleteTool={deleteTool} updateTool={updateTool} />;
  if (modal.type === "whatsappInvite") {
    const admin = modal.data;
    const msg = encodeURIComponent(
      `Bonjour ${admin.name} 👋\n\n` +
      `Vous avez été nommé *Administrateur* de *${admin.companyName}* sur *Tool Track*.\n\n` +
      `📱 Accédez à l'app : https://tool-track-rosy.vercel.app\n` +
      `🏢 Code de votre compagnie : *${admin.companyPin || "voir votre responsable"}*\n` +
      `👤 Votre profil : *${admin.name}*\n` +
      `🔑 Votre code PIN : *${admin.pin}*\n\n` +
      `Sur votre téléphone, ouvrez le lien dans Safari (iPhone) ou Chrome (Android) et ajoutez-le à votre écran d'accueil.\n\n` +
      `_Bonne gestion d'équipe !_ 🚀`
    );
    const phone = admin.phone?.replace(/\s/g,"").replace(/^\+/,"") || "";
    const waUrl = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    return (
      <div className="modal-overlay" onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
          <div className="modal-header">
            <h3>✅ Admin créé !</h3>
            <button className="close-btn" onClick={() => setModal(null)}>×</button>
          </div>
          <div className="modal-body" style={{ textAlign: "center", gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, margin: "0 auto" }}>{admin.avatar}</div>
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800 }}>{admin.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>🔑 Admin · {admin.companyName}</div>
            </div>
            <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 24px" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Code PIN</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 36, fontWeight: 800, color: "var(--accent)", letterSpacing: 8 }}>{admin.pin}</div>
            </div>
            <button className="btn btn-green" style={{ width: "100%", justifyContent: "center", fontSize: 15 }}
              onClick={() => { window.open(waUrl, "_blank"); setModal(null); }}>
              📲 Envoyer l'invitation via WhatsApp
            </button>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Fermer sans envoyer</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── TOOL DETAIL MODAL ────────────────────────────────────────────────────────
function ToolDetailModal({ tool, onClose, users, viewers, chantiers, isAdmin, assignTool, setTools, currentUser, deleteTool, updateTool }) {
  const [assignForm, setAssignForm] = useState({ viewerId: "", chantier: "" });
  const [moveForm, setMoveForm] = useState({ destination: "", newViewerId: "" });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: tool.name || "", ref: tool.ref || "",
    description: tool.description || "",
    price: tool.price ? tool.price.toLocaleString("fr-MU") : "",
    purchaseDate: tool.purchaseDate || "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef();
  const [newPhoto, setNewPhoto] = useState(null);

  // Loading buttons — un par action
  const [loadingAssign, triggerAssign]   = useLoadingBtn();
  const [loadingMove,   triggerMove]     = useLoadingBtn();
  const [loadingSave,   triggerSave]     = useLoadingBtn();
  const [loadingDelete, triggerDelete]   = useLoadingBtn();
  const [loadingDeclare, triggerDeclare] = useLoadingBtn();
  const [loadingThread, triggerThread]   = useLoadingBtn();
  const assignee = users.find(u => String(u.id) === String(tool.assignedTo));

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 24 }}>{tool.photo}</span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 17, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool.name}</h3>
              {tool.ref && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>🏭 {tool.ref}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {isAdmin && !editing && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏️</button>
                <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.2)", color: "var(--red)" }}
                  onClick={() => setConfirmDelete(true)}>🗑</button>
              </>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* CONFIRM DELETE */}
        {confirmDelete && (
          <div style={{ background: "rgba(232,82,10,.1)", border: "1px solid var(--red)", borderRadius: 10, margin: "12px 24px", padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--red)" }}>⚠️ Supprimer "{tool.name}" ?</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Cette action est irréversible. L'outil sera définitivement supprimé.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Annuler</button>
              <button className={`btn btn-danger btn-sm ${loadingDelete ? "loading" : ""}`} disabled={loadingDelete}
                onClick={() => triggerDelete(() => deleteTool(tool.id))}>
                {loadingDelete ? "⏳ Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        )}

        {/* EDIT FORM */}
        {editing && (
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="form-group"><label className="form-label">Nom *</label>
              <input className="form-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Fournisseur</label>
                <input className="form-input" value={editForm.ref} onChange={e => setEditForm(p => ({ ...p, ref: e.target.value }))} />
              </div>
              <div className="form-group"><label className="form-label">Date d'achat</label>
                <input className="form-input" type="date" value={editForm.purchaseDate} onChange={e => setEditForm(p => ({ ...p, purchaseDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group"><label className="form-label">🇲🇺 Prix (Rs)</label>
              <input className="form-input" type="text" inputMode="numeric" placeholder="ex: 18 000" value={editForm.price}
                onChange={e => {
                  const raw = e.target.value.replace(/\s/g,"").replace(/[^0-9]/g,"");
                  setEditForm(p => ({ ...p, price: raw.replace(/\B(?=(\d{3})+(?!\d))/g," ") }));
                }} />
            </div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea className="form-input" rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group"><label className="form-label">📷 Changer la photo</label>
              <div className="photo-upload-zone" onClick={() => fileRef.current.click()}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setNewPhoto(ev.target.result); r.readAsDataURL(f); }} />
                {newPhoto
                  ? <img src={newPhoto} alt="aperçu" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8 }} />
                  : <div style={{ padding: "10px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                      {tool.photoUrl ? "📷 Cliquez pour changer la photo" : "📷 Ajouter une photo"}
                    </div>
                }
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setNewPhoto(null); }}>Annuler</button>
              <button className={`btn btn-primary btn-sm ${loadingSave ? "loading" : ""}`} disabled={!editForm.name.trim() || loadingSave}
                onClick={() => triggerSave(() => updateTool(tool.id, {
                  name: editForm.name, ref: editForm.ref,
                  description: editForm.description, purchaseDate: editForm.purchaseDate,
                  price: editForm.price ? Number(String(editForm.price).replace(/\s/g,"")) : null,
                  photoUrl: newPhoto || tool.photoUrl,
                }))}>
                {loadingSave ? "⏳ Sauvegarde..." : "✅ Sauvegarder"}
              </button>
            </div>
          </div>
        )}

        <div className="modal-body" style={{ display: editing ? "none" : "flex" }}>
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
                  <option value="">— Confier à (employé) —</option>
                  {viewers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <select className="form-input" value={assignForm.chantier} onChange={e => setAssignForm(p => ({ ...p, chantier: e.target.value }))}>
                  <option value="">— Choisir un chantier —</option>
                  {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <button className={`btn btn-primary btn-sm ${loadingAssign ? "loading" : ""}`} disabled={!assignForm.viewerId || !assignForm.chantier || loadingAssign}
                  onClick={() => triggerAssign(() => assignTool(tool.id, assignForm.viewerId, assignForm.chantier, "out"))}>
                  {loadingAssign ? "⏳ En cours..." : "Sortir & Confier"}
                </button>
              </div>
            </div>
          )}

          {/* PEINTRE — voir seulement depuis Mes outils */}

          {isAdmin && tool.status === "assigned" && (
            <div className="assign-section">
              <h4>🔄 Mouvement de l'outil (Admin)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <select className="form-input" value={moveForm.destination} onChange={e => setMoveForm(p => ({ ...p, destination: e.target.value }))}>
                  <option value="">— Destination —</option>
                  <option value="Store">🏠 Retour Store</option>
                  {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select className="form-input" value={moveForm.newViewerId} onChange={e => setMoveForm(p => ({ ...p, newViewerId: e.target.value }))}>
                  <option value="">— Retour store (ou choisir nouveau employé) —</option>
                  {viewers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <button className={`btn btn-green btn-sm ${loadingMove ? "loading" : ""}`} disabled={!moveForm.destination || loadingMove}
                  onClick={() => triggerMove(() => assignTool(tool.id, moveForm.newViewerId || null, moveForm.destination === "Store" ? null : moveForm.destination, moveForm.newViewerId ? "out" : "in"))}>
                  {loadingMove ? "⏳ En cours..." : moveForm.newViewerId ? "Transférer à un autre employé" : "Récupérer → Store"}
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
                  <button className={`btn btn-sm ${loadingDeclare ? "loading" : ""}`} disabled={loadingDeclare}
                    style={{ background: "rgba(232,82,10,.25)", color: "#f07030", alignSelf: "flex-start", border: "1px solid rgba(232,82,10,.4)" }}
                    onClick={() => triggerDeclare(declareNonFunctional)}>
                    {loadingDeclare ? "⏳ En cours..." : "🔴 Ouvrir le suivi"}
                  </button>
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
                      <button className={`btn btn-blue btn-sm ${loadingThread ? "loading" : ""}`} disabled={loadingThread}
                        style={{ alignSelf: "flex-end", flexShrink: 0 }}
                        onClick={() => triggerThread(addThreadEntry)}>
                        {loadingThread ? "⏳" : "Envoyer"}
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* HISTORY — visible par tous */}
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>📋 Historique</div>
            <div className="history-list">
              {[...(tool.history || [])].reverse().map((h, i) => (
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
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(p => ({ ...p, photoUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!form.name.trim()) return;
    onSave(form);
  };

  const fieldStyle = (val) => ({
    borderColor: submitted && !val?.trim() ? "var(--red)" : undefined,
    boxShadow: submitted && !val?.trim() ? "0 0 0 2px rgba(232,82,10,.2)" : undefined,
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Ajouter un outil</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">

          {/* PHOTO UPLOAD — optionnel */}
          <div className="form-group">
            <label className="form-label">📷 Photo de l'outil <span style={{ fontSize: 10, color: "var(--muted)" }}>(optionnel)</span></label>
            <div className="photo-upload-zone" onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} />
              {form.photoUrl
                ? <img src={form.photoUrl} alt="aperçu" className="photo-preview" />
                : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 0" }}>
                    <span style={{ fontSize: 36 }}>📷</span>
                    <span>Cliquez pour choisir une photo</span>
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
            <div className="form-group">
              <label className="form-label">Nom <span style={{ color: "var(--red)" }}>*</span></label>
              <input className="form-input" style={fieldStyle(form.name)} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ex: Perceuse Bosch" />
              {submitted && !form.name.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Le nom est obligatoire</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Fournisseur</label>
              <input className="form-input" value={form.ref} onChange={e => setForm(p => ({ ...p, ref: e.target.value }))} placeholder="ex: Neetoo" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Date d'achat</label>
            <input className="form-input" type="date" value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">🇲🇺 Prix d'achat (Rs)</label>
            <input className="form-input" type="text" inputMode="numeric" placeholder="ex: 20 000" value={form.price}
              onChange={e => {
                const raw = e.target.value.replace(/\s/g, "").replace(/[^0-9]/g, "");
                setForm(p => ({ ...p, price: raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ") }));
              }} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD USER MODAL ───────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSave, currentUser, myCompany }) {
  const APP_URL = "tool-track-rosy.vercel.app";
  const generatePin = () => String(Math.floor(1000 + Math.random() * 9000));
  const [form, setForm] = useState({ name: "", role: "viewer", phone: "", email: "", pin: generatePin() });
  const [saved, setSaved] = useState(false);
  const [savedUser, setSavedUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const fieldStyle = (val) => ({
    borderColor: submitted && !val?.trim() ? "var(--red)" : undefined,
    boxShadow: submitted && !val?.trim() ? "0 0 0 2px rgba(232,82,10,.2)" : undefined,
  });

  const handleSave = async () => {
    setSubmitted(true);
    if (!form.name.trim() || form.pin.length !== 4) return;
    const user = await onSave(form);
    setSavedUser({ ...form });
    setSaved(true);
  };

  const sendWhatsApp = () => {
    const companyPin = myCompany?.companyPin || "";
    const companyName = myCompany?.name || currentUser?.companyName || "";
    const msg = encodeURIComponent(
      `Bonjour ${savedUser.name} 👋\n\nTu es invité(e) sur *Tool Track* — l'app de gestion des outils.\n\n` +
      `📱 Installe l'app : https://${APP_URL}\n` +
      (companyName ? `🏢 Compagnie : *${companyName}*\n` : "") +
      (companyPin ? `🔐 Code de la compagnie : *${companyPin}*\n` : "") +
      `👤 Ton profil : *${savedUser.name}*\n` +
      `🔑 Ton code PIN : *${savedUser.pin}*\n\n` +
      `_Sur ton téléphone, ouvre le lien dans Safari (iPhone) ou Chrome (Android) et ajoute-le à ton écran d'accueil pour l'avoir comme une vraie app !_`
    );
    const phone = savedUser.phone.replace(/\s/g, "").replace(/^\+/, "");
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
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
              <div className="form-group">
                <label className="form-label">Nom complet <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" style={fieldStyle(form.name)} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ex: Jean Dupont" />
                {submitted && !form.name.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Le nom est obligatoire</div>}
              </div>
              <div className="form-group"><label className="form-label">Rôle <span style={{ color: "var(--red)" }}>*</span></label>
                <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="viewer">👷 Employé</option>
                  <option value="admin">🔑 Admin</option>
                  {currentUser?.role === "superadmin" && <option value="superadmin">👑 Administrateur Principal</option>}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Téléphone WhatsApp</label><input className="form-input" placeholder="+230 ..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">🔑 Code PIN (4 chiffres) <span style={{ color: "var(--red)" }}>*</span></label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="form-input" style={{ flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: 8, textAlign: "center", ...(submitted && form.pin.length !== 4 ? { borderColor: "var(--red)", boxShadow: "0 0 0 2px rgba(232,82,10,.2)" } : {}) }}
                    maxLength={4} value={form.pin}
                    onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, pin: generatePin() }))}>🔄 Nouveau</button>
                </div>
                {submitted && form.pin.length !== 4 && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Le PIN doit contenir 4 chiffres</div>}
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
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{savedUser.role === "superadmin" ? "👑 Super Admin" : savedUser.role === "admin" ? "🔑 Admin" : "👷 Employé"}</div>
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
              <button className="btn btn-primary" onClick={handleSave}>Créer le profil</button>
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
            const employéIds = [...new Set(toolsOnSite.map(t => t.assignedTo))];
            const employés = employéIds.map(id => users.find(u => u.id === id)).filter(Boolean);
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
                  {employés.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, width: "100%", marginBottom: 2 }}>👷 Employés</div>
                      {employés.map(p => (
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

// ─── MESSAGES PAGE ────────────────────────────────────────────────────────────
function MessagesPage({ currentUser, users, tools, myTools, db, showToast }) {
  const [tab, setTab] = useState("annonces"); // "annonces" | "admins"
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newText, setNewText] = useState("");
  const threadRef = useRef();
  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "conversations"),
      snap => {
        const all = snap.docs.map(d => ({ ...d.data(), id: d.id }))
          .sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
        setConversations(all);
      },
      err => console.error("Conversations error:", err)
    );
    return () => unsub();
  }, []);

  // Filter by tab — simple et direct
  const tabConvs = tab === "annonces"
    ? conversations.filter(c => c.type === "annonce")
    : conversations.filter(c => c.type === "admin");

  const selectedConv = conversations.find(c => c.id === selected);

  const unreadAnnonces = conversations.filter(c => c.type === "annonce" && c.messages?.some(m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id))).length;
  const unreadAdmins = conversations.filter(c => c.type === "admin" && c.messages?.some(m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id))).length;

  const createConversation = async () => {
    if (!newText.trim() || !newSubject.trim()) return;
    const id = String(Date.now());
    const msg = {
      id: String(Date.now() + 1), from: currentUser.id, fromName: currentUser.name,
      fromAvatar: currentUser.avatar, fromRole: currentUser.role,
      text: newText, date: new Date().toISOString(), readBy: [String(currentUser.id)],
    };
    await setDoc(doc(db, "conversations", id), {
      id, subject: newSubject, type: tab === "annonces" ? "annonce" : "admin",
      createdBy: currentUser.id, createdByName: currentUser.name,
      messages: [msg], lastDate: new Date().toISOString(), lastText: newText,
    });
    setNewSubject(""); setNewText(""); setNewConvOpen(false);
    setSelected(id);
    showToast("📨 Message envoyé !");
  };

  const [replyTo, setReplyTo] = useState(null); // message being replied to
  const [photoData, setPhotoData] = useState(null); // base64 photo
  const photoRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const sendReply = async () => {
    if (!replyText.trim() && !photoData) return;
    if (!selectedConv) return;
    if (selectedConv.type === "annonce" && !isAdmin) return;
    const msg = {
      id: String(Date.now()), from: currentUser.id, fromName: currentUser.name,
      fromAvatar: currentUser.avatar, fromRole: currentUser.role,
      text: replyText, photo: photoData || null,
      replyTo: replyTo ? { id: replyTo.id, fromName: replyTo.fromName, text: replyTo.text?.slice(0, 60) } : null,
      date: new Date().toISOString(), readBy: [String(currentUser.id)],
    };
    const updatedMsgs = [...(selectedConv.messages || []), msg];
    await setDoc(doc(db, "conversations", selectedConv.id), {
      ...selectedConv, messages: updatedMsgs,
      lastDate: new Date().toISOString(), lastText: replyText || "📷 Photo",
    });
    setReplyText(""); setPhotoData(null); setReplyTo(null);
    setTimeout(() => threadRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 100);
  };

  // Mark as read on open
  useEffect(() => {
    if (!selectedConv) return;
    const needsUpdate = selectedConv.messages?.some(
      m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id)
    );
    if (needsUpdate) {
      const updated = selectedConv.messages.map(m => ({
        ...m, readBy: m.readBy?.includes(String(currentUser.id)) ? m.readBy : [...(m.readBy || []), String(currentUser.id)]
      }));
      setDoc(doc(db, "conversations", selectedConv.id), { ...selectedConv, messages: updated });
    }
  }, [selected, selectedConv]);

  const fmtT = (d) => new Date(d).toLocaleString("fr-MU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  // ── THREAD VIEW ──
  if (selected && selectedConv) {
    const canReply = isAdmin; // Seuls les admins peuvent répondre dans les annonces ; dans admin-to-admin aussi
    return (
      <>
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>← Retour</button>
            <div>
              <h2 style={{ fontSize: 17 }}>{selectedConv.subject}</h2>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                {selectedConv.type === "annonce" ? "📢 Annonce — employés en lecture seule" : "🔑 Conversation admins"}
              </div>
            </div>
          </div>
        </div>
        <div className="content" style={{ display: "flex", flexDirection: "column", height: "calc(100% - 70px)" }}>
          <div ref={threadRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
            {(selectedConv.messages || []).map((m, i) => {
              const isMe = String(m.from) === String(currentUser.id);
              return (
                <div key={m.id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "82%", background: isMe ? "rgba(58,142,246,.15)" : "var(--surface)", border: `1px solid ${isMe ? "rgba(58,142,246,.3)" : "var(--border)"}`, borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px", overflow: "hidden" }}>
                    {/* REPLY-TO PREVIEW */}
                    {m.replyTo && (
                      <div style={{ background: isMe ? "rgba(58,142,246,.2)" : "var(--surface2)", borderLeft: "3px solid var(--accent)", padding: "6px 10px", margin: "8px 10px 0", borderRadius: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>{m.replyTo.fromName}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{m.replyTo.text}{m.replyTo.text?.length >= 60 ? "..." : ""}</div>
                      </div>
                    )}
                    <div style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: m.fromRole === "admin" ? "var(--accent)" : "var(--blue)", color: m.fromRole === "admin" ? "#000" : "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.fromAvatar}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? "var(--blue)" : "var(--accent)" }}>{m.fromName}</span>
                        {m.fromRole === "admin" && <span style={{ fontSize: 9, background: "rgba(245,166,35,.2)", color: "var(--accent)", padding: "1px 5px", borderRadius: 6, fontWeight: 700 }}>ADMIN</span>}
                      </div>
                      {/* PHOTO */}
                      {m.photo && <img src={m.photo} alt="photo" style={{ width: "100%", maxWidth: 280, borderRadius: 8, marginBottom: 6, display: "block" }} onClick={() => window.open(m.photo, "_blank")} />}
                      {/* TEXT */}
                      {m.text && <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap" }}>{m.text}</div>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 8 }}>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>{fmtT(m.date)}</div>
                        {/* REPLY BUTTON */}
                        {canReply && (
                          <button onClick={() => setReplyTo(m)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer", padding: "2px 6px", borderRadius: 6 }}>
                            ↩ Répondre
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* REPLY BOX */}
          {canReply ? (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              {/* REPLY-TO PREVIEW */}
              {replyTo && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 8, borderLeft: "3px solid var(--accent)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>↩ {replyTo.fromName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{replyTo.text?.slice(0, 60)}{replyTo.photo && !replyTo.text ? "📷 Photo" : ""}</div>
                  </div>
                  <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 16, cursor: "pointer" }}>×</button>
                </div>
              )}
              {/* PHOTO PREVIEW */}
              {photoData && (
                <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
                  <img src={photoData} alt="preview" style={{ height: 80, borderRadius: 8, objectFit: "cover" }} />
                  <button onClick={() => setPhotoData(null)} style={{ position: "absolute", top: -6, right: -6, background: "var(--red)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                {/* PHOTO BUTTON */}
                <button onClick={() => photoRef.current.click()} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>📷</button>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                <textarea className="form-input" style={{ flex: 1, resize: "none" }} rows={2}
                  placeholder="Écrire un message... (Entrée pour envoyer)"
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                />
                <button className="btn btn-primary btn-sm" style={{ flexShrink: 0, alignSelf: "flex-end" }} onClick={sendReply} disabled={!replyText.trim() && !photoData}>➤</button>
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>Entrée pour envoyer · Shift+Entrée pour saut de ligne</div>
            </div>
          ) : (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, textAlign: "center", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
              👁 Lecture seule — seuls les admins peuvent répondre aux annonces
            </div>
          )}
        </div>
      </>
    );
  }

  // ── LIST VIEW ──
  return (
    <>
      <div className="topbar">
        <h2>💬 Messages</h2>
        {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setNewConvOpen(true)}>+ Nouveau</button>}
      </div>
      <div className="content">

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button className={`filter-btn ${tab === "annonces" ? "active" : ""}`} onClick={() => { setTab("annonces"); setSelected(null); setNewConvOpen(false); }}>
            📢 Annonces {conversations.filter(c => c.type === "annonce").length > 0 && `(${conversations.filter(c => c.type === "annonce").length})`} {unreadAnnonces > 0 && <span style={{ background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{unreadAnnonces}</span>}
          </button>
          {isAdmin && (
            <button className={`filter-btn ${tab === "admins" ? "active" : ""}`} onClick={() => { setTab("admins"); setSelected(null); setNewConvOpen(false); }}>
              🔑 Admins {conversations.filter(c => c.type === "admin").length > 0 && `(${conversations.filter(c => c.type === "admin").length})`} {unreadAdmins > 0 && <span style={{ background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{unreadAdmins}</span>}
            </button>
          )}
        </div>

        {/* NEW CONVERSATION FORM */}
        {newConvOpen && isAdmin && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800, color: "var(--accent)", marginBottom: 10 }}>
              {tab === "annonces" ? "📢 Nouvelle annonce" : "🔑 Message entre admins"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="form-input" placeholder="Sujet *" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <textarea className="form-input" rows={3} placeholder="Votre message..." value={newText} onChange={e => setNewText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); createConversation(); } }} />
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                {tab === "annonces" ? "📢 Visible par tous — les employés pourront lire mais pas répondre" : "🔑 Visible uniquement par les admins"}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setNewConvOpen(false)}>Annuler</button>
                <button className="btn btn-primary btn-sm" disabled={!newSubject.trim() || !newText.trim()} onClick={createConversation}>Envoyer</button>
              </div>
            </div>
          </div>
        )}

        {/* LIST */}
        {tabConvs.length === 0 && !newConvOpen && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{tab === "annonces" ? "📢" : "🔑"}</div>
            <div>{tab === "annonces" ? "Aucune annonce pour le moment" : "Aucun message entre admins"}</div>
            {conversations.length > 0 && tab === "annonces" && (
              <div style={{ fontSize: 11, marginTop: 8, color: "var(--red)" }}>
                ⚠️ {conversations.length} conversation(s) chargée(s) mais sans type "annonce" — recréez une annonce depuis l'app
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tabConvs.map(c => {
            const hasUnread = c.messages?.some(m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id));
            const lastMsg = c.messages?.[c.messages.length - 1];
            return (
              <div key={c.id} onClick={() => setSelected(c.id)} style={{
                background: "var(--surface)", border: `1px solid ${hasUnread ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 12, padding: 14, cursor: "pointer", transition: "all .15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {hasUnread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: hasUnread ? 800 : 600 }}>{c.subject}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      De {c.createdByName} · {c.messages?.length || 0} message{(c.messages?.length || 0) > 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <strong>{lastMsg?.fromName}</strong> : {lastMsg?.text}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{fmtT(c.lastDate)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── COMPANIES PAGE ───────────────────────────────────────────────────────────
function CompaniesPage({ companies, users, tools, chantiers, requests, db, currentUser, showToast, onAdminCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#f5a623");
  const [newExpiry, setNewExpiry] = useState("");
  const [newContactEmail, setNewContactEmail] = useState(currentUser.email || "");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const companyFieldStyle = (val) => ({
    borderColor: formSubmitted && !val?.trim() ? "var(--red)" : undefined,
    boxShadow: formSubmitted && !val?.trim() ? "0 0 0 2px rgba(232,82,10,.2)" : undefined,
  });
  const [expandedId, setExpandedId] = useState(null);
  const [adminForm, setAdminForm] = useState({ name: "", phone: "", email: "", pin: String(Math.floor(1000 + Math.random() * 9000)) });
  const [creatingAdmin, setCreatingAdmin] = useState(null);
  const [editingExpiry, setEditingExpiry] = useState(null); // companyId being edited
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const APP_URL = "tool-track-rosy.vercel.app";

  // Check expiry dates on load — auto-suspend expired companies
  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    companies.forEach(async c => {
      if (!c.expiryDate) return;
      const expiry = new Date(c.expiryDate);
      expiry.setHours(0,0,0,0);
      // Auto-suspend if expired
      if (expiry <= today && c.active !== false) {
        await setDoc(doc(db, "companies", c.id), { ...c, active: false, suspendedAt: new Date().toISOString(), suspendReason: "expiration" });
      }
    });
  }, [companies]);

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const expiry = new Date(expiryDate); expiry.setHours(0,0,0,0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const sendExpiryWarningWhatsApp = (company, adminUser, daysLeft) => {
    const contactEmail = company.contactEmail || currentUser.email || "";
    const msg = encodeURIComponent(
      `⚠️ *TOOL TRACK — Avertissement d'expiration*\n\n` +
      `Bonjour ${adminUser?.name || ""},\n\n` +
      `Votre accès à *Tool Track* pour la compagnie *${company.name}* expirera dans *${daysLeft} jour${daysLeft > 1 ? "s" : ""}*.\n\n` +
      `📅 Date d'expiration : *${new Date(company.expiryDate).toLocaleDateString("fr-MU")}*\n\n` +
      `Pour renouveler votre abonnement, envoyez votre preuve de paiement à :\n` +
      `📧 *${contactEmail}*\n\n` +
      `Sans renouvellement, l'accès à ${APP_URL} sera automatiquement suspendu à la date d'expiration.\n\n` +
      `Merci de votre confiance.`
    );
    const phone = adminUser?.phone?.replace(/\s/g, "").replace(/^\+/, "") || "";
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  };

  const createCompany = async () => {
    setFormSubmitted(true);
    if (!newName.trim() || !newExpiry || !newContactEmail.trim()) return;
    const id = String(Date.now());
    const companyPin = String(Math.floor(1000 + Math.random() * 9000));
    await setDoc(doc(db, "companies", id), {
      id, name: newName.trim(), color: newColor,
      active: true, createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      expiryDate: newExpiry || null,
      contactEmail: newContactEmail || currentUser.email || "",
      companyPin,
    });
    setNewName(""); setNewExpiry(""); setShowForm(false);
    showToast(`🏢 Compagnie créée ! Code d'accès : ${companyPin}`);
  };

  const saveExpiry = async (company) => {
    await setDoc(doc(db, "companies", company.id), {
      ...company,
      expiryDate: editExpiryDate || null,
      contactEmail: editContactEmail || company.contactEmail || currentUser.email || "",
    });
    setEditingExpiry(null);
    showToast("✅ Date d'expiration mise à jour !");
  };

  const toggleCompany = async (company) => {
    await setDoc(doc(db, "companies", company.id), { ...company, active: !company.active });
    showToast(company.active ? "⏸ Compagnie suspendue" : "✅ Compagnie réactivée");
  };

  const deleteCompany = async (company) => {
    if (!window.confirm(`⚠️ Supprimer définitivement "${company.name}" ?\n\nTous les membres, outils, chantiers, demandes et messages seront supprimés.`)) return;
    
    // Delete all users of this company
    const companyUsers = users.filter(u => u.companyId === company.id);
    for (const u of companyUsers) await deleteDoc(doc(db, "users", String(u.id)));

    // Delete all tools of this company
    const companyTools = tools.filter(t => t.companyId === company.id);
    for (const t of companyTools) await deleteDoc(doc(db, "tools", String(t.id)));

    // Delete all chantiers of this company
    const companyChantiers = chantiers.filter(c => c.companyId === company.id);
    for (const c of companyChantiers) await deleteDoc(doc(db, "chantiers", String(c.id)));

    // Delete all requests of this company
    const companyRequests = requests.filter(r => r.companyId === company.id);
    for (const r of companyRequests) await deleteDoc(doc(db, "requests", String(r.id)));

    // Finally delete the company itself
    await deleteDoc(doc(db, "companies", company.id));
    showToast(`🗑 Compagnie "${company.name}" et toutes ses données supprimées`);
  };

  const [lastCreatedAdmin, setLastCreatedAdmin] = useState(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const createFirstAdmin = async (company) => {
    if (!adminForm.name.trim() || adminForm.pin.length !== 4) return;
    const id = String(Date.now());
    const initials = adminForm.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    const companyName = company.name || companies.find(c => c.id === company.id)?.name || "votre compagnie";
    const companyPin = company.companyPin || companies.find(c => c.id === company.id)?.companyPin || "";
    const newAdmin = {
      id, name: adminForm.name, role: "admin", avatar: initials,
      phone: adminForm.phone, email: adminForm.email, pin: adminForm.pin,
      companyId: company.id, companyName,
      companyPin,
    };
    await setDoc(doc(db, "users", id), newAdmin);
    onAdminCreated({ ...newAdmin, companyName, companyPin });
    showToast(`✅ Admin créé — PIN: ${adminForm.pin}`);
    setAdminForm({ name: "", phone: "", email: "", pin: String(Math.floor(1000 + Math.random() * 9000)) });
    setCreatingAdmin(null);
  };

  const sendAdminWhatsApp = (admin) => {
    const msg = encodeURIComponent(
      `Bonjour ${admin.name} 👋\n\n` +
      `Vous avez été nommé *Administrateur* de *${admin.companyName}* sur *Tool Track*.\n\n` +
      `📱 Accédez à l'app : https://${APP_URL}\n` +
      `👤 Votre profil : *${admin.name}*\n` +
      `🔑 Votre code PIN : *${admin.pin}*\n\n` +
      `Sur votre téléphone, ouvrez le lien dans Safari (iPhone) ou Chrome (Android) et ajoutez-le à votre écran d'accueil.\n\n` +
      `_Bonne gestion d'équipe !_ 🚀`
    );
    const phone = admin.phone?.replace(/\s/g,"").replace(/^\+/,"") || "";
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <>
      <div className="topbar">
        <h2>🏢 Compagnies</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Nouvelle</button>
      </div>
      <div className="content">

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total", count: companies.length, color: "var(--accent)" },
            { label: "🟢 Actives", count: companies.filter(c => c.active !== false).length, color: "var(--green)" },
            { label: "⏸ Suspendues", count: companies.filter(c => c.active === false).length, color: "var(--red)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--surface)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* NEW COMPANY FORM */}
        {showForm && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800, color: "var(--accent)", marginBottom: 12 }}>🏢 Nouvelle compagnie</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <input className="form-input" style={companyFieldStyle(newName)} placeholder="Nom de la compagnie *" value={newName} onChange={e => { setNewName(e.target.value); }} />
                {formSubmitted && !newName.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Le nom est obligatoire</div>}
              </div>
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 44, height: 44, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", padding: 2 }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>📅 Date d'expiration <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" style={companyFieldStyle(newExpiry)} type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
                {formSubmitted && !newExpiry && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ La date d'expiration est obligatoire</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>📧 Email de contact <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" style={companyFieldStyle(newContactEmail)} type="email" placeholder={currentUser.email || "votre@email.com"} value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} />
                {formSubmitted && !newContactEmail.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ L'email est obligatoire</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setFormSubmitted(false); }}>Annuler</button>
              <button className="btn btn-primary btn-sm" onClick={createCompany}>Créer</button>
            </div>
          </div>
        )}

        {/* COMPANIES LIST */}
        {companies.length === 0 && !showForm && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏢</div>
            <div>Aucune compagnie — créez-en une !</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {companies.map(company => {
            const compUsers = users.filter(u => u.companyId === company.id);
            const compTools = tools.filter(t => t.companyId === company.id);
            const compAdmins = compUsers.filter(u => u.role === "admin");
            const isExpanded = expandedId === company.id;
            const isActive = company.active !== false;

            return (
              <div key={company.id} style={{ background: "var(--surface)", border: `1px solid ${isActive ? "var(--border)" : "rgba(232,82,10,.3)"}`, borderRadius: 12, overflow: "hidden", opacity: isActive ? 1 : 0.7 }}>
                {/* COLOR BAR */}
                <div style={{ height: 5, background: company.color || "var(--accent)" }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: company.color || "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800 }}>{company.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span>👷 {compUsers.length} membres · 🔧 {compTools.length} outils</span>
                        {company.companyPin && <span style={{ background: "var(--surface2)", padding: "1px 8px", borderRadius: 20, fontFamily: "var(--font-head)", fontWeight: 800, color: "var(--accent)", letterSpacing: 3 }}>🔐 {company.companyPin}</span>}
                        {!isActive && <span style={{ color: "var(--red)", fontWeight: 700 }}>⏸ Suspendue</span>}
                        {/* EXPIRY BADGE */}
                        {company.expiryDate && (() => {
                          const days = getDaysUntilExpiry(company.expiryDate);
                          if (days === null) return null;
                          if (days < 0) return <span style={{ background: "rgba(232,82,10,.2)", color: "var(--red)", fontWeight: 700, padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>❌ Expiré</span>;
                          if (days <= 5) return <span style={{ background: "rgba(245,166,35,.2)", color: "var(--accent)", fontWeight: 700, padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>⚠️ Expire dans {days}j</span>;
                          return <span style={{ background: "rgba(39,201,122,.15)", color: "var(--green)", fontWeight: 600, padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>📅 {new Date(company.expiryDate).toLocaleDateString("fr-MU")}</span>;
                        })()}
                        {!company.expiryDate && <span style={{ color: "var(--muted)", fontSize: 10 }}>📅 Pas de date d'expiration</span>}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(isExpanded ? null : company.id)}>
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* EXPIRY DATE EDITOR */}
                      <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>📅 Expiration & Contact</div>
                        {editingExpiry === company.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 2 }}>Date d'expiration</label>
                                <input className="form-input" type="date" value={editExpiryDate} onChange={e => setEditExpiryDate(e.target.value)} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 10, color: "var(--muted)", display: "block", marginBottom: 2 }}>Email contact paiements</label>
                                <input className="form-input" type="email" placeholder={currentUser.email} value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)} />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingExpiry(null)}>Annuler</button>
                              <button className="btn btn-primary btn-sm" onClick={() => saveExpiry(company)}>✅ Sauvegarder</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 12 }}>
                                {company.expiryDate
                                  ? `📅 Expire le : ${new Date(company.expiryDate).toLocaleDateString("fr-MU")}`
                                  : "📅 Aucune date d'expiration"}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                                📧 {company.contactEmail || currentUser.email || "Non défini"}
                              </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                              setEditingExpiry(company.id);
                              setEditExpiryDate(company.expiryDate || "");
                              setEditContactEmail(company.contactEmail || currentUser.email || "");
                            }}>✏️ Modifier</button>
                          </div>
                        )}
                        {/* WARNING SEND BUTTON — only if expiry within 5 days */}
                        {company.expiryDate && getDaysUntilExpiry(company.expiryDate) !== null && getDaysUntilExpiry(company.expiryDate) <= 5 && getDaysUntilExpiry(company.expiryDate) >= 0 && (
                          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(245,166,35,.1)", borderRadius: 8, border: "1px solid rgba(245,166,35,.3)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>
                              ⚠️ Expire dans {getDaysUntilExpiry(company.expiryDate)} jour{getDaysUntilExpiry(company.expiryDate) > 1 ? "s" : ""} — Envoyer un avertissement
                            </div>
                            {compAdmins.map(admin => (
                              <button key={admin.id} className="btn btn-sm" style={{ background: "rgba(37,211,102,.2)", color: "#25d366", fontSize: 12, marginRight: 6 }}
                                onClick={() => sendExpiryWarningWhatsApp(company, admin, getDaysUntilExpiry(company.expiryDate))}>
                                📲 WhatsApp → {admin.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {/* MANUAL WARNING — send anytime */}
                        {company.expiryDate && compAdmins.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>Envoyer l'avertissement manuellement :</div>
                            {compAdmins.map(admin => (
                              <button key={admin.id} className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginRight: 4 }}
                                onClick={() => sendExpiryWarningWhatsApp(company, admin, getDaysUntilExpiry(company.expiryDate))}>
                                📲 {admin.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ADMINS */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>
                          Administrateurs ({compAdmins.length}/30)
                        </div>
                      </div>
                      {compAdmins.length === 0 ? (
                        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Aucun admin — créez-en un !</div>
                      ) : (
                        compAdmins.map(u => (
                          <div key={u.id} style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{u.avatar}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>PIN: {u.pin}{u.phone ? ` · ${u.phone}` : ""}</div>
                            </div>
                            <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.15)", color: "var(--red)", fontSize: 11, padding: "4px 8px", flexShrink: 0 }}
                              onClick={() => {
                                if (window.confirm(`Supprimer l'admin ${u.name} ? La compagnie ${company.name} restera intacte.`)) {
                                  deleteDoc(doc(db, "users", String(u.id)));
                                  showToast(`🗑 Admin ${u.name} supprimé`);
                                }
                              }}>
                              🗑 Retirer
                            </button>
                          </div>
                        ))
                      )}

                      {/* CREATE ADMIN FORM — max 3 */}
                      {compAdmins.length >= 30 ? (
                        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
                          ⚠️ Maximum 30 administrateurs atteint
                        </div>
                      ) : creatingAdmin === company.id ? (
                        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>🔑 Créer un admin</div>
                          <input className="form-input" placeholder="Nom *" value={adminForm.name} onChange={e => setAdminForm(p => ({ ...p, name: e.target.value }))} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <input className="form-input" placeholder="Téléphone WhatsApp" value={adminForm.phone} onChange={e => setAdminForm(p => ({ ...p, phone: e.target.value }))} />
                            <input className="form-input" placeholder="Email" value={adminForm.email} onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))} />
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input className="form-input" style={{ flex: 1, fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800, letterSpacing: 8, textAlign: "center" }}
                              maxLength={4} value={adminForm.pin}
                              onChange={e => setAdminForm(p => ({ ...p, pin: e.target.value.replace(/\D/g,"").slice(0,4) }))} />
                            <button className="btn btn-ghost btn-sm" onClick={() => setAdminForm(p => ({ ...p, pin: String(Math.floor(1000 + Math.random() * 9000)) }))}>🔄</button>
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setCreatingAdmin(null)}>Annuler</button>
                            <button className="btn btn-primary btn-sm" disabled={!adminForm.name.trim() || adminForm.pin.length !== 4} onClick={() => createFirstAdmin(company)}>Créer l'admin</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-blue btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => { setCreatingAdmin(company.id); setLastCreatedAdmin(null); setShowWhatsApp(false); }}>
                          + Ajouter un admin {compAdmins.length > 0 ? `(${compAdmins.length}/30)` : ""}
                        </button>
                      )}

                      {/* ACTIONS COMPAGNIE */}
                      <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>Actions compagnie</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className={`btn btn-sm ${isActive ? "btn-danger" : "btn-green"}`} onClick={() => toggleCompany(company)}>
                            {isActive ? "⏸ Suspendre" : "✅ Réactiver"}
                          </button>
                          <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.2)", color: "var(--red)", border: "1px solid rgba(232,82,10,.4)", fontWeight: 700 }}
                            onClick={() => {
                              if (window.confirm(`⚠️ Supprimer définitivement la compagnie "${company.name}" ?\n\nTous les membres et données seront perdus.`)) {
                                deleteCompany(company);
                              }
                            }}>
                            🏚 Supprimer la compagnie
                          </button>
                        </div>
                      </div>
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

// ─── REQUEST ACTIONS ─────────────────────────────────────────────────────────
function RequestActions({ request: r, tool, onApprove, onRefuse }) {
  const [note, setNote] = useState("");
  const [mode, setMode] = useState(null);
  const [loadingApprove, triggerApprove] = useLoadingBtn();
  const [loadingRefuse, triggerRefuse]   = useLoadingBtn();

  if (mode === "refuse") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea className="form-input" rows={2} placeholder="Motif du refus..." value={note} onChange={e => setNote(e.target.value)} />
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>Annuler</button>
        <button className={`btn btn-danger btn-sm ${loadingRefuse ? "loading" : ""}`} disabled={loadingRefuse}
          onClick={() => triggerRefuse(() => onRefuse(note))}>
          {loadingRefuse ? "⏳..." : "Confirmer le refus"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input className="form-input" style={{ flex: 1, fontSize: 12 }} placeholder="Note optionnelle..." value={note} onChange={e => setNote(e.target.value)} />
      <button className={`btn btn-green btn-sm ${loadingApprove ? "loading" : ""}`} disabled={loadingApprove}
        onClick={() => triggerApprove(() => onApprove(note))}>
        {loadingApprove ? "⏳..." : "✅ Approuver"}
      </button>
      <button className="btn btn-danger btn-sm" onClick={() => setMode("refuse")}>❌ Refuser</button>
    </div>
  );
}

// ─── PARC TOOL ROW ────────────────────────────────────────────────────────────
function ParcToolRow({ tool: t, assignee, isMyTool, currentUser, onAsk }) {
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState("");

  const sendAsk = async () => {
    if (!msg.trim()) return;
    const id = String(Date.now());
    // Crée une demande visible par tous
    await setDoc(doc(db, "requests", id), {
      id, type: "employé-ask", status: "pending",
      from: currentUser.id, fromName: currentUser.name,
      toolId: String(t.id), toolName: t.name, toolLocation: t.location,
      targetViewerId: String(t.assignedTo), targetViewerName: assignee?.name,
      note: msg,
      text: `💬 ${currentUser.name} demande à ${assignee?.name} : "${msg}" (outil : ${t.name})`,
      date: new Date().toISOString(),
    });
    setMsg(""); setAsking(false);
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{t.photo}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            📍 {t.location}
            {assignee && <span style={{ color: "var(--blue)", marginLeft: 6 }}>👷 {assignee.name}</span>}
          </div>
        </div>
        {isMyTool
          ? <span style={{ fontSize: 11, background: "rgba(245,166,35,.2)", color: "var(--accent)", padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>Le mien</span>
          : <button className="btn btn-blue btn-sm" onClick={() => setAsking(!asking)}>💬 Demander</button>
        }
      </div>
      {asking && !isMyTool && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", display: "flex", gap: 8 }}>
          <input className="form-input" style={{ flex: 1, fontSize: 12 }}
            placeholder={`Message à ${assignee?.name}... ex: tu en as encore besoin ?`}
            value={msg} onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendAsk()} />
          <button className="btn btn-primary btn-sm" onClick={sendAsk} disabled={!msg.trim()}>Envoyer</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAsking(false)}>×</button>
        </div>
      )}
    </div>
  );
}

// ─── VIEWER TOOL CARD ─────────────────────────────────────────────────────────
function ViewerToolCard({ tool: t, currentUser, users, viewers, chantiers, onOpen, onRequest }) {
  const [action, setAction] = useState(null);
  const [targetViewer, setTargetViewer] = useState("");
  const [targetChantier, setTargetChantier] = useState("");
  const [note, setNote] = useState("");

  const otherPainters = viewers.filter(v => String(v.id) !== String(currentUser.id));

  const submit = (type) => {
    const targetName = targetViewer ? users.find(u => String(u.id) === String(targetViewer))?.name : null;
    onRequest({ type, toolId: t.id, toolName: t.name, toolLocation: t.location, targetViewerId: targetViewer || null, targetViewerName: targetName, targetChantier: targetChantier || null, note });
    setAction(null); setNote(""); setTargetViewer(""); setTargetChantier("");
  };

  return (
    <div className={`tool-card${t.status === "nonfunctional" ? " nonfunctional" : ""}`}>
      {t.photoUrl
        ? <img src={t.photoUrl} alt={t.name} className="tool-photo-card" onClick={onOpen} style={{ cursor: "pointer" }} />
        : <div className="tool-photo-placeholder" onClick={onOpen} style={{ cursor: "pointer" }}><span className="big-emoji">{t.photo}</span><span style={{ fontSize: 11 }}>Aucune photo</span></div>
      }
      <div className="tool-card-top" onClick={onOpen} style={{ cursor: "pointer" }}>
        <div className="tool-meta" style={{ width: "100%" }}>
          <div className="tool-name">{t.name}</div>
          {t.ref && <div className="tool-ref">🏭 {t.ref}</div>}
        </div>
      </div>
      <div className="tool-card-body" onClick={onOpen} style={{ cursor: "pointer" }}>
        <div className="tool-desc">{t.description}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>📍 {t.location}</div>
        {t.price && <div style={{ marginTop: 4 }}><span className="price-tag">🇲🇺 Rs {t.price.toLocaleString("fr-MU")}</span></div>}
      </div>

      {/* ACTION BUTTONS */}
      {!action && (
        <div style={{ padding: "10px 12px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-blue btn-sm" onClick={() => setAction("transfer")}>🔄 Demander transfert</button>
          <button className="btn btn-green btn-sm" onClick={() => setAction("return")}>🏠 Retour store</button>
          <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.2)", color: "#f07030" }} onClick={() => setAction("nonfunctional")}>🔴 Non fonctionnel</button>
        </div>
      )}

      {/* TRANSFER REQUEST */}
      {action === "transfer" && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>🔄 Demande de transfert</div>
          <select className="form-input" value={targetViewer} onChange={e => setTargetViewer(e.target.value)}>
            <option value="">— Vers quel employé ? —</option>
            {otherPainters.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select className="form-input" value={targetChantier} onChange={e => setTargetChantier(e.target.value)}>
            <option value="">— Vers quel chantier ? —</option>
            {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <textarea className="form-input" rows={2} placeholder="Note optionnelle..." value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>📨 Un admin devra approuver cette demande</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>Annuler</button>
            <button className="btn btn-blue btn-sm" disabled={!targetViewer || !targetChantier} onClick={() => submit("transfer")}>Envoyer la demande</button>
          </div>
        </div>
      )}

      {/* RETURN REQUEST */}
      {action === "return" && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>🏠 Demande de retour au store</div>
          <textarea className="form-input" rows={2} placeholder="Note optionnelle... ex: travaux terminés" value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>📨 Un admin devra approuver cette demande</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>Annuler</button>
            <button className="btn btn-green btn-sm" onClick={() => submit("return")}>Envoyer la demande</button>
          </div>
        </div>
      )}

      {/* NON FUNCTIONAL */}
      {action === "nonfunctional" && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f07030" }}>🔴 Signaler non fonctionnel</div>
          <textarea className="form-input" rows={2} placeholder="Décrivez le problème... ex: câble coupé" value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>⚠️ L'outil sera marqué non fonctionnel et les admins notifiés immédiatement</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>Annuler</button>
            <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.3)", color: "#f07030" }} onClick={() => submit("nonfunctional")}>Confirmer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ users, companies, onLogin, db }) {
  const [step, setStep] = useState("company"); // "company" | "profile"
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyPin, setCompanyPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const superAdmins = users.filter(u => u.role === "superadmin");

  const handleCompanyPin = (digit) => {
    const newPin = companyPin + digit;
    setCompanyPin(newPin);
    setPinError(false);

    if (newPin.length === 4) {
      // Find company with this PIN
      const found = companies.find(c => c.companyPin === newPin && c.active !== false);
      if (found) {
        setSelectedCompany(found);
        setStep("profile");
        setCompanyPin("");
      } else {
        setPinError(true);
        setTimeout(() => { setCompanyPin(""); setPinError(false); }, 1000);
      }
    }
  };

  // If no users at all — show first admin form
  if (users.length === 0) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-title">TOOL TRACK</div>
          <div className="login-sub">Bienvenue ! Créez le premier administrateur pour démarrer.</div>
          <FirstAdminForm onSave={async (u) => {
            await setDoc(doc(db, "users", String(u.id)), u);
            onLogin(u);
          }} />
        </div>
      </div>
    );
  }

  // STEP 2 — Choose profile within company
  if (step === "profile" && selectedCompany) {
    const companyUsers = users.filter(u => u.companyId === selectedCompany.id);
    return (
      <div className="login-screen">
        <div className="login-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, width: "100%" }}>
            <button onClick={() => { setStep("company"); setSelectedCompany(null); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
            <div style={{ flex: 1 }}>
              <div className="login-title" style={{ fontSize: 22, marginBottom: 0 }}>TOOL TRACK</div>
              <div style={{ fontSize: 13, color: selectedCompany.color || "var(--accent)", fontWeight: 700 }}>🏢 {selectedCompany.name}</div>
            </div>
          </div>
          <div className="login-sub">Choisissez votre profil</div>
          <div className="user-select-list">
            {companyUsers.map(u => (
              <PinLogin key={u.id} user={u} onSuccess={onLogin} />
            ))}
          </div>
          {companyUsers.length === 0 && (
            <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Aucun profil dans cette compagnie
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 1 — Enter company PIN
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-title">TOOL TRACK</div>

        {/* Superadmin — direct access at top */}
        {superAdmins.length > 0 && (
          <div style={{ width: "100%", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#e84040", textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>👑 Administration</div>
            {superAdmins.map(u => (
              <PinLogin key={u.id} user={u} onSuccess={onLogin} />
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, marginBottom: 16 }} />
          </div>
        )}

        <div className="login-sub">Entrez le code de votre compagnie</div>

        {/* PIN DOTS */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "20px 0" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < companyPin.length ? (pinError ? "var(--red)" : "var(--accent)") : "var(--border)", transition: "all .15s" }} />
          ))}
        </div>

        {pinError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12, fontWeight: 700 }}>❌ Code incorrect</div>}

        {/* KEYPAD */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%", maxWidth: 280 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
            <button key={i}
              onClick={() => {
                if (d === "⌫") { setCompanyPin(p => p.slice(0,-1)); setPinError(false); }
                else if (d !== "") handleCompanyPin(String(d));
              }}
              style={{ padding: "16px 0", borderRadius: 12, border: "1px solid var(--border)", background: d === "⌫" ? "rgba(232,82,10,.1)" : "var(--surface)", color: d === "⌫" ? "var(--red)" : "var(--text)", fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, cursor: d === "" ? "default" : "pointer", opacity: d === "" ? 0 : 1 }}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
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
    const bgColor = user.role === "superadmin" ? "#e84040" : user.role === "admin" ? "var(--accent)" : "var(--blue)";
    const textColor = user.role === "viewer" ? "#fff" : "#000";
    const roleLabel = user.role === "superadmin" ? "👑 Super Admin" : user.role === "admin" ? "🔑 Admin" : "👷 Employé";
    return (
      <div className="user-select-item" onClick={() => setOpen(true)}>
        <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0, background: bgColor, color: textColor }}>{user.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{roleLabel}</div>
        </div>
        <span style={{ fontSize: 18, color: "var(--muted)" }}>›</span>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 16, border: `1px solid ${error ? "var(--red)" : "var(--border)"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, background: user.role === "superadmin" ? "#e84040" : user.role === "admin" ? "var(--accent)" : "var(--blue)", color: user.role === "viewer" ? "#fff" : "#000" }}>{user.avatar}</div>
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
    onSave({ id, name: name.trim(), role: "superadmin", avatar: initials, phone, email, pin, companyId: null });
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
