import { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "./firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, deleteUser as deleteAuthUser } from "firebase/auth";

const T = {
  fr: {
    dashboard: "Dashboard", tools: "Outils", chantiers: "Chantiers",
    requests: "Demandes", team: "Équipe", companies: "Compagnies",
    mytools: "Mes outils", parc: "Parc", profile: "Profil", messages: "Messages",
    add: "Ajouter", save: "Sauvegarder", cancel: "Annuler", delete: "Supprimer",
    edit: "Modifier", confirm: "Confirmer", send: "Envoyer", create: "Créer",
    approve: "Approuver", refuse: "Refuser", close: "Fermer",
    addTool: "Ajouter un outil", toolName: "Nom", supplier: "Fournisseur",
    purchaseDate: "Achat", price: "Prix d'achat (Rs)", description: "Description",
    photo: "Photo de l'outil", takePhoto: "Prendre une photo", gallery: "Choisir depuis la galerie",
    noPhoto: "Aucune photo", store: "Store", assigned: "Sur chantier",
    nonfunctional: "Non fonctionnel", obsolete: "Obsolète",
    inStore: "En store", onSite: "Sur chantier",
    addProfile: "Ajouter un profil", fullName: "Nom complet", role: "Rôle",
    phone: "Téléphone WhatsApp", email: "Email", pin: "Code PIN (4 chiffres)",
    employee: "Employé", admin: "Admin", superadmin: "Super Admin",
    createProfile: "Créer le profil", sendWhatsApp: "Envoyer l'invitation via WhatsApp",
    newCompany: "Nouvelle compagnie", companyName: "Nom de la compagnie",
    expiryDate: "Date d'expiration", contactEmail: "Email de contact",
    companyCode: "Code de la compagnie", suspend: "Suspendre", reactivate: "Réactiver",
    suspended: "Suspendue", active: "Active",
    pending: "En attente", approved: "Approuvé", refused: "Refusé",
    transfer: "Transfert", returnStore: "Retour store", nonFunctional: "Non fonctionnel",
    enterCompanyCode: "Entrez le code de votre compagnie",
    chooseProfile: "Choisissez votre profil", administration: "Administration",
    noTools: "Aucun outil", noRequests: "Aucune demande", noTeam: "Aucun membre",
    required: "obligatoire", optional: "optionnel",
    language: "Langue", french: "Français", english: "English",
    all: "Tous", selectAll: "Tout sélectionner", search: "Chercher un outil...", details: "Détails",
    globalView: "Vue globale", byCompany: "Par compagnie", totalValue: "Valeur totale du parc",
    totalTools: "Outils total", inStore2: "En store", onSite2: "Sur chantier", nonFunctional2: "Non fonctionnels", inTransit: "En transit", giveTool: "Donner l'outil", transitDriver: "Transporteur (obligatoire)", transitDest: "Destination prévue", receiveBtn: "📦 Recevoir l'outil", transitBy: "En transit avec", transitFrom: "Donné par", cancelTransit: "Annuler transit", obsolete2: "Obsolètes", pendingReq: "Demandes en attente", pendingLabel: "en attente", pendingAdmin: "En attente d'un admin", approvedBy: "Approuvé par", refusedBy: "Refusé par",
    toolsOnSite: "Outils sur chantiers", resetTest: "Reset données test",
    totalTeam: "Équipes total", deselect: "Désélectionner", selected2: "sélectionné",
    allEmployees: "Tous les employés", allSites: "Tous les chantiers", notAssigned: "Non assigné",
    noTool: "Aucun outil", noToolSub: "Cliquez sur + Ajouter un outil pour commencer",
    noRequest: "Aucune demande pour le moment", noMember: "Aucun membre",
    groupRequest: "Demande groupée", requestType: "Type de demande", returnStore2: "Retour store", requestsSent: "Demandes envoyées !", toolsConcerned: "Outils concernés", transferTo2: "Transférer à", reasonNote: "Raison de la demande...", noteOptional: "Note (optionnel)", supplier: "Fournisseur", purchase: "Achat", status2: "Statut", location2: "Localisation", responsible: "Responsable", purchaseValue: "Valeur d'achat", repairTotal: "Total réparations", repairWarning: "Cumul de toutes les réparations.", lossWarning: "En cas de perte ou dommage, ce montant sera à rembourser par le responsable de l'outil.", outStore: "Sortir du store → Chantier", assignTo: "— Confier à —", outAndAssign: "Sortir & Confier", repairTracking: "Suivi réparation", reportProblem: "Signaler un problème :", repairCost: "Coût réparation estimé (Rs) — optionnel", repairNote: "Note : câble coupé, moteur grillé...", openTracking: "Ouvrir le suivi", confirmSuppr: "Confirmer la suppression", irreversible: "Action irréversible.", editName: "Nom *", camera: "Caméra", gallery: "Galerie", save: "✅ Sauvegarder", description2: "Description", historyTitle: "Historique", byLabel: "par", chooseEmployee2: "— Choisir un employé —", chooseSite2: "— Choisir un chantier —",
    transferTo: "Transférer à", chooseEmployee: "— Choisir un employé —", chooseSite: "— Choisir un chantier —",
    optNote: "Note optionnelle...", adminWillProcess: "L'admin va traiter vos demandes.",
    requestSent: "Demandes envoyées !",
    noToolAssigned: "Aucun outil confié", toolAssignedSoon: "Un admin vous assignera un outil bientôt.",
    reminderBanner: "Rappel : certains outils vous sont confiés depuis plus de 3 jours.",
    directTransfer: "Transfert direct — aucune approbation requise",
    needsApproval: "Votre demande sera soumise à approbation par un admin",
    transferNow: "Transférer maintenant", sendReq: "Envoyer la demande",
    newSite: "Nouveau chantier", siteName: "Nom du chantier...", newBtn: "+ Nouveau", siteLabel: "Chantier", createSite: "+ Créer", colorLabel: "Couleur", active2Label: "Actif", inactive2Label: "Inactif", noSiteMsg: "Aucun chantier — ajoutez-en un ci-dessus.", employees2: "Employés", supervisionMode: "Mode supervision — vous voyez l'app comme", supervisionRole: "rôle", quitSupervision: "✕ Quitter la supervision",
    announcements: "Annonces", adminMessages: "Messages Admins",
    readOnly: "Lecture seule — contactez votre Directeur ou Admin pour toute question",
    writeAnnouncement: "Écrire une annonce...",
    newCompany2: "+ Nouvelle", addDirector: "+ Ajouter un Directeur",
    deleteAccount: "Supprimer mon compte", toolsOnSiteLabel: "Outils sur chantiers", deleteBtn: "Supprimer", directors: "Directeurs", admins: "Admins", director: "Directeur", directorCreated: "Directeur créé", profileDeleted: "Profil supprimé", deleteConfirm: "Supprimer", cannotDeleteSelf: "Vous ne pouvez pas vous supprimer vous-même", cannotDeleteRole: "Vous ne pouvez pas supprimer ce profil",
    active2: "Active", suspended2: "Suspendue", actionRequired: "Action requise",
    noCompany: "Aucune compagnie — créez-en une !", toolManagement: "Gestion d'outils",
    disconnect: "Déconnexion", actives: "Actives", total: "Total",
    expiredLabel: "Expiré", addDirector2: "+ Ajouter un Directeur", maxReached: "Maximum atteint",
    suspend2: "Suspendre", reactivate2: "Réactiver", deleteCompany: "Supprimer",
    expiryContact: "Expiration & Contact", noDate: "Aucune date", notDefined: "Non défini",
    none: "Aucun", saveBtn: "Sauvegarder", newAnnouncement: "Nouvelle annonce",
    adminMsg: "Message entre admins", visibleAll: "Visible par tous — les employés pourront lire mais pas répondre",
    visibleAdmins: "Visible uniquement par les admins", noAnnouncement: "Aucune annonce",
    noAdminMsg: "Aucun message entre admins", subject: "Sujet", yourMessage: "Votre message...",
    from: "De", required2: "obligatoire",
  },
  en: {
    dashboard: "Dashboard", tools: "Tools", chantiers: "Job Sites",
    requests: "Requests", team: "Team", companies: "Companies",
    mytools: "My Tools", parc: "Tool Park", profile: "Profile", messages: "Messages",
    add: "Add", save: "Save", cancel: "Cancel", delete: "Delete",
    edit: "Edit", confirm: "Confirm", send: "Send", create: "Add",
    approve: "Approve", refuse: "Refuse", close: "Close",
    addTool: "Add a tool", toolName: "Name", supplier: "Supplier",
    purchaseDate: "Purchase date", price: "Purchase price (Rs)", description: "Description",
    photo: "Tool photo", takePhoto: "Take a photo", gallery: "Choose from gallery",
    noPhoto: "No photo", store: "Store", assigned: "On site",
    nonfunctional: "Not functional", obsolete: "Obsolete",
    inStore: "In store", onSite: "On job site",
    addProfile: "Add a profile", fullName: "Full name", role: "Role",
    phone: "WhatsApp phone", email: "Email", pin: "PIN code (4 digits)",
    employee: "Employee", admin: "Admin", superadmin: "Super Admin",
    createProfile: "Create profile", sendWhatsApp: "Send invitation via WhatsApp",
    newCompany: "New company", companyName: "Company name",
    expiryDate: "Expiry date", contactEmail: "Contact email",
    companyCode: "Company code", suspend: "Suspend", reactivate: "Reactivate",
    suspended: "Suspended", active: "Active",
    pending: "Pending", approved: "Approved", refused: "Refused",
    transfer: "Transfer", returnStore: "Return to store", nonFunctional: "Not functional",
    enterCompanyCode: "Enter your company code",
    chooseProfile: "Choose your profile", administration: "Administration",
    noTools: "No tools", noRequests: "No requests", noTeam: "No members",
    required: "required", optional: "optional",
    language: "Language", french: "Français", english: "English",
    all: "All", selectAll: "Select all", search: "Search a tool...", details: "Details",
    globalView: "Global view", byCompany: "By company", totalValue: "Total fleet value",
    totalTools: "Total tools", inStore2: "In store", onSite2: "On site", nonFunctional2: "Not functional", inTransit: "In transit", giveToolg: "Give tool", transitDriver: "Transporter (required)", transitDest: "Planned destination", receiveBtn: "📦 Receive tool", transitBy: "In transit with", transitFrom: "Given by", cancelTransit: "Cancel transit", obsolete2: "Obsolete", pendingReq: "Pending requests", pendingLabel: "pending", pendingAdmin: "Waiting for admin", approvedBy: "Approved by", refusedBy: "Refused by",
    toolsOnSite: "Tools on site", resetTest: "Reset test data",
    totalTeam: "Total teams", deselect: "Deselect", selected2: "selected",
    allEmployees: "All employees", allSites: "All job sites", notAssigned: "Not assigned",
    noTool: "No tools", noToolSub: "Click + Add a tool to start",
    noRequest: "No requests yet", noMember: "No members",
    groupRequest: "Group request", requestType: "Request type", returnStore2: "Return to store", requestsSent: "Requests sent!", toolsConcerned: "Tools concerned", transferTo2: "Transfer to", reasonNote: "Reason for request...", noteOptional: "Note (optional)", supplier: "Supplier", purchase: "Purchase", status2: "Status", location2: "Location", responsible: "Responsible", purchaseValue: "Purchase value", repairTotal: "Total repairs", repairWarning: "Cumulative total of all repairs.", lossWarning: "In case of loss or damage, this amount will be charged to the tool's responsible person.", outStore: "Out of store → Job site", assignTo: "— Assign to —", outAndAssign: "Out & Assign", repairTracking: "Repair tracking", reportProblem: "Report a problem:", repairCost: "Estimated repair cost (Rs) — optional", repairNote: "Note: cut cable, burnt motor...", openTracking: "Open tracking", confirmSuppr: "Confirm deletion", irreversible: "Irreversible action.", editName: "Name *", camera: "Camera", gallery: "Gallery", save: "✅ Save", description2: "Description", historyTitle: "History", byLabel: "by", chooseEmployee2: "— Choose an employee —", chooseSite2: "— Choose a job site —",
    transferTo: "Transfer to", chooseEmployee: "— Choose an employee —", chooseSite: "— Choose a job site —",
    optNote: "Optional note...", adminWillProcess: "The admin will process your requests.",
    requestSent: "Requests sent!",
    noToolAssigned: "No tools assigned", toolAssignedSoon: "An admin will assign you a tool soon.",
    reminderBanner: "Reminder: some tools have been assigned to you for more than 3 days.",
    directTransfer: "Direct transfer — no approval required",
    needsApproval: "Your request will be submitted for admin approval",
    transferNow: "Transfer now", sendReq: "Send request",
    newSite: "New job site", siteName: "Job site name...", newBtn: "+ New", siteLabel: "Job Site", createSite: "+ Create", colorLabel: "Color", active2Label: "Active", inactive2Label: "Inactive", noSiteMsg: "No job sites — add one above.", employees2: "Employees", supervisionMode: "Supervision mode — you are viewing the app as", supervisionRole: "role", quitSupervision: "✕ Quit supervision",
    announcements: "Announcements", adminMessages: "Admin Messages",
    readOnly: "Read only — contact your Director or Admin for any question",
    writeAnnouncement: "Write an announcement...",
    newCompany2: "+ New", addDirector: "+ Add a Director",
    deleteAccount: "Delete my account", toolsOnSiteLabel: "Tools on job sites", deleteBtn: "Delete", directors: "Directors", admins: "Admins", director: "Director", directorCreated: "Director created", profileDeleted: "Profile deleted", deleteConfirm: "Delete", cannotDeleteSelf: "You cannot delete your own account", cannotDeleteRole: "You cannot delete this profile",
    active2: "Active", suspended2: "Suspended", actionRequired: "Action required",
    noCompany: "No companies yet — create one!", toolManagement: "Tool management",
    disconnect: "Disconnect", actives: "Active", total: "Total",
    expiredLabel: "Expired", addDirector2: "Add a Director", maxReached: "Maximum reached",
    suspend2: "Suspend", reactivate2: "Reactivate", deleteCompany: "Delete",
    expiryContact: "Expiry & Contact", noDate: "No date", notDefined: "Not defined",
    none: "None", saveBtn: "Save", newAnnouncement: "New announcement",
    adminMsg: "Admin message", visibleAll: "Visible to all — employees can read but not reply",
    visibleAdmins: "Visible to admins only", noAnnouncement: "No announcements",
    noAdminMsg: "No admin messages", subject: "Subject", yourMessage: "Your message...",
    from: "From", required2: "required",
  }
};

// FIX #2 — useLang retourne tx (pas t) pour éviter le shadowing avec les variables outil
// Compresser une image avant de la sauvegarder
function compressImage(dataUrl, maxWidth = 600, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

// Fonction globale accessible par tous les composants
function getTx() {
  try { return T[localStorage.getItem("tooltrack_lang") || "fr"] || T["fr"]; } catch { return T["fr"]; }
}

function useLang() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("tooltrack_lang") || "fr"; } catch { return "fr"; }
  });
  const setLanguage = (l) => {
    setLang(l);
    try { localStorage.setItem("tooltrack_lang", l); } catch {}
  };
  // On retourne T[lang] directement — React re-render quand lang change
  const tx = T[lang] || T["fr"];
  return [tx, lang, setLanguage];
}

function useLoadingBtn() {
  const [loading, setLoading] = useState(false);
  const trigger = useCallback(async (fn) => {
    if (loading) return;
    setLoading(true);
    try { await fn(); } finally { setTimeout(() => setLoading(false), 2000); }
  }, [loading]);
  return [loading, trigger];
}

const INITIAL_USERS = [], INITIAL_TOOLS = [], INITIAL_MESSAGES = [], INITIAL_CHANTIERS = [];
const fmt = (d) => new Date(d).toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const daysSince = (iso) => iso ? Math.floor((Date.now() - new Date(iso)) / 86400000) : null;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f1117; --surface: #1a1d26; --surface2: #22263a; --border: #2e3347;
    --accent: #f5a623; --accent2: #e8520a; --green: #27c97a; --red: #e84040;
    --blue: #3a8ef6; --text: #e8eaf0; --muted: #7a8099;
    --font-head: 'Barlow Condensed', sans-serif; --font-body: 'Barlow', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  input, select, textarea { font-family: var(--font-body); }
  button { cursor: pointer; font-family: var(--font-head); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .app { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 210px; min-width: 210px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
  .sidebar-logo { padding: 18px 14px 14px; border-bottom: 1px solid var(--border); }
  .sidebar-logo h1 { font-family: var(--font-head); font-size: 24px; font-weight: 800; letter-spacing: 1px; color: var(--accent); line-height: 1; }
  .sidebar-logo p { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 10px 8px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; cursor: pointer; transition: all .15s; font-size: 13px; font-weight: 700; color: var(--muted); border: 1px solid transparent; background: none; text-align: left; width: 100%; position: relative; letter-spacing: .2px; }
  .nav-item:hover { background: var(--surface2); color: var(--text); border-color: var(--border); }
  .nav-item.active { background: rgba(245,166,35,.13); color: var(--accent); border-color: rgba(245,166,35,.3); }
  .nav-item .icon { font-size: 18px; flex-shrink: 0; }
  .badge { background: var(--red); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; font-family: var(--font-body); margin-left: auto; }
  .sidebar-user { padding: 10px; border-top: 1px solid var(--border); }
  .user-pill { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--surface2); border-radius: 10px; border: 1px solid var(--border); }
  .avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: var(--accent); color: #000; flex-shrink: 0; }
  .user-info .name { font-size: 12px; font-weight: 700; line-height: 1.2; }
  .user-info .role { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
  .bottom-nav { display: none; }
  @media (max-width: 680px) {
    .sidebar { display: none; }
    .bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: var(--surface); border-top: 2px solid var(--border); padding: 6px 2px 10px; gap: 1px; overflow-x: auto; }
    .bottom-nav-item { flex: 0 0 auto; min-width: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 5px 4px; border-radius: 10px; border: none; background: none; color: var(--muted); font-size: 8px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: .3px; position: relative; transition: all .15s; font-family: var(--font-head); }
    .bottom-nav-item .bn-icon { font-size: 20px; line-height: 1; }
    .bottom-nav-item.active { color: var(--accent); }
    .bottom-nav-item .badge { position: absolute; top: 2px; right: 4px; }
    .main { padding-bottom: 75px; }
    .form-row { grid-template-columns: 1fr !important; }
    .detail-grid { grid-template-columns: 1fr !important; }
  }
  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .topbar { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--surface); position: sticky; top: 0; z-index: 10; }
  .topbar h2 { font-family: var(--font-head); font-size: 26px; font-weight: 800; letter-spacing: .5px; }
  .content { padding: 24px; flex: 1; }
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
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .tool-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: all .2s; }
  .tool-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
  .tool-card-top { padding: 16px; display: flex; align-items: flex-start; gap: 12px; }
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
  .price-tag-lg { display: inline-flex; align-items: center; gap: 5px; background: rgba(232,82,10,.13); color: #f07030; font-size: 15px; font-weight: 800; padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(232,82,10,.35); }
  .price-warning { font-size: 11px; color: var(--muted); font-style: italic; margin-top: 3px; }
  .tool-photo-card { width: 100%; height: auto; max-height: 120px; object-fit: contain; background: var(--surface2); display: block; }
  .tool-photo-placeholder { width: 100%; height: 80px; background: var(--surface2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--muted); font-size: 13px; }
  .tool-photo-placeholder .big-emoji { font-size: 30px; }
  .tool-photo-detail { width: 100%; height: 220px; object-fit: cover; border-radius: 10px; }
  .tool-photo-detail-placeholder { width: 100%; height: 220px; background: var(--surface2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 72px; }
  .photo-preview { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-top: 8px; }
  .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  .filter-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); color: var(--muted); font-size: 12px; font-weight: 600; transition: all .15s; }
  .filter-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
  .filter-btn:hover:not(.active) { border-color: var(--accent); color: var(--accent); }
  .search-bar { flex: 1; min-width: 180px; position: relative; }
  .search-bar input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 7px 12px 7px 32px; color: var(--text); font-size: 13px; outline: none; }
  .search-bar input:focus { border-color: var(--accent); }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 14px; pointer-events: none; }
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
  .users-list { display: flex; flex-direction: column; gap: 10px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .stat-num { font-family: var(--font-head); font-size: 38px; font-weight: 800; line-height: 1; }
  .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .stat-accent { color: var(--accent); } .stat-green { color: var(--green); } .stat-blue { color: var(--blue); } .stat-red { color: var(--red); }
  .history-list { display: flex; flex-direction: column; }
  .history-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .history-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .history-text { font-size: 13px; color: var(--text); }
  .history-date { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .reminder-banner { background: rgba(232,82,10,.12); border: 1px solid rgba(232,82,10,.4); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .reminder-banner p { font-size: 13px; color: #f07030; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .detail-item { background: var(--surface2); border-radius: 8px; padding: 10px 12px; }
  .detail-key { font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; }
  .detail-val { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .login-screen { position: fixed; inset: 0; background: var(--bg); display: flex; align-items: center; justify-content: center; z-index: 200; flex-direction: column; gap: 16px; }
  .login-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px; width: 340px; }
  .login-title { font-family: var(--font-head); font-size: 32px; font-weight: 800; color: var(--accent); margin-bottom: 4px; }
  .login-sub { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
  .user-select-list { display: flex; flex-direction: column; gap: 8px; }
  .user-select-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--surface2); border-radius: 10px; cursor: pointer; border: 1px solid transparent; transition: all .15s; }
  .user-select-item:hover { border-color: var(--accent); }
  .assign-section { background: var(--surface2); border-radius: 10px; padding: 14px; }
  .assign-section h4 { font-family: var(--font-head); font-size: 16px; font-weight: 700; margin-bottom: 10px; color: var(--accent); }
  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--surface); border: 1px solid var(--green); border-radius: 12px; padding: 14px 18px; max-width: 320px; z-index: 999; box-shadow: 0 8px 32px rgba(0,0,0,.5); animation: slideIn .3s ease; }
  .toast.warn { border-color: var(--accent); }
  @keyframes slideIn { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
  .toast-text { font-size: 12px; color: var(--muted); }
`;
export default function App() {
  const [tx, lang, setLanguage] = useLang(); // FIX #2 renommé tx
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
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [filterChantier, setFilterChantier] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);
  const [showMovePanel, setShowMovePanel] = useState(false);
  const [supervisedUser, setSupervisedUser] = useState(null); // mode supervision
  const toastRef = useRef();

  const isSuperAdmin = currentUser?.role === "superadmin" && !supervisedUser;
  const effectiveUser = supervisedUser ? supervisedUser.fakeUser : currentUser;
  const isAdmin = effectiveUser?.role === "admin" || effectiveUser?.role === "director" || (effectiveUser?.role === "superadmin" && !supervisedUser);

  // FIX #11 — unreadMessages utilisé dans la nav (badge messages)
  const unreadMessages = messages.filter(m => !m.read && String(m.from) !== String(effectiveUser?.id)).length;

  const myCompanyId = effectiveUser?.companyId || null;
  const filteredUsers = (currentUser?.role === "superadmin" && !supervisedUser) ? users : users.filter(u => u.companyId === myCompanyId);
  const filteredTools = (currentUser?.role === "superadmin" && !supervisedUser) ? tools : tools.filter(tool => tool.companyId === myCompanyId);
  const filteredChantiers = (currentUser?.role === "superadmin" && !supervisedUser) ? chantiers : chantiers.filter(c => c.companyId === myCompanyId);
  const filteredRequests = (currentUser?.role === "superadmin" && !supervisedUser) ? requests : requests.filter(r => r.companyId === myCompanyId);
  const pendingRequests = filteredRequests.filter(r => r.status === "pending").length;
  const viewers = filteredUsers.filter(u => ["viewer", "admin", "director"].includes(u.role));
  const myTools = filteredTools.filter(tool => String(tool.assignedTo) === String(effectiveUser?.id));
  const myCompany = companies.find(c => c.id === myCompanyId);

  // MODE SUPERVISION — le vrai user connecté reste intact, on simule un autre profil
  const realUser = supervisedUser ? supervisedUser.realUser : null;
  const activeUser = supervisedUser ? supervisedUser.fakeUser : currentUser;
  const isSupervising = !!supervisedUser;

  // Hiérarchie : qui peut superviser qui ?
  const canSupervise = (supervisor, target) => {
    const hierarchy = { superadmin: 4, director: 3, admin: 2, viewer: 1 };
    return (hierarchy[supervisor?.role] || 0) > (hierarchy[target?.role] || 0);
  };

  const startSupervision = (targetUser) => {
    if (!canSupervise(currentUser, targetUser)) return;
    setSupervisedUser({ realUser: currentUser, fakeUser: targetUser });
    // Reset tous les filtres pour éviter les conflits
    setFilterUser("all");
    setFilterChantier("all");
    setFilterStatus("all");
    setSearch("");
    setSelectedTools([]);
    showToast(`👁 Mode supervision : ${targetUser.name}`);
    setPage(["admin","director"].includes(targetUser.role) ? "tools" : "mytools");
  };

  // RESET TEMPORAIRE - A SUPPRIMER AVANT MISE EN PRODUCTION
  const resetAllData = async () => {
    const confirm1 = window.confirm("ATTENTION - Supprimer TOUTES les donnees de test ?\n\nVotre compte SuperAdmin sera conserve.\n\nEtes-vous sur ?");
    if (!confirm1) return;
    const confirm2 = window.confirm("DERNIERE CONFIRMATION - Toutes les donnees seront supprimees. Continuer ?");
    if (!confirm2) return;
    showToast("⏳ Reset en cours...");
    try {
      const collections = ["companies", "tools", "chantiers", "requests", "messages", "conversations"];
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        for (const d of snap.docs) await deleteDoc(doc(db, col, d.id));
      }
      // Supprimer tous les users sauf le SuperAdmin
      const usersSnap = await getDocs(collection(db, "users"));
      for (const d of usersSnap.docs) {
        if (d.data().role !== "superadmin") await deleteDoc(doc(db, "users", d.id));
      }
      showToast("✅ Reset complet — repartez de zéro !");
    } catch(e) {
      showToast("❌ Erreur : " + e.message);
    }
  };

  const stopSupervision = () => {
    setSupervisedUser(null);
    // Reset tous les filtres
    setFilterUser("all");
    setFilterChantier("all");
    setFilterStatus("all");
    setSearch("");
    setSelectedTools([]);
    showToast("✅ Retour à votre profil");
    setPage(currentUser.role === "superadmin" ? "dashboard" : "tools");
  };

  // FIX #F — vérifie que la page sauvegardée est accessible pour le rôle de l'utilisateur
  const getValidPage = (savedPage, u) => {
    const isSA = u.role === "superadmin";
    const isAd = ["admin", "director", "superadmin"].includes(u.role);
    const isViewer = u.role === "viewer";
    const adminPages = ["dashboard", "tools", "chantiers", "requests", "messages", "users"];
    const viewerPages = ["mytools", "parc", "requests", "messages"];
    const superPages = ["dashboard", "companies", "requests", "messages", "users"];
    const allowed = isSA ? superPages : isAd ? adminPages : viewerPages;
    if (savedPage && allowed.includes(savedPage)) return savedPage;
    return isSA ? "dashboard" : isAd ? "tools" : "mytools";
  };

  // Supprimer un utilisateur complètement — Firestore + Firebase Auth
  const deleteUserCompletely = async (u) => {
    // 1. Supprimer le profil Firestore
    await deleteDoc(doc(db, "users", String(u.id)));
    // 2. Si le user a un authUid, supprimer aussi de Firebase Auth
    // Note: on ne peut supprimer que le compte connecté via deleteUser()
    // Pour supprimer un autre compte, il faudrait Firebase Admin SDK (côté serveur)
    // Pour l'instant on marque le compte comme supprimé dans Auth via metadata
    if (u.authUid) {
      // Stocker dans Firestore une liste noire pour bloquer les connexions
      try {
        await setDoc(doc(db, "deletedAuthUids", u.authUid), { 
          deletedAt: new Date().toISOString(), 
          email: u.email || "",
          name: u.name || ""
        });
      } catch(e) {}
    }
  };

  const loginUser = (u) => {
    setCurrentUser(u);
    const savedPage = (() => { try { return localStorage.getItem("tooltrack_last_page"); } catch { return null; } })();
    setPage(getValidPage(savedPage, u));
    try { 
      localStorage.setItem("tooltrack_user_id", u.id);
      localStorage.setItem("tooltrack_user_email", u.email || "");
    } catch(e) {}
  };

  // Auto-suppression Directeur — suspend la compagnie automatiquement
  const deleteDirectorSelf = async () => {
    // Utiliser effectiveUser (le vrai Directeur) même en mode supervision
    const targetDirector = supervisedUser?.fakeUser || currentUser;
    const company = companies.find(c => c.id === targetDirector.companyId);
    const companyName = company?.name || "votre compagnie";
    const superAdmin = users.find(u => u.role === "superadmin");
    const superAdminEmail = superAdmin?.email || "jdecomarmond.profile@intnet.mu";
    const superAdminPhone = superAdmin?.phone?.replace(/\s/g,"").replace(/^\+/,"") || "";

    // Vérifier s'il y a d'autres directeurs dans la compagnie
    const otherDirectors = users.filter(u => 
      u.companyId === targetDirector.companyId && 
      u.role === "director" && 
      String(u.id) !== String(targetDirector.id)
    );

    const isLastDirector = otherDirectors.length === 0;

    // ÉTAPE 1 — Message d'avertissement AVANT toute confirmation
    if (isLastDirector) {
      alert(
        `⚠️ AVERTISSEMENT IMPORTANT\n\n` +
        `Vous êtes le DERNIER Directeur de "${companyName}".\n\n` +
        `Si vous supprimez votre compte :\n` +
        `• La compagnie sera automatiquement SUSPENDUE\n` +
        `• Tous les employés et admins perdront l'accès\n` +
        `• Un message d'alerte sera envoyé au SuperAdmin\n` +
        `• Seul le SuperAdmin pourra rétablir la compagnie\n\n` +
        `Contact SuperAdmin : ${superAdminEmail}`
      );
    } else {
      alert(
        `ℹ️ Information\n\n` +
        `Vous êtes sur le point de supprimer votre compte Directeur.\n\n` +
        `La compagnie "${companyName}" continuera avec les ${otherDirectors.length} autre(s) directeur(s) en place.\n\n` +
        `Cette action est irréversible.`
      );
    }

    // ÉTAPE 2 — Confirmation finale
    const confirmed = window.confirm(
      isLastDirector
        ? `🔴 CONFIRMATION FINALE\n\nSupprimer définitivement votre compte et SUSPENDRE la compagnie "${companyName}" ?\n\nCette action est IRRÉVERSIBLE.`
        : `Confirmer la suppression de votre compte Directeur ?`
    );
    if (!confirmed) return;

    try {
      if (isLastDirector) {
        // Suspendre la compagnie
        if (company) {
          await setDoc(doc(db, "companies", company.id), {
            ...company,
            active: false,
            suspendedReason: `Dernier Directeur (${targetDirector.name}) supprimé le ${new Date().toLocaleDateString("fr-FR")}`,
            suspendedAt: Date.now()
          });
        }

        // Envoyer WhatsApp au SuperAdmin
        const waMsg = encodeURIComponent(
          `🚨 *TOOL TRACK — ALERTE URGENTE*\n\n` +
          `Le Directeur *${targetDirector.name}* vient de supprimer son compte.\n\n` +
          `🏢 Compagnie : *${companyName}*\n` +
          `📧 Email : ${targetDirector.email || "non renseigné"}\n` +
          `⚠️ Statut compagnie : *SUSPENDUE*\n` +
          `📅 Date : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n\n` +
          `👉 Un nouveau Directeur doit être créé pour rétablir l'accès.\n` +
          `🔗 https://tool-track-rosy.vercel.app`
        );
        if (superAdminPhone) {
          window.open(`https://wa.me/${superAdminPhone}?text=${waMsg}`, "_blank");
        } else {
          window.open(`https://wa.me/?text=${waMsg}`, "_blank");
        }

        // Envoyer email au SuperAdmin via mailto
        const mailSubject = encodeURIComponent(`🚨 TOOL TRACK — Compagnie ${companyName} suspendue`);
        const mailBody = encodeURIComponent(
          `Bonjour,\n\n` +
          `Le Directeur ${currentUser.name} (${currentUser.email || "email non renseigné"}) a supprimé son compte le ${new Date().toLocaleDateString("fr-FR")}.\n\n` +
          `Compagnie concernée : ${companyName}\n` +
          `Statut : SUSPENDUE\n\n` +
          `Action requise : Créer un nouveau Directeur pour rétablir l'accès.\n\n` +
          `Lien : https://tool-track-rosy.vercel.app\n\n` +
          `— Tool Track`
        );
        window.open(`mailto:${superAdminEmail}?subject=${mailSubject}&body=${mailBody}`, "_blank");
      }

      // Supprimer le profil Firestore
      await deleteUserCompletely(targetDirector);
      // Déconnexion si c'est le directeur lui-même (pas supervision)
      if (!supervisedUser) {
        try { await signOut(auth); } catch(e) {}
        setCurrentUser(null);
        try { 
          localStorage.removeItem("tooltrack_user_id");
          localStorage.removeItem("tooltrack_user_email");
          localStorage.removeItem("tooltrack_last_page"); 
        } catch(e) {}
      } else {
        // En supervision — juste quitter la supervision
        stopSupervision();
      }
      
      showToast(isLastDirector ? "🗑 Compte supprimé — compagnie suspendue" : "🗑 Compte supprimé");
    } catch(e) {
      showToast("❌ Erreur lors de la suppression : " + e.message);
    }
  };

  const logoutUser = async () => {
    try { await signOut(auth); } catch(e) {}
    setCurrentUser(null);
    try { localStorage.removeItem("tooltrack_user_id"); localStorage.removeItem("tooltrack_last_page"); } catch(e) {}
  };

  useEffect(() => {
    const unsubs = [];
    let loaded = 0;
    const checkLoaded = () => { loaded++; if (loaded >= 2) setLoading(false); };
    // Auto-suppression des demandes approuvées/refusées après 30 jours
    const cleanOldRequests = async () => {
      try {
        const snap = await getDocs(collection(db, "requests"));
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        for (const d of snap.docs) {
          const r = d.data();
          if (["approved","refused"].includes(r.status) && r.date) {
            const age = now - new Date(r.date).getTime();
            if (age > thirtyDays) {
              await deleteDoc(doc(db, "requests", d.id));
            }
          }
        }
      } catch(e) { console.log("cleanup:", e); }
    };
    cleanOldRequests();

    // S'assurer que le chantier Transit existe pour chaque compagnie
    unsubs.push(onSnapshot(collection(db, "companies"), async snap => {
      for (const compDoc of snap.docs) {
        const company = compDoc.data();
        const transitId = company.id + "_transit";
        const transitRef = doc(db, "chantiers", transitId);
        try {
          const transitSnap = await getDoc(transitRef);
          if (!transitSnap.exists()) {
            await setDoc(transitRef, { id: transitId, name: "Transit", color: "#f5a623", companyId: company.id, createdAt: new Date().toISOString(), isTransit: true });
          }
        } catch(e) {}
      }
    }));

    unsubs.push(onSnapshot(collection(db, "users"), snap => {
      const loadedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(loadedUsers);
      try {
          const savedId = localStorage.getItem("tooltrack_user_id");
        const savedEmail = localStorage.getItem("tooltrack_user_email");
        if (savedId || savedEmail) {
          const savedUser = loadedUsers.find(u => 
            u.id === savedId || 
            u.authUid === savedId ||
            (savedEmail && u.email?.toLowerCase() === savedEmail.toLowerCase())
          );
          if (savedUser) {
            setCurrentUser(savedUser);
            const savedPage = localStorage.getItem("tooltrack_last_page");
            setPage(getValidPage(savedPage, savedUser));
          } else {
            localStorage.removeItem("tooltrack_user_id");
            localStorage.removeItem("tooltrack_user_email");
            localStorage.removeItem("tooltrack_last_page");
          }
        }
      } catch(e) {}
      checkLoaded();
    }));
    unsubs.push(onSnapshot(collection(db, "tools"), snap => { setTools(snap.docs.map(d => ({ ...d.data(), id: d.id }))); checkLoaded(); }));
    unsubs.push(onSnapshot(collection(db, "chantiers"), snap => { setChantiers(snap.docs.map(d => ({ ...d.data(), id: d.id }))); }));
    unsubs.push(onSnapshot(collection(db, "messages"), snap => { setMessages(snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))); }));
    unsubs.push(onSnapshot(collection(db, "requests"), snap => { setRequests(snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))); }));
    unsubs.push(onSnapshot(collection(db, "companies"), snap => { setCompanies(snap.docs.map(d => ({ ...d.data(), id: d.id }))); }));
    return () => unsubs.forEach(u => u());
  }, []);

  // FIX #5 — sauvegarde la page courante
  useEffect(() => {
    if (currentUser) { try { localStorage.setItem("tooltrack_last_page", page); } catch(e) {} }
  }, [page, currentUser]);

  // FIX #4 — Suppression du setInterval qui spammait des toasts en boucle.
  // Les rappels sont maintenant une bannière statique dans "Mes outils".

  const showToast = (text, type = "ok") => {
    clearTimeout(toastRef.current);
    setToast({ text, type });
    toastRef.current = setTimeout(() => setToast(null), 4000);
  };

  if (currentUser && !isSuperAdmin && currentUser.role !== "director" && myCompany && myCompany.active === false) {
    const contactEmail = myCompany.contactEmail || "";
    return (
      <><style>{css}</style>
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>⏸️</div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: "var(--red)", marginBottom: 8 }}>Compte suspendu</div>
          <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
            L'accès à <strong>{myCompany.name}</strong> a été suspendu.
            {myCompany.suspendReason === "expiration" && (
              <div style={{ marginTop: 8, color: "var(--accent)" }}>
                Envoyez votre preuve de paiement à :<br/>
                <strong style={{ fontSize: 16 }}>{contactEmail || "Contactez votre administrateur"}</strong>
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logoutUser}>⇄ Changer de compte</button>
        </div>
      </div></>
    );
  }

  const daysLeft = myCompany?.expiryDate ? Math.ceil((new Date(myCompany.expiryDate) - new Date()) / (1000*60*60*24)) : null;
  const showExpiryWarning = !isSuperAdmin && myCompany && daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

  if (loading) {
    return (
      <><style>{css}</style>
      <div className="login-screen">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>TOOL TRACK</div>
          <div style={{ color: "var(--muted)", marginTop: 8, fontSize: 13 }}>Connexion à la base de données...</div>
        </div>
      </div></>
    );
  }

  if (!currentUser) {
    return (
      <><style>{css}</style>
      <LoginScreen users={users} companies={companies} onLogin={loginUser} db={db} lang={lang} setLanguage={setLanguage} t={tx} /></>
    );
  }

  const openTool = (tool) => setModal({ type: "tool", data: tool });
  const deleteTool = async (toolId) => { await deleteDoc(doc(db, "tools", String(toolId))); showToast("🗑 Outil supprimé"); setModal(null); };
  const updateTool = async (toolId, updates) => {
    const tool = filteredTools.find(tool => String(tool.id) === String(toolId));
    if (!tool) return;
    await setDoc(doc(db, "tools", String(toolId)), { ...tool, ...updates });
    // FIX #B — on ne ferme plus le modal, le ToolDetailModal sort du mode édition localement
    showToast("✅ Outil mis à jour");
  };
  const assignTool = async (toolId, viewerId, chantier, direction) => {
    const newViewer = viewerId ? users.find(u => String(u.id) === String(viewerId)) : null;
    const tool = tools.find(tool => tool.id === toolId);
    const prevOwner = tool.assignedTo ? users.find(u => String(u.id) === String(tool.assignedTo)) : null;
    const fromLocation = tool.location || "Store";
    const fromPerson = prevOwner ? prevOwner.name : "Store";
    const toLocation = chantier || "Store";
    const toPerson = newViewer ? newViewer.name : null;
    const today = new Date().toLocaleDateString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    // Traçabilité inter-profils — qui fait l'action et pour qui
    const actionBy = currentUser.name; // le vrai utilisateur connecté
    const supervisedName = supervisedUser?.fakeUser?.name || null; // profil supervisé si supervision
    const byLabel = supervisedName && supervisedName !== actionBy
      ? `${actionBy} (pour ${supervisedName})`
      : actionBy;

    let action = "";
    if (!newViewer && !chantier) {
      // Retour au store
      action = `🏠 ${prevOwner ? prevOwner.name + " — " + fromLocation : fromLocation} → Store`;
    } else if (fromLocation === "Store" || fromPerson === "Store") {
      // Sortie du store vers un employé/chantier
      action = `📤 Store → ${toPerson} — ${toLocation}`;
    } else {
      // Transfert entre employés/chantiers
      action = `🔄 ${fromPerson} — ${fromLocation} → ${toPerson} — ${toLocation}`;
    }

    const updatedTool = {
      ...tool,
      status: (newViewer || chantier) && toLocation !== "Store" ? "assigned" : "store",
      assignedTo: newViewer ? String(viewerId) : null, location: toLocation,
      history: [...tool.history, { date: today, action, by: byLabel }],
      lastReminder: newViewer ? new Date().toISOString() : null,
    };
    await setDoc(doc(db, "tools", String(toolId)), updatedTool);
    showToast(direction === "out" ? `✅ Confié à ${toPerson} — ${toLocation}` : newViewer ? `🔄 Transféré à ${toPerson} — ${toLocation}` : `🏠 Outil retourné au store`);
    // FIX #B2 — le modal reste ouvert, mis à jour en temps réel via FIX #7
  };

  const addTool = async (form) => {
    const id = String(Date.now());
    // FIX #9 — nettoyage robuste du prix
    const rawPrice = String(form.price || "").replace(/[\s.,]/g, "").replace(/[^0-9]/g, "");
    const parsedPrice = rawPrice ? Number(rawPrice) : null;
    // S'assurer qu'on a bien le companyId
    const toolCompanyId = myCompanyId || effectiveUser?.companyId || currentUser?.companyId || null;
    const newTool = {
      id, name: form.name, ref: form.ref || "",
      purchaseDate: form.purchaseDate || "",
      price: (parsedPrice !== null && !isNaN(parsedPrice)) ? parsedPrice : null,
      obsolete: false, obsoleteDate: null, description: form.description || "",
      photo: form.photo || "🔧", photoUrl: form.photoUrl || null,
      status: "store", assignedTo: null, location: "Store",
      companyId: toolCompanyId,
      history: [{ date: new Date().toLocaleDateString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric" }), action: "📦 Ajouté au store", by: currentUser.name }],
      lastReminder: null, totalRepairCost: 0,
    };
    await setDoc(doc(db, "tools", id), newTool);
    showToast("✅ Outil ajouté au store !");
    setModal(null);
  };

  const addUser = async (form) => {
    const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    if (form.role === "viewer") {
      const id = String(Date.now());
      const newUser = { id, name: form.name, role: form.role, avatar: initials, phone: form.phone || "", email: form.email || "", pin: form.pin, companyId: myCompanyId || null, authUid: null };
      await setDoc(doc(db, "users", id), newUser);
      showToast("✅ Profil employé créé");
      return newUser;
    }
    // Vérification hiérarchique — on ne peut pas créer un rôle >= au sien
    const hierarchy = { superadmin: 4, director: 3, admin: 2, viewer: 1 };
    const currentRole = effectiveUser?.role || currentUser?.role;
    if ((hierarchy[form.role] || 0) >= (hierarchy[currentRole] || 0)) {
      showToast("❌ Vous ne pouvez pas créer un rôle égal ou supérieur au vôtre");
      return null;
    }
    // Admin → PIN uniquement, pas besoin de Firebase Auth (géré par le Directeur)
    const id = String(Date.now());
    const newUser = { id, name: form.name, role: form.role, avatar: initials, phone: form.phone || "", email: form.email || "", pin: form.pin, companyId: myCompanyId || null, authUid: null };
    try {
      await setDoc(doc(db, "users", id), newUser);
      showToast("✅ Profil créé");
      return newUser;
    } catch(e) {
      showToast("❌ Erreur : " + e.message);
      return null;
    }
  };

  const addChantier = async (name, color) => {
    if (!name.trim()) return;
    const id = String(Date.now());
    await setDoc(doc(db, "chantiers", id), { id, name: name.trim(), color, companyId: myCompanyId || null });
    showToast(tx.lang === "en" ? "✅ Job site added" : "✅ Chantier ajouté");
  };

  const deleteChantier = async (id) => {
    // Bloquer la suppression du chantier Transit
    const chantier = chantiers.find(c => String(c.id) === String(id));
    if (chantier?.isTransit || chantier?.name === "Transit") {
      showToast("❌ Le chantier Transit ne peut pas être supprimé");
      return;
    }
    const c = chantiers.find(c => c.id === id);
    const toolsOnSite = tools.filter(tool => tool.location === c?.name && tool.status === "assigned");
    if (toolsOnSite.length > 0) {
      window.alert(`⚠️ Impossible de supprimer "${c?.name}"\n\n${toolsOnSite.length} outil(s) encore sur ce chantier:\n${toolsOnSite.map(t => `• ${t.name}`).join("\n")}\n\nRetournez-les au store d'abord.`);
      return;
    }
    if (!window.confirm(`${tx.deleteConfirm || "Supprimer"} "${c?.name}" ?`)) return;
    await deleteDoc(doc(db, "chantiers", String(id)));
    showToast(tx.lang === "en" ? "🗑 Job site deleted" : "🗑 Chantier supprimé");
  };

  const sendRequest = async ({ type, toolId, toolName, toolLocation, targetViewerId, targetViewerName, targetChantier, note }) => {
    const id = String(Date.now());
    const today = new Date().toLocaleString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    if (type === "nonfunctional") {
      const tool = tools.find(tool => String(tool.id) === String(toolId));
      if (tool) {
        const firstEntry = { id: Date.now(), type: "thread", status: "suivi-cours", note: note || "Signalé non fonctionnel.", by: effectiveUser.name, datetime: today, timestamp: Date.now() };
        await setDoc(doc(db, "tools", String(toolId)), { ...tool, status: "nonfunctional", obsolete: false, obsoleteDate: new Date().toISOString().slice(0,10), obsoleteType: "suivi-cours", obsoleteThread: [firstEntry], history: [...tool.history, { date: new Date().toLocaleDateString("fr-MU"), action: `🔴 Signalé non fonctionnel par ${currentUser.name}${note ? ` — "${note}"` : ""}`, by: currentUser.name }] });
      }
      await setDoc(doc(db, "messages", id), { id, from: currentUser.id, to: null, type: "push", text: `⚠️ ${currentUser.name} a signalé "${toolName}" NON FONCTIONNEL.${note ? ` — "${note}"` : ""}`, toolId: String(toolId), date: new Date().toISOString(), read: false });
      showToast("⚠️ Signalement envoyé aux admins"); return;
    }
    // Détecter si la demande est faite en supervision (admin au nom d'un employé)
    const isOnBehalf = isSupervising && supervisedUser?.fakeUser;
    const requesterName = isOnBehalf ? currentUser.name : effectiveUser.name; // qui fait la demande
    const onBehalfOf = isOnBehalf ? effectiveUser.name : null; // pour qui (si supervision)

    // Trouver l'outil pour avoir le nom du responsable actuel
    const toolObj = tools.find(t => String(t.id) === String(toolId));
    const currentOwner = toolObj?.assignedTo ? users.find(u => String(u.id) === String(toolObj.assignedTo)) : null;
    const currentOwnerName = currentOwner?.name || null;

    let reqText = "";
    if (type === "transfer") {
      if (isOnBehalf) {
        reqText = `🔄 ${requesterName} demande (au nom de ${onBehalfOf}) de transférer "${toolName}"${currentOwnerName ? ` — actuellement sous la responsabilité de ${currentOwnerName}` : ` (${toolLocation})`} → ${targetViewerName} — ${targetChantier}${note ? ` — "${note}"` : ""}`;
      } else {
        reqText = `🔄 ${requesterName} demande le transfert de "${toolName}"${currentOwnerName && currentOwnerName !== requesterName ? ` — actuellement sous la responsabilité de ${currentOwnerName}` : ` (${toolLocation})`} → ${targetViewerName} — ${targetChantier}${note ? ` — "${note}"` : ""}`;
      }
    } else {
      if (isOnBehalf) {
        reqText = `🏠 ${requesterName} demande (au nom de ${onBehalfOf}) le retour au store de "${toolName}"${currentOwnerName ? ` — actuellement sous la responsabilité de ${currentOwnerName}` : ` (${toolLocation})`}${note ? ` — "${note}"` : ""}`;
      } else {
        reqText = `🏠 ${requesterName} demande le retour au store de "${toolName}" (${toolLocation})${note ? ` — "${note}"` : ""}`;
      }
    }

    // Ajouter une entrée dans l'historique de l'outil
    const histEntry = {
      date: new Date().toLocaleDateString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      by: isOnBehalf ? `${requesterName} (pour ${onBehalfOf})` : requesterName,
      action: type === "transfer"
        ? `📋 Demande : ${currentOwnerName || effectiveUser.name} — ${toolLocation} → ${targetViewerName} — ${targetChantier}${note ? ` · "${note}"` : ""}${isOnBehalf ? ` [par ${requesterName}]` : ""}`
        : `📋 Demande retour store : ${currentOwnerName || effectiveUser.name} — ${toolLocation} → Store${note ? ` · "${note}"` : ""}${isOnBehalf ? ` [par ${requesterName}]` : ""}`
    };
    if (toolObj) {
      await setDoc(doc(db, "tools", String(toolId)), {
        ...toolObj,
        history: [...(toolObj.history || []), histEntry]
      });
    }
    await setDoc(doc(db, "requests", id), { id, type, status: "pending", from: effectiveUser.id, fromName: effectiveUser.name, requestedBy: requesterName, onBehalfOf, toolId: String(toolId), toolName, toolLocation, currentOwnerName, targetViewerId: targetViewerId ? String(targetViewerId) : null, targetViewerName: targetViewerName || null, targetChantier: targetChantier || null, note: note || "", text: reqText, date: new Date().toISOString(), companyId: myCompanyId || null });
    showToast("📨 Demande envoyée aux admins !");
  };

  // FIX #6 — filtrage outils : employé ET chantier sont mutuellement exclusifs
  const displayedTools = filteredTools.filter(tool => {
    if (!isAdmin) return String(tool.assignedTo) === String(effectiveUser.id) || tool.status === "store";
    // Tous les filtres s'appliquent ensemble (AND)
    const matchStatus = filterStatus === "all" || tool.status === filterStatus;
    const matchSearch = !search || tool.name.toLowerCase().includes(search.toLowerCase()) || (tool.ref || "").toLowerCase().includes(search.toLowerCase());
    const matchUser = filterUser === "all" || String(tool.assignedTo) === filterUser || (filterUser === "none" && !tool.assignedTo);
    const matchChantier = filterChantier === "all" || tool.location === filterChantier;
    return matchStatus && matchSearch && matchUser && matchChantier;
  });

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const navItems = [
    isAdmin && { key: "dashboard", icon: "📊", label: tx.dashboard },
    isSuperAdmin && { key: "companies", icon: "🏢", label: tx.companies },
    isAdmin && !isSuperAdmin && { key: "tools", icon: "🔧", label: tx.tools },
    isAdmin && !isSuperAdmin && { key: "chantiers", icon: "🏗", label: tx.chantiers },
    !isAdmin && { key: "mytools", icon: "📦", label: tx.mytools },
    !isAdmin && { key: "parc", icon: "🔧", label: tx.parc },
    { key: "requests", icon: "🔔", label: tx.requests, badge: pendingRequests },
    { key: "messages", icon: "💬", label: tx.messages, badge: unreadMessages },
    isAdmin && !isSuperAdmin && { key: "users", icon: "👷", label: tx.team },
  ].filter(Boolean);

  return (
    <><style>{css}</style>
    <div className="app" style={{ paddingTop: isSupervising ? 40 : 0 }}>
      {showExpiryWarning && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "rgba(245,166,35,.95)", color: "#000", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span>Votre accès expire dans <strong>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</strong>. Envoyez votre preuve de paiement à <strong>{myCompany.contactEmail || "votre administrateur"}</strong>.</span>
        </div>
      )}

      {/* BANDEAU SUPERVISION */}
      {isSupervising && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, height: 40, background: "#f5a623", color: "#000", padding: "0 20px", display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 700 }}>
          <span style={{ fontSize: 18 }}>👁</span>
          <span style={{ flex: 1 }}>{tx.supervisionMode} <strong>{supervisedUser.fakeUser.name}</strong> ({supervisedUser.fakeUser.role})</span>
          <button onClick={stopSupervision} style={{ background: "#000", color: "#f5a623", border: "none", borderRadius: 8, padding: "4px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{tx.quitSupervision}</button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar" style={{ marginTop: isSupervising ? 36 : 0, paddingTop: isSupervising ? 0 : undefined }}>
        <div className="sidebar-logo"><h1>TOOL<br/>TRACK</h1><p>{tx.toolManagement}</p></div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.key} className={`nav-item ${page === item.key ? "active" : ""}`} onClick={() => setPage(item.key)}>
              <span className="icon">{item.icon}</span><span>{item.label}</span>
              {item.badge > 0 && <span className="badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-pill">
            <div className="avatar">{effectiveUser.avatar}</div>
            <div className="user-info"><div className="name">{effectiveUser.name.split(" ")[0]}</div><div className="role">{isSupervising ? "👁 supervision" : effectiveUser.role}</div></div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8, justifyContent: "center" }} onClick={isSupervising ? stopSupervision : logoutUser}>{isSupervising ? "✕ Quitter supervision" : `⇄ ${tx.disconnect}`}</button>

          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => setLanguage("fr")} style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: `2px solid ${lang === "fr" ? "var(--accent)" : "var(--border)"}`, background: lang === "fr" ? "rgba(245,166,35,.15)" : "transparent", color: lang === "fr" ? "var(--accent)" : "var(--muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🇫🇷 FR</button>
            <button onClick={() => setLanguage("en")} style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: `2px solid ${lang === "en" ? "var(--accent)" : "var(--border)"}`, background: lang === "en" ? "rgba(245,166,35,.15)" : "transparent", color: lang === "en" ? "var(--accent)" : "var(--muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🇬🇧 EN</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main" style={{ marginTop: isSupervising ? 36 : 0 }}>
        {page === "companies" && isSuperAdmin && <CompaniesPage companies={companies} users={users} tools={tools} chantiers={chantiers} requests={requests} db={db} currentUser={currentUser} showToast={showToast} onAdminCreated={(admin) => setModal({ type: "whatsappInvite", data: admin })} onSupervise={startSupervision} tx={tx} />}
        {page === "dashboard" && isAdmin && <DashboardPage isSuperAdmin={isSuperAdmin} companies={companies} tools={tools} users={users} chantiers={chantiers} requests={requests} filteredTools={filteredTools} filteredUsers={filteredUsers} filteredRequests={filteredRequests} openTool={openTool} onReset={resetAllData} tx={tx} />}
        {page === "tools" && isAdmin && <ToolsPage displayedTools={displayedTools} filteredTools={filteredTools} filteredChantiers={filteredChantiers} viewers={viewers} users={users} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterUser={filterUser} setFilterUser={setFilterUser} filterChantier={filterChantier} setFilterChantier={setFilterChantier} search={search} setSearch={setSearch} selectedTools={selectedTools} setSelectedTools={setSelectedTools} showMovePanel={showMovePanel} setShowMovePanel={setShowMovePanel} openTool={openTool} setModal={setModal} assignTool={assignTool} showToast={showToast} currentUser={effectiveUser} db={db} sendRequest={sendRequest} tx={tx} />}
        {page === "mytools" && !isAdmin && <MyToolsPage myTools={myTools} currentUser={currentUser} users={users} viewers={viewers} chantiers={chantiers} db={db} openTool={openTool} sendRequest={sendRequest} tx={tx} />}
        {page === "parc" && !isAdmin && <ParcPage filteredTools={filteredTools} myTools={myTools} users={users} currentUser={currentUser} db={db} sendRequest={sendRequest} tx={tx} />}
        {page === "chantiers" && isAdmin && <ChantierPage chantiers={filteredChantiers} tools={filteredTools} users={filteredUsers} addChantier={addChantier} deleteChantier={deleteChantier} tx={tx} />}
        {page === "requests" && <RequestsPage isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} filteredRequests={filteredRequests} requests={requests} tools={tools} users={users} companies={companies} currentUser={currentUser} db={db} showToast={showToast} tx={tx} />}
        {/* FIX #10 — page messages rendue */}
        {page === "messages" && <MessagesPage currentUser={effectiveUser} users={users} tools={tools} myTools={myTools} db={db} showToast={showToast} tx={tx} />}
        {page === "users" && isAdmin && <UsersPage isSuperAdmin={isSuperAdmin} filteredUsers={filteredUsers} filteredTools={filteredTools} tools={tools} users={users} companies={companies} currentUser={effectiveUser} realUser={currentUser} db={db} showToast={showToast} setModal={setModal} onSupervise={startSupervision} tx={tx} deleteDirectorSelf={deleteDirectorSelf} isSupervising={isSupervising} />}
      </main>
    </div>

    {/* BOTTOM NAV (mobile) — FIX #10 Messages inclus */}
    <nav className="bottom-nav">
      <button className="bottom-nav-item" onClick={isSupervising ? stopSupervision : logoutUser}>
        <span className="bn-icon">{isSupervising ? "✕" : "⇄"}</span>{isSupervising ? "Quitter" : "Profil"}
      </button>
      {navItems.map(item => (
        <button key={item.key} className={`bottom-nav-item ${page === item.key ? "active" : ""}`} onClick={() => setPage(item.key)}>
          <span className="bn-icon">{item.icon}</span>{item.label}
          {item.badge > 0 && <span className="badge">{item.badge}</span>}
        </button>
      ))}
      <button className="bottom-nav-item" onClick={() => setLanguage(lang === "fr" ? "en" : "fr")}>
        <span className="bn-icon">{lang === "fr" ? "🇬🇧" : "🇫🇷"}</span>{lang === "fr" ? "EN" : "FR"}
      </button>

    </nav>

    {modal && <ModalRouter modal={modal} setModal={setModal} users={users} tools={tools} setTools={setTools} viewers={viewers} chantiers={chantiers} currentUser={currentUser} effectiveUser={effectiveUser} addTool={addTool} addUser={addUser} assignTool={assignTool} deleteTool={deleteTool} updateTool={updateTool} myCompany={myCompany} />}
    {toast && <div className={`toast ${toast.type === "warn" ? "warn" : ""}`}><div className="toast-text">{toast.text}</div></div>}
    </>
  );
}

// ─── PAGES EXTRAITES ─────────────────────────────────────────────────────────

function DashboardPage({ isSuperAdmin, companies, tools, users, chantiers, requests, filteredTools, filteredUsers, filteredRequests, openTool, onReset, tx }) {
  return (
    <>
      <div className="topbar">
        <h2>📊 {tx.dashboard}</h2>
        {isSuperAdmin && onReset && (
          <button onClick={onReset} style={{ background: "rgba(232,40,40,.15)", color: "var(--red)", border: "2px solid rgba(232,40,40,.5)", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            {tx.resetTest}
          </button>
        )}
      </div>
      <div className="content">
        {isSuperAdmin ? (
          <>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--accent)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{tx.globalView}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { label: "🏢 " + tx.companies, value: companies.length, color: "var(--accent)" },
                { label: "👷 " + tx.totalTeam, value: users.filter(u => u.role !== "superadmin").length, color: "var(--green)" },
                { label: "🏗 " + tx.chantiers, value: chantiers.length, color: "var(--blue)" },
                { label: "⏳ " + tx.pendingReq, value: requests.filter(r => r.status === "pending").length, color: "var(--accent)" },
                { label: "⏸️ " + tx.suspended, value: companies.filter(c => c.active === false).length, color: "var(--red)" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--surface)", border: `1px solid ${s.color === "var(--red)" && s.value > 0 ? "rgba(232,82,10,.5)" : "var(--border)"}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Liste des compagnies suspendues */}
            {companies.filter(c => c.active === false).length > 0 && (
              <div style={{ background: "rgba(232,82,10,.08)", border: "2px solid rgba(232,82,10,.4)", borderRadius: 12, padding: "14px 16px", marginBottom: 24, marginTop: -14 }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 800, color: "var(--red)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                  ⚠️ {companies.filter(c => c.active === false).length} {tx.suspended2} — {tx.actionRequired || "Action requise"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {companies.filter(c => c.active === false).map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(232,82,10,.1)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{c.name}{(c.isTransit || c.name === "Transit") && <span style={{ fontSize: 9, background: "rgba(245,166,35,.2)", color: "var(--accent)", borderRadius: 4, padding: "1px 5px", marginLeft: 6, fontWeight: 700 }}>SYSTÈME</span>}</div>
                        {c.suspendedReason && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{c.suspendedReason}</div>}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--red)", fontWeight: 700 }}>⏸️ {tx.suspended2}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800 }}>🔧 {tx.tools} — {tools.length}</div>
                <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>🇲🇺 Rs {tools.reduce((s, t) => s + (t.price || 0), 0).toLocaleString("fr-MU")}</div>
              </div>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 12, marginBottom: 10 }}>
                {[{ status: "store", color: "var(--green)" }, { status: "assigned", color: "var(--blue)" }, { status: "nonfunctional", color: "#f07030" }, { status: "obsolete", color: "#666" }].map(s => {
                  const count = tools.filter(t => t.status === s.status).length;
                  const pct = tools.length > 0 ? (count / tools.length) * 100 : 0;
                  return pct > 0 ? <div key={s.status} style={{ width: `${pct}%`, background: s.color }} /> : null;
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  { label: "🟢 " + tx.store, value: tools.filter(t => t.status === "store").length, color: "var(--green)" },
                  { label: "🔵 " + tx.chantiers, value: tools.filter(t => t.status === "assigned").length, color: "var(--blue)" },
                  { label: "🔴 " + tx.nonfunctional, value: tools.filter(t => t.status === "nonfunctional").length, color: "#f07030" },
                  { label: "⚫ " + tx.obsolete2, value: tools.filter(t => t.status === "obsolete").length, color: "#666" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--accent)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{tx.byCompany}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {companies.map(company => {
                const cTools = tools.filter(t => t.companyId === company.id);
                const cUsers = users.filter(u => u.companyId === company.id);
                const cChantiers = chantiers.filter(c => c.companyId === company.id);
                const cRequests = requests.filter(r => r.companyId === company.id && r.status === "pending");
                const isActive = company.active !== false;
                const dLeft = company.expiryDate ? Math.ceil((new Date(company.expiryDate) - new Date()) / (1000*60*60*24)) : null;
                return (
                  <div key={company.id} style={{ background: "var(--surface)", border: `1px solid ${isActive ? "var(--border)" : "rgba(232,82,10,.3)"}`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ height: 4, background: company.color || "var(--accent)" }} />
                    <div style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: company.color || "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
                          <div>
                            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800 }}>{company.name}</div>
                            <div style={{ fontSize: isActive ? 10 : 13, color: isActive ? "var(--green)" : "var(--red)", fontWeight: 800, background: isActive ? "transparent" : "rgba(232,82,10,.15)", padding: isActive ? 0 : "3px 8px", borderRadius: 6 }}>
                              {isActive ? `🟢 ${tx.active2}` : `⏸️ ${tx.suspended2}`}
                              {dLeft !== null && isActive && dLeft <= 10 && <span style={{ color: dLeft <= 3 ? "var(--red)" : "var(--accent)", marginLeft: 8 }}>⚠️ {dLeft}j</span>}
                            </div>
                          </div>
                        </div>
                        {cRequests.length > 0 && <span style={{ background: "rgba(245,166,35,.2)", color: "var(--accent)", fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>🔔 {cRequests.length}</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {[
                          { label: "👷 " + tx.team, value: cUsers.length, color: "var(--blue)" },
                          { label: "🔧 " + tx.tools, value: cTools.length, color: "var(--accent)" },
                          { label: "🏗 " + tx.chantiers, value: cChantiers.length, color: "var(--green)" },
                          { label: "🟢 " + tx.store, value: cTools.filter(t => t.status === "store").length, color: "var(--green)" },
                          { label: "🔵 " + tx.onSite2, value: cTools.filter(t => t.status === "assigned").length, color: "var(--blue)" },
                          { label: "🔴 " + tx.nonfunctional, value: cTools.filter(t => t.status === "nonfunctional").length, color: "#f07030" },
                          { label: "👑 Admins", value: cUsers.filter(u => u.role === "admin").length, color: "var(--accent)" },
                          { label: "👷 " + tx.employee, value: cUsers.filter(u => u.role === "viewer").length, color: "var(--muted)" },
                        ].map(s => (
                          <div key={s.label} style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                            <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {cTools.length > 0 && (
                        <div style={{ marginTop: 10, background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>Valeur totale du parc</div>
                          <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>🇲🇺 Rs {cTools.reduce((sum, t) => sum + (t.price || 0), 0).toLocaleString("fr-MU")}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="stats-grid">
              {[
                { num: filteredTools.length, label: tx.totalTools, cls: "stat-accent" },
                { num: filteredTools.filter(t => t.status === "store").length, label: "🟢 " + tx.inStore2, cls: "stat-green" },
                { num: filteredTools.filter(t => t.status === "assigned").length, label: "🔵 " + tx.chantiers, cls: "stat-blue" },
                { num: filteredTools.filter(t => t.status === "nonfunctional").length, label: "🔴 " + tx.nonFunctional2, style: { color: "#f07030" } },
                { num: filteredTools.filter(t => t.status === "obsolete").length, label: "⚫ " + tx.obsolete2, style: { color: "#aaa" } },
                { num: filteredRequests.filter(r => r.status === "pending").length, label: "⏳ " + tx.requests, cls: "stat-red" },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className={`stat-num ${s.cls || ""}`} style={s.style || {}}>{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{tx.toolsOnSiteLabel}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredTools.filter(t => t.status === "assigned").map(tool => {
                const assignee = filteredUsers.find(u => String(u.id) === String(tool.assignedTo));
                return (
                  <div key={tool.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{tool.photo}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{tool.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>📍 {tool.location} — 👷 {assignee?.name || "—"}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => openTool(tool)}>{tx.details}</button>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ToolsPage({ displayedTools, filteredTools, filteredChantiers, viewers, users, filterStatus, setFilterStatus, filterUser, setFilterUser, filterChantier, setFilterChantier, search, setSearch, selectedTools, setSelectedTools, showMovePanel, setShowMovePanel, openTool, setModal, assignTool, showToast, currentUser, db, sendRequest, tx }) {
  tx = tx || getTx();
  return (
    <>
      <div className="topbar">
        <h2>{tx.tools}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedTools.length > 0 && <button className="btn btn-blue btn-sm" onClick={() => setShowMovePanel(true)}>↗ {tx.transfer} ({selectedTools.length})</button>}
          <button className="btn btn-primary" onClick={() => setModal({ type: "addTool" })}>+ {tx.add}</button>
        </div>
      </div>
      <div className="content">
        <div className="filters">
          <div className="search-bar"><span className="search-icon">🔍</span><input placeholder={tx.search} value={search} onChange={e => setSearch(e.target.value)} /></div>
          {[{ val: "all", label: tx.all }, { val: "store", label: "🟢 " + tx.store }, { val: "assigned", label: "🔵 " + tx.onSite2 }, { val: "nonfunctional", label: "🔴 " + tx.nonfunctional }, { val: "obsolete", label: "⚫ " + tx.obsolete2 }].map(s => (
            <button key={s.val} className={`filter-btn ${filterStatus === s.val ? "active" : ""}`} onClick={() => { setFilterStatus(s.val); setFilterUser("all"); setFilterChantier("all"); }}>{s.label}</button>
          ))}
          {/* FIX #6 — reset indépendant */}
          <select className="form-input" style={{ width: "auto", fontSize: 12 }} value={filterUser} onChange={e => { setFilterUser(e.target.value); setFilterChantier("all"); setFilterStatus("all"); }}>
            <option value="all">{tx.allEmployees}</option>
            <option value="none">Non assigné</option>
            {viewers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role === "viewer" ? "Employé" : u.role === "admin" ? "Admin" : "Directeur"})</option>)}
          </select>
          <select className="form-input" style={{ width: "auto", fontSize: 12 }} value={filterChantier} onChange={e => { setFilterChantier(e.target.value); setFilterUser("all"); setFilterStatus("all"); }}>
            <option value="all">{tx.allSites}</option>
            <option value="Store">Store</option>
            {filteredChantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {displayedTools.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 12px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <input type="checkbox" checked={selectedTools.length === displayedTools.length && displayedTools.length > 0} onChange={e => setSelectedTools(e.target.checked ? displayedTools.map(t => t.id) : [])} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }} />
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{selectedTools.length === 0 ? tx.selectAll : `${selectedTools.length} {tx.selected2}${selectedTools.length > 1 ? "s" : ""}`}</span>
            {selectedTools.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTools([])}>{tx.deselect}</button>}
          </div>
        )}
        <div className="cards-grid">
          {displayedTools.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{tx.noTool}</div>
              <div style={{ fontSize: 13 }}>Cliquez sur "+ Ajouter un outil" pour commencer</div>
            </div>
          )}
          {displayedTools.map(tool => {
            const assignee = users.find(u => String(u.id) === String(tool.assignedTo));
            const isSelected = selectedTools.includes(tool.id);
            return (
              <div key={tool.id} style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }} onClick={e => { e.stopPropagation(); setSelectedTools(prev => isSelected ? prev.filter(id => id !== tool.id) : [...prev, tool.id]); }}>
                  <input type="checkbox" checked={isSelected} readOnly style={{ width: 20, height: 20, cursor: "pointer", accentColor: "var(--accent)" }} />
                </div>
                <div className={`tool-card${tool.status === "nonfunctional" ? " nonfunctional" : tool.status === "obsolete" ? " obsolete" : ""}`}
                  onClick={() => openTool(tool)} style={{ cursor: "pointer", border: isSelected ? "2px solid var(--accent)" : undefined }}>
                  {tool.photoUrl ? <img src={tool.photoUrl} alt={tool.name} className="tool-photo-card" /> : <div className="tool-photo-placeholder"><span className="big-emoji">{tool.photo}</span><span style={{ fontSize: 11 }}>Aucune photo</span></div>}
                  <div className="tool-card-top"><div className="tool-meta" style={{ width: "100%" }}><div className="tool-name">{tool.name}</div>{tool.ref && <div className="tool-ref">🏭 {tool.ref}</div>}</div></div>
                  <div className="tool-card-body"><div className="tool-desc">{tool.description}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>📍 {tool.location}</div></div>
                  <div className="tool-card-footer">
                    {{ store: <span className="status-badge status-store">{tx.store}</span>, assigned: <span className="status-badge status-assigned">🔵 {tx.assigned}</span>, nonfunctional: <span className="status-badge status-nonfunctional">🔴 Non fonctionnel</span>, obsolete: <span className="status-badge">⚫ Obsolète</span> }[tool.status]}
                    {tool.price && <span className="price-tag">🇲🇺 Rs {tool.price.toLocaleString("fr-MU")}</span>}
                    {assignee && <span className="assignee-chip"><div style={{ width: 20, height: 20, fontSize: 9, borderRadius: 5, background: "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{assignee.avatar}</div>{assignee.name.split(" ")[0]}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {showMovePanel && <MovePanelModal selectedIds={selectedTools} tools={filteredTools} viewers={viewers} users={filteredUsers} chantiers={filteredChantiers} currentUser={currentUser} db={db} onClose={() => { setShowMovePanel(false); setSelectedTools([]); }} assignTool={assignTool} showToast={showToast} sendRequest={sendRequest} isAdminUser={true} />}
    </>
  );
}

function MyToolsPage({ myTools, currentUser, users, viewers, chantiers, db, openTool, sendRequest, tx }) {
  const hasOldTools = myTools.some(tool => { const d = daysSince(tool.lastReminder); return d !== null && d >= 3; });
  const [selected, setSelected] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNote, setGroupNote] = useState("");
  const [groupSent, setGroupSent] = useState(false);
  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = myTools.length > 0 && selected.length === myTools.length;

  const handleGroupRequest = async () => {
    const selectedTools = myTools.filter(t => selected.includes(t.id));
    for (const tool of selectedTools) {
      await sendRequest({
        type: "return", // seulement retour store
        toolId: tool.id,
        toolName: tool.name,
        toolLocation: tool.location,
        targetViewerId: null,
        targetViewerName: null,
        targetChantier: null,
        note: groupNote,
      });
    }
    setGroupSent(true);
    setTimeout(() => { setShowGroupModal(false); setSelected([]); setGroupSent(false); setGroupNote(""); }, 1500);
  };

  return (
    <>
      <div className="topbar">
        <h2>📦 {tx.mytools}</h2>
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{myTools.length === 0 ? tx.noToolAssigned : `${myTools.length} outil${myTools.length > 1 ? "s" : ""}`}</span>
      </div>
      <div className="content">
        {hasOldTools && (
          <div className="reminder-banner">
            <span style={{ fontSize: 22 }}>⏰</span>
            <p>{tx.reminderBanner}</p>
          </div>
        )}
        {myTools.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{tx.noToolAssigned}</div>
            <div style={{ fontSize: 13 }}>{tx.toolAssignedSoon}</div>
          </div>
        ) : (
          <>
            {/* Barre de sélection */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <input type="checkbox" checked={allSelected} onChange={e => setSelected(e.target.checked ? myTools.map(t => t.id) : [])} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }} />
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, flex: 1 }}>
                {selected.length === 0 ? "Tout sélectionner" : `${selected.length} outil${selected.length > 1 ? "s" : ""} {tx.selected2}${selected.length > 1 ? "s" : ""}`}
              </span>
              {selected.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowGroupModal(true)}>
                  📋 Demande groupée ({selected.length})
                </button>
              )}
              {selected.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>✕</button>
              )}
            </div>

            {/* Liste des outils avec checkbox */}
            <div className="cards-grid">
              {myTools.map(tool => (
                <div key={tool.id} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}
                    onClick={e => { e.stopPropagation(); toggleSelect(tool.id); }}>
                    <input type="checkbox" checked={selected.includes(tool.id)} readOnly
                      style={{ width: 20, height: 20, cursor: "pointer", accentColor: "var(--accent)" }} />
                  </div>
                  <div style={{ border: selected.includes(tool.id) ? "2px solid var(--accent)" : undefined, borderRadius: 12 }}>
                    <ViewerToolCard tool={tool} currentUser={currentUser} users={users} viewers={viewers} chantiers={chantiers} db={db} onOpen={() => openTool(tool)} onRequest={sendRequest} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal demande groupée */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowGroupModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>📋 Demande groupée</h3>
              <button className="close-btn" onClick={() => setShowGroupModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {groupSent ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800, color: "var(--green)" }}>{tx.requestsSent}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{tx.adminWillProcess}</div>
                </div>
              ) : (
                <>
                  {/* Outils {tx.selected2}s */}
                  <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>{tx.toolsConcerned} ({selected.length})</div>
                    {myTools.filter(t => selected.includes(t.id)).map(t => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{t.photo}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>📍 {t.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Type de demande */}
                  <div className="form-group">
                    <label className="form-label">{tx.requestType}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className={`btn ${groupType === "return" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setGroupType("return")}>{`🏠 ${tx.returnStore2}`}</button>
                      <button className={`btn ${groupType === "transfer" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setGroupType("transfer")}>{`🔄 ${tx.transfer}`}</button>
                    </div>
                  </div>

                  {/* Champs transfert */}
                  {groupType === "transfer" && (
                    <>
                      <div className="form-group">
                        <label className="form-label">{tx.transferTo2}</label>
                        <select className="form-input" value={groupTargetViewer} onChange={e => setGroupTargetViewer(e.target.value)}>
                          <option value="">{tx.chooseEmployee}</option>
                          {viewers.filter(v => v.id !== currentUser.id).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{tx.siteLabel}</label>
                        <select className="form-input" value={groupChantier} onChange={e => setGroupChantier(e.target.value)}>
                          <option value="">{tx.chooseSite}</option>
                          {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Note */}
                  <div className="form-group">
                    <label className="form-label">{tx.noteOptional}</label>
                    <textarea className="form-input" rows={2} placeholder={tx.reasonNote} value={groupNote} onChange={e => setGroupNote(e.target.value)} />
                  </div>
                </>
              )}
            </div>
            {!groupSent && (
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowGroupModal(false)}>{tx.cancel}</button>
                <button className="btn btn-primary"
                  disabled={groupType === "transfer" && (!groupTargetViewer || !groupChantier)}
                  onClick={handleGroupRequest}>
                  📨 Envoyer {selected.length} demande{selected.length > 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ParcPage({ filteredTools, myTools, users, currentUser, db, sendRequest, tx }) {
  return (
    <>
      <div className="topbar"><h2>🔧 {tx.parc}</h2></div>
      <div className="content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "🟢 " + tx.inStore2, count: filteredTools.filter(t => t.status === "store").length, color: "var(--green)" },
            { label: "🔵 " + tx.onSite2, count: filteredTools.filter(t => t.status === "assigned").length, color: "var(--blue)" },
            { label: "🔴 " + tx.nonfunctional, count: filteredTools.filter(t => t.status === "nonfunctional").length, color: "#f07030" },
            { label: "📦 Mes outils", count: myTools.length, color: "var(--accent)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {filteredTools.filter(t => t.status === "store").length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--green)", marginBottom: 10 }}>🟢 Disponibles au store</div>
            {filteredTools.filter(t => t.status === "store").map(tool => (
              <div key={tool.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                {tool.photoUrl ? <img src={tool.photoUrl} alt={tool.name} style={{ width: 60, height: 60, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "var(--surface2)", flexShrink: 0 }}>{tool.photo}</div>}
                <div style={{ flex: 1, padding: "8px 0" }}><div style={{ fontWeight: 700, fontSize: 14 }}>{tool.name}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📍 Store{tool.price ? ` · Rs ${tool.price.toLocaleString("fr-MU")}` : ""}</div></div>
                <span style={{ fontSize: 11, background: "rgba(39,201,122,.15)", color: "var(--green)", padding: "3px 8px", borderRadius: 20, fontWeight: 700, marginRight: 12 }}>Dispo</span>
              </div>
            ))}
          </div>
        )}
        {filteredTools.filter(t => t.status === "assigned").length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--blue)", marginBottom: 10 }}>{`🔵 ${tx.onSite2}`}</div>
            {filteredTools.filter(t => t.status === "assigned").map(tool => {
              const assignee = users.find(u => String(u.id) === String(tool.assignedTo));
              const isMyTool = String(tool.assignedTo) === String(currentUser.id);
              return <ParcToolRow key={tool.id} tool={tool} assignee={assignee} isMyTool={isMyTool} currentUser={currentUser} db={db} onAsk={sendRequest} />;
            })}
          </div>
        )}
        {filteredTools.filter(t => t.status === "nonfunctional").length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "#f07030", marginBottom: 10 }}>🔴 Non fonctionnels</div>
            {filteredTools.filter(t => t.status === "nonfunctional").map(tool => (
              <div key={tool.id} style={{ background: "var(--surface)", border: "1px solid rgba(232,82,10,.3)", borderRadius: 10, overflow: "hidden", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, opacity: 0.75 }}>
                {tool.photoUrl ? <img src={tool.photoUrl} alt={tool.name} style={{ width: 60, height: 60, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "var(--surface2)", flexShrink: 0 }}>{tool.photo}</div>}
                <div style={{ flex: 1, padding: "8px 0" }}><div style={{ fontWeight: 700, fontSize: 14 }}>{tool.name}</div><div style={{ fontSize: 11, color: "#f07030" }}>🔎 Suivi en cours · {tool.location}</div></div>
                <span style={{ fontSize: 11, background: "rgba(232,82,10,.15)", color: "#f07030", padding: "3px 8px", borderRadius: 20, fontWeight: 700, marginRight: 12 }}>En répa.</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function RequestsPage({ isSuperAdmin, isAdmin, filteredRequests, requests, tools, users, companies, currentUser, db, showToast, tx }) {
  return (
    <>
      <div className="topbar"><h2>🔔 {tx.requests}</h2><span style={{ fontSize: 12, color: "var(--muted)" }}>{filteredRequests.filter(r => r.status === "pending").length} {tx.pendingLabel}</span></div>
      <div className="content">
        {filteredRequests.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}><div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div><div>{tx.noRequest}</div></div>}
        {isSuperAdmin ? (
          companies.map(company => {
            const companyRequests = requests.filter(r => r.companyId === company.id);
            if (companyRequests.length === 0) return null;
            const companyAdmins = users.filter(u => u.companyId === company.id && u.role === "director");
            return (
              <div key={company.id} style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: company.color || "var(--accent)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  🏢 {company.name}
                  <span style={{ fontSize: 11, background: (company.color || "var(--accent)") + "22", color: company.color || "var(--accent)", padding: "2px 8px", borderRadius: 20 }}>{companyRequests.filter(r => r.status === "pending").length} {tx.pendingLabel}</span>
                </div>
                {companyRequests.map(r => {
                  const tool = tools.find(t => String(t.id) === String(r.toolId));
                  const isPending = r.status === "pending";
                  const hoursAgo = Math.floor((Date.now() - new Date(r.date)) / (1000*60*60));
                  const timeLabel = hoursAgo < 1 ? "< 1h" : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.floor(hoursAgo/24)}j`;
                  const timeColor = hoursAgo > 48 ? "var(--red)" : hoursAgo > 24 ? "var(--accent)" : "var(--green)";
                  return (
                    <div key={r.id} style={{ background: "var(--surface)", borderRadius: 10, padding: 14, border: `1px solid ${isPending ? "var(--border)" : "var(--surface2)"}`, opacity: isPending ? 1 : 0.6, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: isPending ? "rgba(245,166,35,.2)" : r.status === "approved" ? "rgba(39,201,122,.2)" : "rgba(232,82,10,.2)", color: isPending ? "var(--accent)" : r.status === "approved" ? "var(--green)" : "var(--red)" }}>{isPending ? "⏳" : r.status === "approved" ? "✅" : "❌"} {isPending ? tx.pending : r.status === "approved" ? tx.approved : tx.refused}</span>
                          {isPending && <span style={{ fontSize: 11, fontWeight: 700, color: timeColor, background: timeColor + "22", padding: "2px 8px", borderRadius: 20 }}>⏱ {timeLabel}</span>}
                        </div>
                        {tool && <span style={{ fontSize: 18 }}>{tool.photo}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 8 }}>{r.text}</div>
                      {r.adminNote && <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>💬 {r.adminNote}</div>}
                      {isPending && companyAdmins.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                          {companyAdmins.map(admin => (
                            <button key={admin.id} className="btn btn-sm" style={{ background: "rgba(37,211,102,.15)", color: "#25d366", fontSize: 11 }}
                              onClick={() => {
                                const msg = encodeURIComponent(`📋 *TOOL TRACK — Rappel demande*\n\nBonjour ${admin.name},\n\nUne demande attend votre réponse depuis *${timeLabel}* :\n\n"${r.text}"\n\n📱 https://tool-track-rosy.vercel.app`);
                                const phone = admin.phone?.replace(/\s/g,"").replace(/^\+/,"") || "";
                                window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
                              }}>📲 Rappel → {admin.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredRequests.map(r => {
              const tool = tools.find(t => String(t.id) === String(r.toolId));
              const isPending = r.status === "pending";
              return (
                <div key={r.id} style={{ background: "var(--surface)", borderRadius: 12, padding: 16, border: `1px solid ${isPending ? "var(--accent)" : r.status === "approved" ? "var(--green)" : "var(--red)"}`, opacity: isPending ? 1 : 0.7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: isPending ? "rgba(245,166,35,.2)" : r.status === "approved" ? "rgba(39,201,122,.2)" : "rgba(232,82,10,.2)", color: isPending ? "var(--accent)" : r.status === "approved" ? "var(--green)" : "var(--red)" }}>{isPending ? `⏳ ${tx.pending}` : r.status === "approved" ? `✅ ${tx.approved}` : `❌ ${tx.refused}`}</span>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{new Date(r.date).toLocaleString("fr-MU")}</div>
                    </div>
                    {tool && <span style={{ fontSize: 20 }}>{tool.photo}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 10 }}>{r.text}</div>
                  {r.adminNote && <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>💬 Admin : "{r.adminNote}"</div>}
                  {isAdmin && isPending && (
                    <RequestActions request={r} tool={tool}
                      onApprove={async (adminNote) => {
                        if (r.type === "transfer" && tool) await setDoc(doc(db, "tools", String(tool.id)), { ...tool, status: "assigned", assignedTo: String(r.targetViewerId), location: r.targetChantier, history: [...(tool.history || []), { date: new Date().toLocaleDateString("fr-MU"), action: `✅ Approuvé par ${currentUser.name} : ${r.currentOwnerName || r.fromName} → ${r.targetViewerName} — ${r.targetChantier}`, by: currentUser.name }] });
                        else if (r.type === "return" && tool) await setDoc(doc(db, "tools", String(tool.id)), { ...tool, status: "store", assignedTo: null, location: "Store", history: [...(tool.history || []), { date: new Date().toLocaleDateString("fr-MU"), action: `✅ Approuvé par ${currentUser.name} : ${r.currentOwnerName || r.fromName} → Store`, by: currentUser.name }] });
                        await setDoc(doc(db, "requests", r.id), { ...r, status: "approved", adminNote: adminNote || "", approvedBy: currentUser.name, approvedAt: new Date().toISOString() });
                        showToast("✅ Demande approuvée !");
                      }}
                      onRefuse={async (adminNote) => {
                        await setDoc(doc(db, "requests", r.id), { ...r, status: "refused", adminNote: adminNote || "", refusedBy: currentUser.name, refusedAt: new Date().toISOString() });
                        showToast("❌ Demande refusée");
                      }}
                    />
                  )}
                  {!isAdmin && <div style={{ fontSize: 11, color: "var(--muted)" }}>{isPending ? `⏳ ${tx.pendingAdmin}` : r.status === "approved" ? `✅ ${tx.approvedBy} ${r.approvedBy}` : `❌ ${tx.refusedBy} ${r.refusedBy}`}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function UsersPage({ isSuperAdmin, filteredUsers, filteredTools, tools, users, companies, currentUser, realUser, db, showToast, setModal, onSupervise, tx, deleteDirectorSelf, isSupervising }) {
  return (
    <>
      <div className="topbar"><h2>{tx.team}</h2>{!isSuperAdmin && <button className="btn btn-primary" onClick={() => setModal({ type: "addUser" })}>+ {tx.addProfile}</button>}</div>
      <div className="content">
        {isSuperAdmin ? (
          companies.length === 0 ? <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}><div style={{ fontSize: 40 }}>🏢</div><div>Créez d'abord des compagnies</div></div> :
          companies.map(company => {
            const companyUsers = users.filter(u => u.companyId === company.id);
            if (companyUsers.length === 0) return null;
            return (
              <div key={company.id} style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: company.color || "var(--accent)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  🏢 {company.name} <span style={{ fontSize: 12, fontWeight: 600, background: (company.color || "var(--accent)") + "22", color: company.color || "var(--accent)", padding: "2px 8px", borderRadius: 10 }}>{companyUsers.length}</span>
                </div>
                <div className="cards-grid">
                  {companyUsers.map(u => {
                    const assignedTools = tools.filter(t => String(t.assignedTo) === String(u.id));
                    return (
                      <div key={u.id} style={{ background: "var(--surface)", border: `1px solid ${u.role === "admin" ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ height: 5, background: u.role === "admin" ? "var(--accent)" : "var(--blue)" }} />
                        <div style={{ padding: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: u.role === "admin" ? "var(--accent)" : "var(--blue)", color: u.role === "admin" ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>{u.avatar}</div>
                            <div><div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{u.role === "admin" ? "🔑 Admin" : "👷 Employé"}</div></div>
                          </div>
                          <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
                            <div style={{ fontSize: 10, color: "var(--muted)" }}>🔑 PIN</div>
                            <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: 6 }}>{u.pin}</div>
                          </div>
                          {u.phone && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>📞 {u.phone}</div>}
                          <div style={{ display: "flex", gap: 6 }}>
                            {onSupervise && <button className="btn btn-blue btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => onSupervise(u)}>👁 Voir</button>}
                            <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => {
                              if (assignedTools.length > 0) { showToast("⚠️ Ce profil a des outils confiés !", "warn"); return; }
                              if (String(u.id) === String(currentUser.id)) { showToast(`❌ ${tx.cannotDeleteSelf}`); return; }
                              const deleteRules = { superadmin: ["director","admin","viewer"], director: ["admin","viewer"], admin: ["viewer"], viewer: [] };
                              if (!(deleteRules[(realUser||currentUser)?.role] || []).includes(u.role)) { showToast(`❌ ${tx.cannotDeleteRole}`); return; }
                              if (window.confirm(`${tx.deleteConfirm} ${u.name} ?`)) { deleteUserCompletely(u); showToast(`🗑 ${tx.profileDeleted}`); }
                            }}>🗑</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          ["director", "admin", "viewer"].map(role => {
            const roleUsers = filteredUsers.filter(u => u.role === role);
            if (roleUsers.length === 0) return null;
            const roleColor = role === "director" ? "#9b59b6" : role === "admin" ? "var(--accent)" : "var(--blue)";
            const roleLabel = role === "director" ? `🏢 ${tx.directors}` : role === "admin" ? `🔑 ${tx.admins}` : "👷 " + tx.employee;
            const canSeePins = ["superadmin","admin","director"].includes(currentUser.role);
            return (
              <div key={role} style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: roleColor, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  {roleLabel} <span style={{ fontSize: 12, fontWeight: 600, background: roleColor + "22", color: roleColor, padding: "2px 8px", borderRadius: 10 }}>{roleUsers.length}</span>
                </div>
                <div className="cards-grid">
                  {roleUsers.map(u => {
                    const assignedTools = filteredTools.filter(t => String(t.assignedTo) === String(u.id));
                    // En supervision → voir exactement ce que le compte supervisé voit
                    // Hors supervision → utiliser le vrai compte connecté
                    const activeUser = currentUser; // currentUser = effectiveUser en supervision
                    const isSelf = String(u.id) === String(activeUser.id);
                    const deleteRules = {
                      superadmin: ["director", "admin", "viewer"],
                      director: ["admin", "viewer"],
                      admin: ["viewer"],
                      viewer: []
                    };
                    const effectiveRole = activeUser?.role;
                    const canDelete = !isSelf && (deleteRules[effectiveRole] || []).includes(u.role);
                    const hierarchy = { superadmin: 4, director: 3, admin: 2, viewer: 1 };
                    const canSupervise = onSupervise && !isSelf && (hierarchy[activeUser?.role] || 0) > (hierarchy[u.role] || 0);
                    return (
                      <div key={u.id} style={{ background: "var(--surface)", border: `1px solid ${isSelf ? roleColor : "var(--border)"}`, borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ height: 6, background: roleColor }} />
                        <div style={{ padding: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 12, background: roleColor, color: role === "viewer" ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{u.avatar}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800 }}>{u.name}{isSelf && <span style={{ fontSize: 10, background: "rgba(245,166,35,.2)", color: "var(--accent)", padding: "1px 6px", borderRadius: 8, marginLeft: 6 }}>Moi</span>}</div>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: roleColor + "22", color: roleColor, marginTop: 3, display: "inline-block" }}>{role === "director" ? `🏢 ${tx.director}` : role === "admin" ? "🔑 Admin" : `👷 ${tx.employee}`}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                            {u.phone && <div style={{ fontSize: 12, color: "var(--muted)" }}>📞 {u.phone}</div>}
                            {u.email && <div style={{ fontSize: 12, color: "var(--muted)" }}>✉️ {u.email}</div>}
                          </div>
                          {/* Bouton auto-suppression pour le Directeur — visible aussi en supervision SuperAdmin */}
                          {isSelf && u.role === "director" && (
                            <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center", background: "rgba(232,64,40,.1)", color: "var(--red)", border: "1px solid rgba(232,64,40,.3)", fontSize: 11, marginBottom: 8 }} onClick={deleteDirectorSelf}>
                              🗑 {tx.deleteAccount}
                            </button>
                          )}

                          {canSeePins && u.pin && (
                            <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>🔑 PIN</div>
                              <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, letterSpacing: 6, color: "var(--accent)" }}>{u.pin}</div>
                            </div>
                          )}
                          {role === "viewer" && (
                            <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                              {assignedTools.length === 0 ? <div style={{ fontSize: 11, color: "var(--muted)" }}>{tx.noToolAssigned}</div> : assignedTools.map(t => <div key={t.id} style={{ fontSize: 12, color: "var(--blue)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}><span>{t.photo}</span>{t.name}</div>)}
                            </div>
                          )}
                          {canDelete && <button className="btn btn-danger btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => {
                            if (String(u.id) === String(currentUser.id)) { showToast(`❌ ${tx.cannotDeleteSelf}`); return; }
                            if (assignedTools.length > 0) { showToast("⚠️ Des outils sont encore confiés !", "warn"); return; }
                            if (window.confirm(`${tx.deleteConfirm} ${u.name} ?`)) { deleteUserCompletely(u); showToast(`🗑 ${tx.profileDeleted}`); }
                          }}>{`🗑 ${tx.deleteBtn}`}</button>}
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
  );
}

// ─── MODAL ROUTER ─────────────────────────────────────────────────────────────
function ModalRouter({ modal, setModal, users, tools, setTools, viewers, chantiers, currentUser, effectiveUser, addTool, addUser, assignTool, deleteTool, updateTool, myCompany }) {
  const isAdmin = ["admin","director","superadmin"].includes(currentUser.role);
  if (modal.type === "addTool") return <AddToolModal onClose={() => setModal(null)} onSave={addTool} />;
  if (modal.type === "addUser") return <AddUserModal onClose={() => setModal(null)} onSave={addUser} currentUser={effectiveUser} myCompany={myCompany} />;
  // FIX #7 — on relit le tool depuis le state tools (mis à jour par onSnapshot) au lieu du snapshot figé modal.data
  if (modal.type === "tool") {
    const liveTool = tools.find(t => String(t.id) === String(modal.data?.id)) || modal.data;
    if (!liveTool) return null;
    return <ToolDetailModal tool={liveTool} onClose={() => setModal(null)} users={users} viewers={viewers} chantiers={chantiers} isAdmin={isAdmin} assignTool={assignTool} currentUser={currentUser} deleteTool={deleteTool} updateTool={updateTool} />;
  }
  if (modal.type === "whatsappInvite") {
    const admin = modal.data;
    const roleLabel = admin.role === "director" ? "Directeur" : "Administrateur";
    const loginInfo = admin.role === "director"
      ? `🏢 Code de votre compagnie : *${admin.companyPin || "voir votre responsable"}*\n📧 Votre email : *${admin.email}*\n🔐 Créez votre mot de passe à la première connexion`
      : `🏢 Code de votre compagnie : *${admin.companyPin || "voir votre responsable"}*\n🔑 Votre code PIN : *${admin.pin}*`;
    const msg = encodeURIComponent(`Bonjour ${admin.name} 👋\n\nVous avez été nommé *${roleLabel}* de *${admin.companyName}* sur *Tool Track*.\n\n📱 Accédez à l'app : https://tool-track-rosy.vercel.app\n${loginInfo}\n\nOuvrez le lien dans Safari (iPhone) ou Chrome (Android) et ajoutez-le à votre écran d'accueil.\n\n_Bonne gestion !_ 🚀`);
    const phone = admin.phone?.replace(/\s/g,"").replace(/^\+/,"") || "";
    const waUrl = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    return (
      <div className="modal-overlay" onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
          <div className="modal-header"><h3>✅ {admin.role === "director" ? "Directeur" : "Admin"} créé !</h3><button className="close-btn" onClick={() => setModal(null)}>×</button></div>
          <div className="modal-body" style={{ textAlign: "center", gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, margin: "0 auto" }}>{admin.avatar}</div>
            <div><div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800 }}>{admin.name}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{admin.role === "director" ? "🏢 Directeur" : "🔑 Admin"} · {admin.companyName}</div></div>
            {admin.role !== "director" && (
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 24px" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Code PIN</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 36, fontWeight: 800, color: "var(--accent)", letterSpacing: 8 }}>{admin.pin}</div>
              </div>
            )}
            {admin.role === "director" && (
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 24px", textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>🏢 Code compagnie</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: 6 }}>{admin.companyPin}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, marginBottom: 4 }}>📧 Email d'accès</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{admin.email}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>🔐 Il créera son mot de passe à la première connexion</div>
              </div>
            )}
            <button className="btn btn-green" style={{ width: "100%", justifyContent: "center", fontSize: 15 }} onClick={() => { window.open(waUrl, "_blank"); setModal(null); }}>📲 Envoyer via WhatsApp</button>
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(null)}>Fermer sans envoyer</button></div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── TOOL DETAIL MODAL ────────────────────────────────────────────────────────
function ToolDetailModal({ tool, onClose, users, viewers, chantiers, isAdmin, assignTool, currentUser, deleteTool, updateTool }) {
  const tx = getTx();
  const [assignForm, setAssignForm] = useState({ viewerId: "", chantier: "" });

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: tool.name || "", ref: tool.ref || "", description: tool.description || "", price: tool.price ? tool.price.toLocaleString("fr-MU") : "", purchaseDate: tool.purchaseDate || "" });
  // FIX #12 — confirmDelete masqué automatiquement quand editing=true
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef();
  const [newPhoto, setNewPhoto] = useState(null);
  const [loadingAssign, triggerAssign] = useLoadingBtn();

  const [loadingSave, triggerSave] = useLoadingBtn();
  const [loadingDelete, triggerDelete] = useLoadingBtn();
  const [loadingDeclare, triggerDeclare] = useLoadingBtn();
  const [loadingThread, triggerThread] = useLoadingBtn();
  const assignee = users.find(u => String(u.id) === String(tool.assignedTo));
  const [newEntryNote, setNewEntryNote] = useState("");
  const [newEntryStatus, setNewEntryStatus] = useState(tool.obsoleteType || "suivi-cours");
  const [newEntryCost, setNewEntryCost] = useState("");
  const [declareDate, setDeclareDate] = useState(new Date().toISOString().slice(0,10));
  const threadRef = useRef();
  const STATUSES = [
    { val: "suivi-cours", label: "🔎 Suivi en cours", color: "#9b59b6" },
    { val: "remis", label: "✅ Remis en service → Store", color: "#27c97a" },
    { val: "obsolete-final", label: "⚫ Déclarer obsolète définitif", color: "#888" },
  ];
  const getStatus = (val) => STATUSES.find(s => s.val === val) || STATUSES[0];
  const now = () => new Date().toLocaleString("fr-MU", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const declareNonFunctional = async () => {
    const costNum = newEntryCost ? Number(String(newEntryCost).replace(/\s/g,"")) : null;
    const firstEntry = { id: Date.now(), type: "thread", status: "suivi-cours", note: newEntryNote || "Outil déclaré non fonctionnel.", cost: costNum, by: currentUser.name, datetime: now(), timestamp: Date.now() };
    const updatedTool = { ...tool, status: "nonfunctional", obsolete: false, obsoleteDate: declareDate, obsoleteType: "suivi-cours", repairCost: costNum ?? tool.repairCost ?? null, totalRepairCost: costNum ? (tool.totalRepairCost || 0) + costNum : (tool.totalRepairCost || 0), obsoleteThread: [firstEntry], history: [...tool.history, { date: new Date().toLocaleDateString("fr-MU"), action: `🔴 Déclaré non fonctionnel${costNum ? ` — Rs ${costNum.toLocaleString("fr-MU")}` : ""}`, by: currentUser.name }] };
    await setDoc(doc(db, "tools", String(tool.id)), updatedTool);
    setNewEntryNote(""); setNewEntryCost(""); onClose();
  };

  const addThreadEntry = async () => {
    if (!newEntryNote.trim() && newEntryStatus === tool.obsoleteType && !newEntryCost) return;
    const costNum = newEntryCost ? Number(String(newEntryCost).replace(/\s/g,"")) : null;
    const entry = { id: Date.now(), type: "thread", status: newEntryStatus, note: newEntryNote, cost: costNum, by: currentUser.name, datetime: now(), timestamp: Date.now() };
    let newToolStatus = newEntryStatus === "remis" ? "store" : newEntryStatus === "obsolete-final" ? "obsolete" : "nonfunctional";
    let histAction = `Statut → ${getStatus(newEntryStatus).label}`;
    if (newEntryNote) histAction += ` — "${newEntryNote}"`;
    if (costNum) histAction += ` — Rs ${costNum.toLocaleString("fr-MU")}`;
    const updatedTool = { ...tool, status: newToolStatus, obsolete: newToolStatus === "obsolete", obsoleteType: newEntryStatus === "remis" ? null : newEntryStatus, repairCost: costNum ?? tool.repairCost ?? null, totalRepairCost: costNum ? (tool.totalRepairCost || 0) + costNum : (tool.totalRepairCost || 0), obsoleteThread: [...(tool.obsoleteThread || []), entry], history: [...tool.history, { date: new Date().toLocaleDateString("fr-MU"), action: histAction, by: currentUser.name }] };
    await setDoc(doc(db, "tools", String(tool.id)), updatedTool);
    setNewEntryNote(""); setNewEntryCost("");
    setTimeout(() => threadRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 100);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 24 }}>{tool.photo}</span>
            <div style={{ minWidth: 0 }}><h3 style={{ fontSize: 17, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool.name}</h3>{tool.ref && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>🏭 {tool.ref}</div>}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {/* FIX #12 — boutons edit/delete masqués si editing ou confirmDelete actif */}
            {isAdmin && !editing && !confirmDelete && (
              <><button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏️</button>
              <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.2)", color: "var(--red)" }} onClick={() => setConfirmDelete(true)}>🗑</button></>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {confirmDelete && (
          <div style={{ background: "rgba(232,82,10,.1)", border: "1px solid var(--red)", borderRadius: 10, margin: "12px 24px", padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--red)" }}>{`⚠️ ${tx.deleteBtn} "${tool.name}" ?`}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Action irréversible.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>{tx.cancel}</button>
              <button className={`btn btn-danger btn-sm ${loadingDelete ? "loading" : ""}`} disabled={loadingDelete} onClick={() => triggerDelete(() => deleteTool(tool.id))}>{loadingDelete ? "⏳..." : tx.confirmSuppr}</button>
            </div>
          </div>
        )}

        {editing && (
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Fournisseur</label><input className="form-input" value={editForm.ref} onChange={e => setEditForm(p => ({ ...p, ref: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Date d'achat</label><input className="form-input" type="date" value={editForm.purchaseDate} onChange={e => setEditForm(p => ({ ...p, purchaseDate: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label className="form-label">🇲🇺 Prix (Rs)</label><input className="form-input" type="text" inputMode="numeric" placeholder="ex: 18 000" value={editForm.price} onChange={e => { const raw = e.target.value.replace(/\s/g,"").replace(/[^0-9]/g,""); setEditForm(p => ({ ...p, price: raw.replace(/\B(?=(\d{3})+(?!\d))/g," ") })); }} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="form-group">
              <label className="form-label">📷 Changer la photo</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = async ev => { const compressed = await compressImage(ev.target.result, 600, 0.75); setNewPhoto(compressed); }; r.readAsDataURL(f); }} />
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} id="cameraEditInput" onChange={async e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = async ev => { const compressed = await compressImage(ev.target.result, 600, 0.75); setNewPhoto(compressed); }; r.readAsDataURL(f); }} />
              {newPhoto ? (<div><img src={newPhoto} alt="aperçu" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8 }} /><button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => setNewPhoto(null)}>{`🗑 ${tx.deleteBtn}`}</button></div>) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, flexDirection: "column", gap: 4, padding: "12px 0" }} onClick={() => document.getElementById("cameraEditInput").click()}><span style={{ fontSize: 22 }}>📸</span><span style={{ fontSize: 11 }}>Caméra</span></button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, flexDirection: "column", gap: 4, padding: "12px 0" }} onClick={() => fileRef.current.click()}><span style={{ fontSize: 22 }}>🖼</span><span style={{ fontSize: 11 }}>Galerie</span></button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setNewPhoto(null); }}>{tx.cancel}</button>
              <button className={`btn btn-primary btn-sm ${loadingSave ? "loading" : ""}`} disabled={!editForm.name.trim() || loadingSave} onClick={() => triggerSave(async () => { await updateTool(tool.id, { name: editForm.name, ref: editForm.ref, description: editForm.description, purchaseDate: editForm.purchaseDate, price: editForm.price ? Number(String(editForm.price).replace(/\s/g,"")) : null, photoUrl: newPhoto || tool.photoUrl }); setEditing(false); setNewPhoto(null); })}>{loadingSave ? "⏳..." : tx.save}</button>
            </div>
          </div>
        )}

        <div className="modal-body" style={{ display: editing ? "none" : "flex" }}>
          {tool.photoUrl ? <img src={tool.photoUrl} alt={tool.name} className="tool-photo-detail" /> : <div className="tool-photo-detail-placeholder">{tool.photo}</div>}
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-key">Fournisseur</div><div className="detail-val">{tool.ref || "—"}</div></div>
            <div className="detail-item"><div className="detail-key">Achat</div><div className="detail-val">{tool.purchaseDate ? new Date(tool.purchaseDate).toLocaleDateString("fr-MU") : "—"}</div></div>
            <div className="detail-item"><div className="detail-key">Statut</div><div className="detail-val">{{ store: "🟢 " + tx.inStore2, assigned: "🔵 " + tx.onSite2, nonfunctional: "🔴 " + tx.nonfunctional, obsolete: "⚫ " + tx.obsolete2 }[tool.status] || tool.status}</div></div>
            <div className="detail-item" style={{ gridColumn: "1/-1" }}><div className="detail-key">Localisation</div><div className="detail-val">📍 {tool.location}</div></div>
            {assignee && <div className="detail-item" style={{ gridColumn: "1/-1" }}><div className="detail-key">Responsable</div><div className="detail-val">👷 {assignee.name}</div></div>}
            {tool.price && (
              <div className="detail-item" style={{ gridColumn: "1/-1", background: "rgba(232,82,10,.08)", border: "1px solid rgba(232,82,10,.25)" }}>
                <div className="detail-key">Valeur d'achat</div>
                <div style={{ marginTop: 4 }}><div className="price-tag-lg">🇲🇺 Rs {tool.price.toLocaleString("fr-MU")}</div><div className="price-warning">⚠️ {tx.lossWarning}</div></div>
              </div>
            )}
            {tool.totalRepairCost > 0 && (
              <div className="detail-item" style={{ gridColumn: "1/-1", background: "rgba(155,89,182,.08)", border: "1px solid rgba(155,89,182,.3)" }}>
                <div className="detail-key">Total réparations</div>
                <div style={{ marginTop: 4 }}><div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(155,89,182,.15)", border: "1px solid rgba(155,89,182,.35)", borderRadius: 8, padding: "6px 14px" }}><span style={{ fontSize: 15, fontWeight: 800, color: "#9b59b6" }}>🔧 Rs {tool.totalRepairCost.toLocaleString("fr-MU")}</span></div><div className="price-warning">Cumul de toutes les réparations.</div></div>
              </div>
            )}
            <div className="detail-item" style={{ gridColumn: "1/-1" }}><div className="detail-key">Description</div><div className="detail-val" style={{ fontSize: 13, fontWeight: 400 }}>{tool.description}</div></div>
          </div>

          {isAdmin && tool.status === "store" && (
            <div className="assign-section"><h4>📤 Sortir du store → Chantier</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Bouton M'attribuer directement */}
                <button className="btn btn-sm" style={{ background: "rgba(245,166,35,.15)", color: "var(--accent)", border: "1px solid rgba(245,166,35,.4)", fontWeight: 700 }}
                  onClick={() => setAssignForm(p => ({ ...p, viewerId: String(currentUser.id) }))}>
                  👤 M'attribuer
                </button>
                <select className="form-input" value={assignForm.viewerId} onChange={e => setAssignForm(p => ({ ...p, viewerId: e.target.value }))}><option value="">— Confier à —</option>{(users || []).filter(u => u.companyId === currentUser?.companyId && ["viewer","admin","director"].includes(u.role)).map(v => <option key={v.id} value={v.id}>{v.name}{String(v.id) === String(currentUser?.id) ? " (moi)" : ""} - {v.role === "viewer" ? "Employe" : v.role === "admin" ? "Admin" : "Directeur"}</option>)}</select>
                <select className="form-input" value={assignForm.chantier} onChange={e => setAssignForm(p => ({ ...p, chantier: e.target.value }))}><option value="">{tx.chooseSite}</option>{chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                <button className={`btn btn-primary btn-sm ${loadingAssign ? "loading" : ""}`} disabled={!assignForm.viewerId || !assignForm.chantier || loadingAssign} onClick={() => triggerAssign(() => assignTool(tool.id, assignForm.viewerId, assignForm.chantier, "out"))}>{loadingAssign ? "⏳..." : tx.outAndAssign}</button>
              </div>
            </div>
          )}



          {isAdmin && (
            <div style={{ background: "rgba(120,120,140,.07)", border: "1px solid rgba(120,120,140,.25)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "#aaa", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                🔴 {tx.repairTracking}
                {(tool.status === "nonfunctional" || tool.status === "obsolete") && tool.obsoleteType && <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: getStatus(tool.obsoleteType).color + "30", color: getStatus(tool.obsoleteType).color }}>{getStatus(tool.obsoleteType).label}</span>}
              </div>
              {tool.status !== "nonfunctional" && tool.status !== "obsolete" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{tx.reportProblem}</div>
                  <input className="form-input" type="date" value={declareDate} onChange={e => setDeclareDate(e.target.value)} />
                  <input className="form-input" type="text" inputMode="numeric" placeholder={`🇲🇺 ${tx.repairCost}`} value={newEntryCost} onChange={e => { const raw = e.target.value.replace(/\s/g,"").replace(/[^0-9]/g,""); setNewEntryCost(raw.replace(/\B(?=(\d{3})+(?!\d))/g," ")); }} />
                  <textarea className="form-input" rows={2} placeholder={tx.repairNote} value={newEntryNote} onChange={e => setNewEntryNote(e.target.value)} />
                  <button className={`btn btn-sm ${loadingDeclare ? "loading" : ""}`} disabled={loadingDeclare} style={{ background: "rgba(232,82,10,.25)", color: "#f07030", alignSelf: "flex-start", border: "1px solid rgba(232,82,10,.4)" }} onClick={() => triggerDeclare(declareNonFunctional)}>{loadingDeclare ? "⏳..." : `🔴 ${tx.openTracking}`}</button>
                </div>
              ) : (
                <>
                  <div ref={threadRef} style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {(tool.obsoleteThread || []).map((entry, i) => {
                      const st = getStatus(entry.status);
                      const isMe = entry.by === currentUser.name;
                      return (
                        <div key={entry.id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "88%", background: isMe ? "rgba(58,142,246,.15)" : "var(--surface2)", border: `1px solid ${isMe ? "rgba(58,142,246,.3)" : "var(--border)"}`, borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "8px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? "var(--blue)" : "var(--accent)" }}>{entry.by}</span>
                              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: st.color + "25", color: st.color, fontWeight: 700 }}>{st.label}</span>
                              {entry.cost && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(232,82,10,.2)", color: "#f07030", fontWeight: 700 }}>Rs {entry.cost.toLocaleString("fr-MU")}</span>}
                            </div>
                            {entry.note && <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{entry.note}</div>}
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 5, textAlign: isMe ? "right" : "left" }}>{entry.datetime}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {STATUSES.map(s => <button key={s.val} onClick={() => setNewEntryStatus(s.val)} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 700, cursor: "pointer", background: newEntryStatus === s.val ? s.color + "25" : "var(--surface2)", borderColor: newEntryStatus === s.val ? s.color : "var(--border)", color: newEntryStatus === s.val ? s.color : "var(--muted)" }}>{s.label}</button>)}
                    </div>
                    <input className="form-input" type="text" inputMode="numeric" placeholder={tx.repairCost} value={newEntryCost} onChange={e => { const raw = e.target.value.replace(/\s/g,"").replace(/[^0-9]/g,""); setNewEntryCost(raw.replace(/\B(?=(\d{3})+(?!\d))/g," ")); }} />
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <textarea className="form-input" rows={2} style={{ flex: 1, resize: "none" }} placeholder={`Note de ${currentUser.name}...`} value={newEntryNote} onChange={e => setNewEntryNote(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addThreadEntry(); } }} />
                      <button className={`btn btn-blue btn-sm ${loadingThread ? "loading" : ""}`} disabled={loadingThread} style={{ alignSelf: "flex-end" }} onClick={() => triggerThread(addThreadEntry)}>{loadingThread ? "⏳" : "Envoyer"}</button>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>Entrée pour envoyer · Shift+Entrée pour saut de ligne</div>
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>📋 Historique</div>
            <div className="history-list">
              {[...(tool.history || [])].reverse().map((h, i) => (
                <div key={i} className="history-item">
                  <div className="history-dot" style={{ background: h.action?.startsWith("✅") ? "var(--green)" : h.action?.startsWith("📋") ? "var(--accent)" : h.action?.startsWith("🔄") || h.action?.startsWith("📤") ? "var(--blue)" : h.action?.startsWith("🏠") ? "var(--green)" : h.action?.startsWith("🔴") ? "var(--red)" : "var(--accent)" }} />
                  <div>
                    <div className="history-text" style={{ fontWeight: 600 }}>{h.action}</div>
                    <div className="history-date">📅 {h.date} — {tx.byLabel} {h.by}</div>
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
  const tx = getTx();
  const [form, setForm] = useState({ name: "", ref: "", purchaseDate: "", price: "", description: "", photo: "🔧", photoUrl: null });
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef(), cameraRef = useRef();
  const handlePhoto = async (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { const compressed = await compressImage(ev.target.result, 600, 0.75); setForm(p => ({ ...p, photoUrl: compressed })); }; reader.readAsDataURL(file); };
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSubmitted(true);
    if (!form.name.trim() || !form.ref.trim() || !form.purchaseDate || !form.price.toString().trim()) return;
    if (saving) return; // éviter les doublons
    setSaving(true);
    await onSave(form);
    onClose(); // fermer le modal après sauvegarde
  };
  const fieldStyle = (val) => ({ borderColor: submitted && !val?.trim() ? "var(--red)" : undefined, boxShadow: submitted && !val?.trim() ? "0 0 0 2px rgba(232,82,10,.2)" : undefined });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Ajouter un outil</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">📷 Photo <span style={{ fontSize: 10, color: "var(--muted)" }}>(optionnel)</span></label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
            {form.photoUrl ? (
              <div><img src={form.photoUrl} alt="aperçu" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 10, background: "var(--surface2)" }} /><button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => setForm(p => ({ ...p, photoUrl: null }))}>{`🗑 ${tx.deleteBtn}`}</button></div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, flexDirection: "column", gap: 6, padding: "16px 0", fontSize: 13 }} onClick={() => cameraRef.current.click()}><span style={{ fontSize: 28 }}>📸</span>Prendre une photo</button>
                <button className="btn btn-ghost" style={{ flex: 1, flexDirection: "column", gap: 6, padding: "16px 0", fontSize: 13 }} onClick={() => fileRef.current.click()}><span style={{ fontSize: 28 }}>🖼</span>Depuis la galerie</button>
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nom <span style={{ color: "var(--red)" }}>*</span></label><input className="form-input" style={fieldStyle(form.name)} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ex: Perceuse Bosch" />{submitted && !form.name.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Nom obligatoire</div>}</div>
            <div className="form-group"><label className="form-label">Fournisseur <span style={{ color: "var(--red)" }}>*</span></label><input className="form-input" style={fieldStyle(form.ref)} value={form.ref} onChange={e => setForm(p => ({ ...p, ref: e.target.value }))} placeholder="ex: Neetoo" />{submitted && !form.ref.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Fournisseur obligatoire</div>}</div>
          </div>
          <div className="form-group"><label className="form-label">Date d'achat <span style={{ color: "var(--red)" }}>*</span></label><input className="form-input" style={{ borderColor: submitted && !form.purchaseDate ? "var(--red)" : undefined }} type="date" value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} />{submitted && !form.purchaseDate && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Date obligatoire</div>}</div>
          <div className="form-group"><label className="form-label">🇲🇺 Prix d'achat (Rs) <span style={{ color: "var(--red)" }}>*</span></label><input className="form-input" style={{ borderColor: submitted && !form.price.toString().trim() ? "var(--red)" : undefined }} type="text" inputMode="numeric" placeholder="ex: 20 000" value={form.price} onChange={e => { const raw = e.target.value.replace(/\s/g,"").replace(/[^0-9]/g,""); setForm(p => ({ ...p, price: raw.replace(/\B(?=(\d{3})+(?!\d))/g," ") })); }} />{submitted && !form.price.toString().trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Prix obligatoire</div>}</div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>{tx.cancel}</button><button className="btn btn-primary" disabled={saving || !form.name.trim() || !form.ref.trim() || !form.purchaseDate || !form.price.toString().trim()} onClick={handleSave}>{saving ? "⏳..." : "Ajouter"}</button></div>
      </div>
    </div>
  );
}

// ─── ADD USER MODAL ───────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSave, currentUser, myCompany }) {
  const tx = getTx();
  const APP_URL = "tool-track-rosy.vercel.app";
  const generatePin = () => String(Math.floor(1000 + Math.random() * 9000));
  const defaultRole = currentUser?.role === "superadmin" ? "director" : currentUser?.role === "director" ? "admin" : "viewer";
  const [form, setForm] = useState({ name: "", role: defaultRole, phone: "", email: "", pin: generatePin() });
  const [saved, setSaved] = useState(false);
  const [savedUser, setSavedUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const fieldStyle = (val) => ({ borderColor: submitted && !val?.trim() ? "var(--red)" : undefined, boxShadow: submitted && !val?.trim() ? "0 0 0 2px rgba(232,82,10,.2)" : undefined });
  const handleSave = async () => {
    setSubmitted(true);
    if (!form.name.trim()) return;
    if (form.phone.trim().length < 7) return;
    // Directeur → email obligatoire, pas de PIN
    if (form.role === "director") {
      if (!form.email.trim() || !form.email.includes("@")) return;
    } else {
      // Admin/Employé → PIN obligatoire
      if (form.pin.length !== 4) return;
    }
    await onSave(form);
    setSavedUser({ ...form });
    setSaved(true);
  };
  const sendWhatsApp = () => {
    const companyPin = myCompany?.companyPin || "", companyName = myCompany?.name || "";
    const msg = encodeURIComponent(`Bonjour ${savedUser.name} 👋\n\nTu es invité(e) sur *Tool Track*.\n\n📱 https://${APP_URL}\n${companyName ? `🏢 Compagnie : *${companyName}*\n` : ""}${companyPin ? `🔐 Code : *${companyPin}*\n` : ""}👤 Profil : *${savedUser.name}*\n🔑 PIN : *${savedUser.pin}*\n\n_Ouvre le lien dans Safari (iPhone) ou Chrome (Android) et ajoute-le à ton écran d'accueil !_`);
    const phone = savedUser.phone.replace(/\s/g,"").replace(/^\+/,"");
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>{saved ? "✅ Profil créé !" : "Nouveau profil"}</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          {!saved ? (
            <>
              <div className="form-group"><label className="form-label">Nom complet <span style={{ color: "var(--red)" }}>*</span></label><input className="form-input" style={fieldStyle(form.name)} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ex: Jean Dupont" />{submitted && !form.name.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Nom obligatoire</div>}</div>
              <div className="form-group"><label className="form-label">Rôle *</label>
                <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {/* Règle stricte : on ne crée que des rôles STRICTEMENT inférieurs */}
                  {["admin","director","superadmin"].includes(currentUser?.role) && <option value="viewer">👷 Employé</option>}
                  {["director","superadmin"].includes(currentUser?.role) && <option value="admin">🔑 Admin</option>}
                  {["superadmin","director"].includes(currentUser?.role) && <option value="director">🏢 Directeur</option>}
                  {/* Admin → Employé seulement | Directeur → Admin + Employé | SuperAdmin → tous sauf SuperAdmin */}
                </select>
              </div>
              {form.role === "director" && <div style={{ fontSize: 11, color: "var(--accent)", background: "rgba(245,166,35,.1)", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>📧 Le Directeur recevra un email pour créer son mot de passe</div>}
              <div className="form-row">
                <div className="form-group"><label className="form-label">📞 Téléphone * (min. 7 chiffres)</label><input className="form-input" placeholder="+230 ..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                {form.role !== "viewer" && <div className="form-group"><label className="form-label">{form.role === "director" ? "📧 Email * (invitation)" : "Email"}</label><input className="form-input" type="email" placeholder={form.role === "director" ? "email@exemple.com" : "optionnel"} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>}
              </div>
              {form.role !== "director" && (
                <div className="form-group"><label className="form-label">🔑 Code PIN (4 chiffres) *</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input className="form-input" style={{ flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: 8, textAlign: "center", ...(submitted && form.pin.length !== 4 ? { borderColor: "var(--red)" } : {}) }} maxLength={4} value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g,"").slice(0,4) }))} />
                    <button className="btn btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, pin: generatePin() }))}>🔄 Nouveau</button>
                  </div>
                  {submitted && form.pin.length !== 4 && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ PIN doit contenir 4 chiffres</div>}
                </div>
              )}
              {submitted && form.role === "director" && (!form.email.trim() || !form.email.includes("@")) && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Email obligatoire pour un Directeur</div>}
              {submitted && form.phone.trim().length < 7 && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Téléphone obligatoire (min. 7 chiffres)</div>}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: 14, background: savedUser.role === "admin" ? "var(--accent)" : "var(--blue)", color: savedUser.role === "admin" ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>{savedUser.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}</div>
              <div><div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800 }}>{savedUser.name}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{savedUser.role === "superadmin" ? "👑 Super Admin" : savedUser.role === "admin" ? "🔑 Admin" : "👷 Employé"}</div></div>
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 24px", width: "100%" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Code PIN</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 36, fontWeight: 800, color: "var(--accent)", letterSpacing: 8 }}>{savedUser.pin}</div>
              </div>
              {savedUser.phone ? <button className="btn btn-green" style={{ width: "100%", justifyContent: "center", fontSize: 15 }} onClick={sendWhatsApp}>📲 Envoyer via WhatsApp</button> : <div style={{ fontSize: 12, color: "var(--muted)" }}>Communicquez le PIN manuellement : <strong style={{ color: "var(--accent)", fontSize: 18, letterSpacing: 4 }}>{savedUser.pin}</strong></div>}
            </div>
          )}
        </div>
        <div className="modal-footer">{!saved ? <><button className="btn btn-ghost" onClick={onClose}>{tx.cancel}</button><button className="btn btn-primary" disabled={!form.name.trim() || form.phone.trim().length < 7 || (form.role === "director" ? (!form.email.trim() || !form.email.includes("@")) : form.pin.length !== 4)} onClick={handleSave}>Créer le profil</button></> : <button className="btn btn-ghost" onClick={onClose}>Fermer</button>}</div>
      </div>
    </div>
  );
}

// ─── CHANTIER PAGE ────────────────────────────────────────────────────────────
const CHANTIER_COLORS = ["#3a8ef6","#27c97a","#f5a623","#e84040","#9b59b6","#e67e22","#1abc9c","#e91e8c"];
function ChantierPage({ chantiers, tools, users, addChantier, deleteChantier, tx }) {
  const [newName, setNewName] = useState(""), [newColor, setNewColor] = useState(CHANTIER_COLORS[0]);
  return (
    <>
      <div className="topbar"><h2>{tx.chantiers}</h2></div>
      <div className="content">
        <div style={{ background: "var(--surface)", border: "1px dashed var(--accent)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800, color: "var(--accent)", marginBottom: 12 }}>🏗 {tx.newSite}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder={tx.siteName} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && newName.trim() && (addChantier(newName, newColor), setNewName(""))} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{tx.colorLabel} :</span>
              {CHANTIER_COLORS.map(c => <button key={c} onClick={() => setNewColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: newColor === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer" }} />)}
            </div>
            <button className="btn btn-primary" disabled={!newName.trim()} onClick={() => { addChantier(newName, newColor); setNewName(""); }}>{tx.createSite}</button>
          </div>
        </div>
        {chantiers.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>{tx.noSiteMsg}</div>}
        <div className="cards-grid">
          {chantiers.map(c => {
            const toolsOnSite = tools.filter(t => t.location === c.name && t.status === "assigned");
            const empIds = [...new Set(toolsOnSite.map(t => t.assignedTo))];
            const emps = empIds.map(id => users.find(u => u.id === id)).filter(Boolean);
            const isActive = toolsOnSite.length > 0;
            return (
              <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: `4px solid ${c.color}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                    <div><div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800 }}>{c.name}</div><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block", background: isActive ? "rgba(39,201,122,.15)" : "rgba(120,120,140,.12)", color: isActive ? "var(--green)" : "var(--muted)" }}>{isActive ? `🟢 ${tx.active2Label}` : `⚪ ${tx.inactive2Label}`}</span></div>
{!c.isTransit && c.name !== "Transit" && <button onClick={() => deleteChantier(c.id)} style={{ background: isActive ? "rgba(120,120,140,.1)" : "rgba(232,82,10,.1)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: isActive ? "not-allowed" : "pointer", fontSize: 15, opacity: isActive ? .4 : 1 }}>🗑</button>}
                  </div>
                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>{`🔧 ${tx.tools} (${toolsOnSite.length})`}</div>
                    {toolsOnSite.length === 0 ? <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>{tx.noTool}</div> : toolsOnSite.map(t => <div key={t.id} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}><span>{t.photo}</span><span>{t.name}</span></div>)}
                  </div>
                  {emps.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, width: "100%", marginBottom: 2 }}>{`👷 ${tx.employees2}`}</div>
                      {emps.map(p => <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(58,142,246,.12)", border: "1px solid rgba(58,142,246,.2)", borderRadius: 20, padding: "3px 10px" }}><div style={{ width: 18, height: 18, borderRadius: 5, background: "var(--blue)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.avatar}</div><span style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600 }}>{p.name.split(" ")[0]}</span></div>)}
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

// ─── MOVE PANEL MODAL — FIX #1 db en props ───────────────────────────────────
function MovePanelModal({ selectedIds, tools, viewers, users, chantiers, currentUser, db, onClose, assignTool, showToast, sendRequest, isAdminUser }) {
  const tx = getTx();
  const [action, setAction] = useState(""), [viewerId, setViewerId] = useState(""), [chantier, setChantier] = useState(""), [note, setNote] = useState(""), [loading, setLoading] = useState(false), [done, setDone] = useState(false);
  const selectedTools = tools.filter(t => selectedIds.includes(t.id));
  const isAdmin = isAdminUser || ["admin","director","superadmin"].includes(currentUser?.role);

  const handleMove = async () => {
    if (!action || (action === "out" && (!viewerId || !chantier))) return;
    setLoading(true);
    if (isAdmin) {
      // Admin/Directeur — transfert direct immédiat
      for (const tool of selectedTools) {
        if (action === "out") await assignTool(tool.id, viewerId, chantier, "out");
        else if (action === "in") await assignTool(tool.id, null, null, "in");
        // Les transferts sont maintenant directs pour tous les profils
        else if (action === "nonfunctional") {
          await setDoc(doc(db, "tools", String(tool.id)), { ...tool, status: "nonfunctional", history: [...(tool.history || []), { date: new Date().toLocaleDateString("fr-MU"), action: `🔴 Déclaré non fonctionnel — par ${currentUser.name}`, by: currentUser.name }] });
        }
      }
      showToast(`✅ ${selectedIds.length} outil${selectedIds.length > 1 ? "s" : ""} transféré${selectedIds.length > 1 ? "s" : ""} !`);
    } else {
      // Employé — envoie une demande pour chaque outil
      for (const tool of selectedTools) {
        await sendRequest({
          type: action === "out" ? "transfer" : action === "in" ? "return" : "nonfunctional",
          toolId: tool.id, toolName: tool.name, toolLocation: tool.location,
          targetViewerId: action === "out" ? viewerId : null,
          targetViewerName: action === "out" ? (viewers.find(v => v.id === viewerId)?.name || "") : null,
          targetChantier: action === "out" ? chantier : null,
          note: note || "",
        });
      }
      showToast(`📨 ${selectedIds.length} demande${selectedIds.length > 1 ? "s" : ""} envoyée${selectedIds.length > 1 ? "s" : ""} !`);
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>{isAdmin ? `↗ ${tx.transfer}` : `📋 ${tx.groupRequest}`} — {selectedIds.length} outil{selectedIds.length > 1 ? "s" : ""}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {done ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{isAdmin ? "✅" : "📨"}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: isAdmin ? "var(--green)" : "var(--accent)" }}>
                {isAdmin ? tx.transferNow + " ✅" : tx.requestSent}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                {isAdmin ? tx.toolsOnSiteLabel + "." : tx.adminWillProcess}
              </div>
            </div>
          ) : (
            <>
              {/* Info rôle */}
              <div style={{ background: isAdmin ? "rgba(58,142,246,.1)" : "rgba(245,166,35,.1)", border: `1px solid ${isAdmin ? "rgba(58,142,246,.3)" : "rgba(245,166,35,.3)"}`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: isAdmin ? "var(--blue)" : "var(--accent)", fontWeight: 600 }}>
                {isAdmin ? `🔑 ${tx.directTransfer}` : `👷 ${tx.needsApproval}`}
              </div>

              {/* Outils {tx.selected2}s */}
              <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>{tx.tools} ({selectedIds.length})</div>
                {selectedTools.map(t => <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ fontSize: 18 }}>{t.photo}</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📍 {t.location}</div></div></div>)}
              </div>

              {/* Actions */}
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--muted)" }}>{tx.requestType} :</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[
                  { val: "out", label: `🔄 ${tx.transfer}`, color: "var(--blue)" },
                  { val: "in", label: `🏠 ${tx.returnStore}`, color: "var(--green)" },
                  { val: "nonfunctional", label: `🔴 ${tx.nonfunctional}`, color: "#f07030" }
                ].map(a => (
                  <button key={a.val} onClick={() => setAction(a.val)} style={{ padding: "12px 16px", borderRadius: 10, border: `2px solid ${action === a.val ? a.color : "var(--border)"}`, background: action === a.val ? a.color + "22" : "var(--surface)", color: action === a.val ? a.color : "var(--text)", fontWeight: 700, fontSize: 13, textAlign: "left", cursor: "pointer" }}>{a.label}</button>
                ))}
              </div>

              {action === "out" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                  <select className="form-input" value={viewerId} onChange={e => setViewerId(e.target.value)}>
                    <option value="">— Confier à —</option>
                    {(isAdminUser ? (users || []).filter(u => u.companyId === currentUser?.companyId && ["viewer","admin","director"].includes(u.role)) : (viewers || [])).map(u => (
                      <option key={u.id} value={u.id}>{u.name}{String(u.id) === String(currentUser?.id) ? " (moi)" : ""} - {u.role === "viewer" ? "Employe" : u.role === "admin" ? "Admin" : "Directeur"}</option>
                    ))}
                  </select>
                  <select className="form-input" value={chantier} onChange={e => setChantier(e.target.value)}>
                    <option value="">{tx.chooseSite}</option>
                    {chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Note */}
              <div className="form-group">
                <label className="form-label">{tx.noteOptional}</label>
                <textarea className="form-input" rows={2} placeholder={tx.optNote} value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </>
          )}
        </div>
        {!done && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>{tx.cancel}</button>
            <button className="btn btn-primary" disabled={!action || (action === "out" && (!viewerId || !chantier)) || loading} onClick={handleMove}>
              {loading ? "⏳..." : isAdmin ? `✅ ${tx.transferNow} (${selectedIds.length})` : `📨 ${tx.sendReq} (${selectedIds.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REQUEST ACTIONS ──────────────────────────────────────────────────────────
function RequestActions({ request: r, tool, onApprove, onRefuse }) {
  const tx = getTx();
  const [note, setNote] = useState(""), [mode, setMode] = useState(null);
  const [loadingApprove, triggerApprove] = useLoadingBtn();
  const [loadingRefuse, triggerRefuse] = useLoadingBtn();
  if (mode === "refuse") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea className="form-input" rows={2} placeholder="Motif du refus..." value={note} onChange={e => setNote(e.target.value)} />
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>{tx.cancel}</button>
        <button className={`btn btn-danger btn-sm ${loadingRefuse ? "loading" : ""}`} disabled={loadingRefuse} onClick={() => triggerRefuse(() => onRefuse(note))}>{loadingRefuse ? "⏳..." : "Confirmer le refus"}</button>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input className="form-input" style={{ flex: 1, fontSize: 12 }} placeholder={tx.optNote} value={note} onChange={e => setNote(e.target.value)} />
      <button className={`btn btn-green btn-sm ${loadingApprove ? "loading" : ""}`} disabled={loadingApprove} onClick={() => triggerApprove(() => onApprove(note))}>{loadingApprove ? "⏳..." : `✅ ${tx.approve}`}</button>
      <button className="btn btn-danger btn-sm" onClick={() => setMode("refuse")}>{`❌ ${tx.refuse}`}</button>
    </div>
  );
}

// ─── PARC TOOL ROW — FIX #3 db en props ──────────────────────────────────────
function ParcToolRow({ tool, assignee, isMyTool, currentUser, db, onAsk }) {
  const [asking, setAsking] = useState(false), [msg, setMsg] = useState("");
  const sendAsk = async () => {
    if (!msg.trim()) return;
    const id = String(Date.now());
    // FIX #3 — db disponible via props
    await setDoc(doc(db, "requests", id), { id, type: "employe-ask", status: "pending", from: effectiveUser.id, fromName: effectiveUser.name, toolId: String(tool.id), toolName: tool.name, toolLocation: tool.location, targetViewerId: String(tool.assignedTo), targetViewerName: assignee?.name, note: msg, text: `💬 ${currentUser.name} → ${assignee?.name} : "${msg}" (${tool.name})`, date: new Date().toISOString() });
    setMsg(""); setAsking(false);
  };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{tool.photo}</span>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{tool.name}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📍 {tool.location}{assignee && <span style={{ color: "var(--blue)", marginLeft: 6 }}>👷 {assignee.name}</span>}</div></div>
        {isMyTool ? <span style={{ fontSize: 11, background: "rgba(245,166,35,.2)", color: "var(--accent)", padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>Le mien</span> : <button className="btn btn-blue btn-sm" onClick={() => setAsking(!asking)}>💬 Demander</button>}
      </div>
      {asking && !isMyTool && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", display: "flex", gap: 8 }}>
          <input className="form-input" style={{ flex: 1, fontSize: 12 }} placeholder={`Message à ${assignee?.name}...`} value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAsk()} />
          <button className="btn btn-primary btn-sm" onClick={sendAsk} disabled={!msg.trim()}>Envoyer</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAsking(false)}>×</button>
        </div>
      )}
    </div>
  );
}

// ─── VIEWER TOOL CARD ─────────────────────────────────────────────────────────
function ViewerToolCard({ tool, currentUser, users, viewers, chantiers, db, onOpen, onRequest }) {
  const tx = getTx();
  const [action, setAction] = useState(null), [targetViewer, setTargetViewer] = useState(""), [targetChantier, setTargetChantier] = useState(""), [note, setNote] = useState("");
  const otherViewers = viewers.filter(v => String(v.id) !== String(currentUser.id));
  const submit = (type) => { const targetName = targetViewer ? users.find(u => String(u.id) === String(targetViewer))?.name : null; onRequest({ type, toolId: tool.id, toolName: tool.name, toolLocation: tool.location, targetViewerId: targetViewer || null, targetViewerName: targetName, targetChantier: targetChantier || null, note }); setAction(null); setNote(""); setTargetViewer(""); setTargetChantier(""); };
  return (
    <div className={`tool-card${tool.status === "nonfunctional" ? " nonfunctional" : ""}`}>
      {tool.photoUrl ? <img src={tool.photoUrl} alt={tool.name} className="tool-photo-card" onClick={onOpen} style={{ cursor: "pointer" }} /> : <div className="tool-photo-placeholder" onClick={onOpen} style={{ cursor: "pointer" }}><span className="big-emoji">{tool.photo}</span><span style={{ fontSize: 11 }}>Aucune photo</span></div>}
      <div className="tool-card-top" onClick={onOpen} style={{ cursor: "pointer" }}><div className="tool-meta" style={{ width: "100%" }}><div className="tool-name">{tool.name}</div>{tool.ref && <div className="tool-ref">🏭 {tool.ref}</div>}</div></div>
      <div className="tool-card-body" onClick={onOpen} style={{ cursor: "pointer" }}><div className="tool-desc">{tool.description}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>📍 {tool.location}</div>{tool.price && <div style={{ marginTop: 4 }}><span className="price-tag">🇲🇺 Rs {tool.price.toLocaleString("fr-MU")}</span></div>}</div>
      {!action && (<div style={{ padding: "10px 12px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid var(--border)" }}><button className="btn btn-blue btn-sm" onClick={() => setAction("transfer")}>{`🔄 ${tx.transfer}`}</button><button className="btn btn-green btn-sm" onClick={() => setAction("return")}>{`🏠 ${tx.returnStore2}`}</button><button className="btn btn-sm" style={{ background: "rgba(232,82,10,.2)", color: "#f07030" }} onClick={() => setAction("nonfunctional")}>🔴 Non fonctionnel</button></div>)}
      {action === "transfer" && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>🔄 Demande de transfert</div>
          <select className="form-input" value={targetViewer} onChange={e => setTargetViewer(e.target.value)}><option value="">— Vers quel employé ? —</option>{otherViewers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <select className="form-input" value={targetChantier} onChange={e => setTargetChantier(e.target.value)}><option value="">— Vers quel chantier ? —</option>{chantiers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
          <textarea className="form-input" rows={2} placeholder={tx.optNote} value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>📨 Un admin devra approuver</div>
          <div style={{ display: "flex", gap: 6 }}><button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>{tx.cancel}</button><button className="btn btn-blue btn-sm" disabled={!targetViewer || !targetChantier} onClick={() => submit("transfer")}>Envoyer</button></div>
        </div>
      )}
      {action === "return" && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>🏠 Retour au store</div>
          <textarea className="form-input" rows={2} placeholder={tx.optNote} value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>📨 Un admin devra approuver</div>
          <div style={{ display: "flex", gap: 6 }}><button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>{tx.cancel}</button><button className="btn btn-green btn-sm" onClick={() => submit("return")}>Envoyer</button></div>
        </div>
      )}
      {action === "nonfunctional" && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f07030" }}>🔴 Signaler non fonctionnel</div>
          <textarea className="form-input" rows={2} placeholder="Décrivez le problème..." value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--muted)" }}>⚠️ L'outil sera marqué non fonctionnel immédiatement</div>
          <div style={{ display: "flex", gap: 6 }}><button className="btn btn-ghost btn-sm" onClick={() => setAction(null)}>{tx.cancel}</button><button className="btn btn-sm" style={{ background: "rgba(232,82,10,.3)", color: "#f07030" }} onClick={() => submit("nonfunctional")}>Confirmer</button></div>
        </div>
      )}
    </div>
  );
}

// ─── MESSAGES PAGE ────────────────────────────────────────────────────────────
function MessagesPage({ currentUser, users, tools, myTools, db, showToast, tx }) {
  const [tab, setTab] = useState("annonces");
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newText, setNewText] = useState("");
  const threadRef = useRef();
  const isAdmin = ["admin","director","superadmin"].includes(currentUser.role);

  useEffect(() => {
    const isSuperAdmin = ["superadmin"].includes(currentUser.role);
    const unsub = onSnapshot(collection(db, "conversations"), snap => {
      // FIX #D — filtrer par companyId pour éviter qu'une compagnie voie les messages d'une autre
      const all = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      const filtered = isSuperAdmin ? all : all.filter(c => c.companyId === (currentUser.companyId || null));
      setConversations(filtered.sort((a,b) => new Date(b.lastDate) - new Date(a.lastDate)));
    }, err => console.error("Conversations:", err));
    return () => unsub();
  }, []);

  const tabConvs = conversations.filter(c => c.type === (tab === "annonces" ? "annonce" : "admin"));
  const selectedConv = conversations.find(c => c.id === selected);
  const unreadAnnonces = conversations.filter(c => c.type === "annonce" && c.messages?.some(m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id))).length;
  const unreadAdmins = conversations.filter(c => c.type === "admin" && c.messages?.some(m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id))).length;

  const createConversation = async () => {
    if (!newText.trim() || !newSubject.trim()) return;
    const id = String(Date.now());
    const msg = { id: String(Date.now() + 1), from: effectiveUser.id, fromName: effectiveUser.name, fromAvatar: currentUser.avatar, fromRole: currentUser.role, text: newText, date: new Date().toISOString(), readBy: [String(currentUser.id)] };
    // FIX #E — companyId stocké pour que le filtre #D fonctionne sur les nouvelles conversations
    await setDoc(doc(db, "conversations", id), { id, subject: newSubject, type: tab === "annonces" ? "annonce" : "admin", createdBy: currentUser.id, createdByName: currentUser.name, companyId: currentUser.companyId || null, messages: [msg], lastDate: new Date().toISOString(), lastText: newText });
    setNewSubject(""); setNewText(""); setNewConvOpen(false); setSelected(id);
    showToast("📨 Message envoyé !");
  };

  const [replyTo, setReplyTo] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const photoRef = useRef();
  const handlePhoto = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => setPhotoData(ev.target.result); reader.readAsDataURL(file); };

  const sendReply = async () => {
    if (!replyText.trim() && !photoData) return;
    if (!selectedConv || (selectedConv.type === "annonce" && !isAdmin)) return;
    const msg = { id: String(Date.now()), from: effectiveUser.id, fromName: effectiveUser.name, fromAvatar: currentUser.avatar, fromRole: currentUser.role, text: replyText, photo: photoData || null, replyTo: replyTo ? { id: replyTo.id, fromName: replyTo.fromName, text: replyTo.text?.slice(0, 60) } : null, date: new Date().toISOString(), readBy: [String(currentUser.id)] };
    await setDoc(doc(db, "conversations", selectedConv.id), { ...selectedConv, messages: [...(selectedConv.messages || []), msg], lastDate: new Date().toISOString(), lastText: replyText || "📷 Photo" });
    setReplyText(""); setPhotoData(null); setReplyTo(null);
    setTimeout(() => threadRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 100);
  };

  useEffect(() => {
    if (!selectedConv) return;
    const needsUpdate = selectedConv.messages?.some(m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id));
    if (needsUpdate) {
      const updated = selectedConv.messages.map(m => ({ ...m, readBy: m.readBy?.includes(String(currentUser.id)) ? m.readBy : [...(m.readBy || []), String(currentUser.id)] }));
      setDoc(doc(db, "conversations", selectedConv.id), { ...selectedConv, messages: updated });
    }
  }, [selected, selectedConv]);

  const fmtT = (d) => new Date(d).toLocaleString("fr-MU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (selected && selectedConv) {
    const canReply = isAdmin;
    return (
      <>
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>← Retour</button>
            <div><h2 style={{ fontSize: 17 }}>{selectedConv.subject}</h2><div style={{ fontSize: 11, color: "var(--muted)" }}>{selectedConv.type === "annonce" ? `📢 ${tx.visibleAll}` : `🔑 ${tx.adminMessages}`}</div></div>
          </div>
        </div>
        <div className="content" style={{ display: "flex", flexDirection: "column", height: "calc(100% - 70px)" }}>
          <div ref={threadRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
            {(selectedConv.messages || []).map((m, i) => {
              const isMe = String(m.from) === String(currentUser.id);
              return (
                <div key={m.id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "82%", background: isMe ? "rgba(58,142,246,.15)" : "var(--surface)", border: `1px solid ${isMe ? "rgba(58,142,246,.3)" : "var(--border)"}`, borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px", overflow: "hidden" }}>
                    {m.replyTo && (<div style={{ background: isMe ? "rgba(58,142,246,.2)" : "var(--surface2)", borderLeft: "3px solid var(--accent)", padding: "6px 10px", margin: "8px 10px 0", borderRadius: 6 }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>{m.replyTo.fromName}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{m.replyTo.text}</div></div>)}
                    <div style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: ["admin","director","superadmin"].includes(m.fromRole) ? "var(--accent)" : "var(--blue)", color: ["admin","director","superadmin"].includes(m.fromRole) ? "#000" : "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.fromAvatar}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? "var(--blue)" : "var(--accent)" }}>{m.fromName}</span>
                        {["admin","director","superadmin"].includes(m.fromRole) && <span style={{ fontSize: 9, background: "rgba(245,166,35,.2)", color: "var(--accent)", padding: "1px 5px", borderRadius: 6, fontWeight: 700 }}>ADMIN</span>}
                      </div>
                      {m.photo && <img src={m.photo} alt="photo" style={{ width: "100%", maxWidth: 280, borderRadius: 8, marginBottom: 6, display: "block", cursor: "pointer" }} onClick={() => window.open(m.photo, "_blank")} />}
                      {m.text && <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap" }}>{m.text}</div>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 8 }}>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>{fmtT(m.date)}</div>
                        {canReply && <button onClick={() => setReplyTo(m)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>↩ Répondre</button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {canReply ? (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              {replyTo && (<div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 8, borderLeft: "3px solid var(--accent)" }}><div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>↩ {replyTo.fromName}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{replyTo.text?.slice(0, 60)}</div></div><button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 16, cursor: "pointer" }}>×</button></div>)}
              {photoData && (<div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}><img src={photoData} alt="preview" style={{ height: 80, borderRadius: 8, objectFit: "cover" }} /><button onClick={() => setPhotoData(null)} style={{ position: "absolute", top: -6, right: -6, background: "var(--red)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div>)}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <button onClick={() => photoRef.current.click()} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>📷</button>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                <textarea className="form-input" style={{ flex: 1, resize: "none" }} rows={2} placeholder="Écrire un message... (Entrée pour envoyer)" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }} />
                <button className="btn btn-primary btn-sm" style={{ flexShrink: 0, alignSelf: "flex-end" }} onClick={sendReply} disabled={!replyText.trim() && !photoData}>➤</button>
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>Entrée pour envoyer · Shift+Entrée pour saut de ligne</div>
            </div>
          ) : (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, textAlign: "center", fontSize: 12, color: "var(--muted)", fontStyle: "italic", padding: 16 }}>
              {`📢 ${tx.readOnly}`}<br/>
              <span style={{ fontSize: 11 }}>Pour toute question, contactez votre Directeur ou Admin</span>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar"><h2>💬 {tx.messages}</h2>{isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setNewConvOpen(true)}>{tx.newBtn}</button>}</div>
      <div className="content">
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button className={`filter-btn ${tab === "annonces" ? "active" : ""}`} onClick={() => { setTab("annonces"); setSelected(null); setNewConvOpen(false); }}>
            📢 {tx.announcements} {conversations.filter(c => c.type === "annonce").length > 0 && `(${conversations.filter(c => c.type === "annonce").length})`}
            {unreadAnnonces > 0 && <span style={{ background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{unreadAnnonces}</span>}
          </button>
          {isAdmin && (
            <button className={`filter-btn ${tab === "admins" ? "active" : ""}`} onClick={() => { setTab("admins"); setSelected(null); setNewConvOpen(false); }}>
              🔑 Admins {conversations.filter(c => c.type === "admin").length > 0 && `(${conversations.filter(c => c.type === "admin").length})`}
              {unreadAdmins > 0 && <span style={{ background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{unreadAdmins}</span>}
            </button>
          )}
        </div>
        {newConvOpen && isAdmin && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800, color: "var(--accent)", marginBottom: 10 }}>{tab === "annonces" ? `📢 ${tx.newAnnouncement}` : `🔑 ${tx.adminMsg}`}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="form-input" placeholder={tx.subject + " *"} value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <textarea className="form-input" rows={3} placeholder={tx.yourMessage} value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); createConversation(); } }} />
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{tab === "annonces" ? tx.visibleAll : tx.visibleAdmins}</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setNewConvOpen(false)}>{tx.cancel}</button>
                <button className="btn btn-primary btn-sm" disabled={!newSubject.trim() || !newText.trim()} onClick={createConversation}>{tx.send}</button>
              </div>
            </div>
          </div>
        )}
        {tabConvs.length === 0 && !newConvOpen && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{tab === "annonces" ? "📢" : "🔑"}</div>
            <div>{tab === "annonces" ? tx.noAnnouncement : tx.noAdminMsg}</div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tabConvs.map(c => {
            const hasUnread = c.messages?.some(m => !m.readBy?.includes(String(currentUser.id)) && String(m.from) !== String(currentUser.id));
            const lastMsg = c.messages?.[c.messages.length - 1];
            return (
              <div key={c.id} onClick={() => setSelected(c.id)} style={{ background: "var(--surface)", border: `1px solid ${hasUnread ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: 14, cursor: "pointer", transition: "all .15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {hasUnread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: hasUnread ? 800 : 600 }}>{c.subject}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{tx.from} {c.createdByName} · {c.messages?.length || 0} message{(c.messages?.length || 0) > 1 ? "s" : ""}</div>
                    {lastMsg && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>{lastMsg.fromName}</strong> : {lastMsg.text}</div>}
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
function CompaniesPage({ companies, users, tools, chantiers, requests, db, currentUser, showToast, onAdminCreated, onSupervise, tx }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState(""), [newColor, setNewColor] = useState("#f5a623"), [newExpiry, setNewExpiry] = useState(""), [newContactEmail, setNewContactEmail] = useState(currentUser.email || ""), [newPhone, setNewPhone] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [adminForm, setAdminForm] = useState({ name: "", phone: "", email: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(null);
  const [editingExpiry, setEditingExpiry] = useState(null), [editExpiryDate, setEditExpiryDate] = useState(""), [editContactEmail, setEditContactEmail] = useState("");
  const APP_URL = "tool-track-rosy.vercel.app";
  const companyFieldStyle = (val) => ({ borderColor: formSubmitted && !val?.trim() ? "var(--red)" : undefined, boxShadow: formSubmitted && !val?.trim() ? "0 0 0 2px rgba(232,82,10,.2)" : undefined });
  const getDaysUntilExpiry = (expiryDate) => { if (!expiryDate) return null; const today = new Date(); today.setHours(0,0,0,0); const expiry = new Date(expiryDate); expiry.setHours(0,0,0,0); return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)); };

  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    companies.forEach(async c => {
      if (!c.expiryDate) return;
      const expiry = new Date(c.expiryDate); expiry.setHours(0,0,0,0);
      if (expiry <= today && c.active !== false) await setDoc(doc(db, "companies", c.id), { ...c, active: false, suspendedAt: new Date().toISOString(), suspendReason: "expiration" });
    });
  }, [companies]);

  const sendExpiryWarningWhatsApp = (company, adminUser, daysLeft) => {
    const contactEmail = company.contactEmail || currentUser.email || "";
    const msg = encodeURIComponent(`⚠️ *TOOL TRACK — Expiration*\n\nBonjour ${adminUser?.name || ""},\n\nVotre accès pour *${company.name}* expirera dans *${daysLeft} jour${daysLeft > 1 ? "s" : ""}*.\n\nEnvoyez votre preuve de paiement à :\n📧 *${contactEmail}*\n\nhttps://${APP_URL}`);
    const phone = adminUser?.phone?.replace(/\s/g,"").replace(/^\+/,"") || "";
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  };

  const createCompany = async () => {
    setFormSubmitted(true);
    if (!newName.trim() || !newExpiry || !newContactEmail.trim() || newPhone.trim().length < 7) return;
    const id = String(Date.now());
    // Générer un code unique — vérifier qu'il n'existe pas déjà
    let companyPin;
    let attempts = 0;
    do {
      companyPin = String(Math.floor(1000 + Math.random() * 9000));
      attempts++;
    } while (companies.some(c => c.companyPin === companyPin) && attempts < 50);
    // Si après 50 tentatives on n'a pas trouvé un code unique avec 4 chiffres,
    // utiliser 6 chiffres pour plus de possibilités
    if (companies.some(c => c.companyPin === companyPin)) {
      companyPin = String(Math.floor(100000 + Math.random() * 900000));
    }
    await setDoc(doc(db, "companies", id), { id, name: newName.trim(), color: newColor, active: true, createdAt: new Date().toISOString(), createdBy: currentUser.id, expiryDate: newExpiry || null, contactEmail: newContactEmail || currentUser.email || "", phone: newPhone.trim(), companyPin });
    // Créer automatiquement le chantier "Transit" pour cette compagnie
    const transitId = id + "_transit";
    await setDoc(doc(db, "chantiers", transitId), { id: transitId, name: "Transit", color: "#f5a623", companyId: id, createdAt: new Date().toISOString(), isTransit: true });
    setNewName(""); setNewExpiry(""); setShowForm(false); setFormSubmitted(false);
    showToast(`🏢 Compagnie créée ! Code d'accès : ${companyPin}`);
  };

  const saveExpiry = async (company) => {
    await setDoc(doc(db, "companies", company.id), { ...company, expiryDate: editExpiryDate || null, contactEmail: editContactEmail || company.contactEmail || "" });
    setEditingExpiry(null); showToast("✅ Mise à jour !");
  };

  const toggleCompany = async (company) => { await setDoc(doc(db, "companies", company.id), { ...company, active: !company.active }); showToast(company.active ? `⏸️ ${tx.suspended2}` : `✅ ${tx.reactivate2}`); };

  // FIX #8 — deleteCompany supprime aussi les conversations
  const deleteCompany = async (company) => {
    const companyUsers = users.filter(u => u.companyId === company.id);
    for (const u of companyUsers) await deleteDoc(doc(db, "users", String(u.id)));
    const companyTools = tools.filter(t => t.companyId === company.id);
    for (const t of companyTools) await deleteDoc(doc(db, "tools", String(t.id)));
    const companyChantiers = chantiers.filter(c => c.companyId === company.id);
    for (const c of companyChantiers) await deleteDoc(doc(db, "chantiers", String(c.id)));
    const companyRequests = requests.filter(r => r.companyId === company.id);
    for (const r of companyRequests) await deleteDoc(doc(db, "requests", String(r.id)));
    // FIX #8 — conversations nettoyées
    try {
      const convSnap = await getDocs(collection(db, "conversations"));
      for (const d of convSnap.docs.filter(d => d.data().companyId === company.id)) await deleteDoc(doc(db, "conversations", d.id));
    } catch(e) {}
    await deleteDoc(doc(db, "companies", company.id));
    showToast(`🗑 "${company.name}" supprimée`);
  };

  const createFirstAdmin = async (company) => {
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.phone.trim() || adminForm.phone.trim().length < 7) return;
    const initials = adminForm.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    // Récupérer le companyPin frais depuis la liste companies
    const freshCompany = companies.find(c => c.id === company.id) || company;
    const companyPin = freshCompany.companyPin || company.companyPin || "";

    try {
      // On crée uniquement le profil Firestore
      // Le Directeur créera son propre compte Firebase Auth à la première connexion
      const userId = String(Date.now());
      const newAdmin = {
        id: userId,
        name: adminForm.name,
        role: "director",
        avatar: initials,
        phone: adminForm.phone || "",
        email: adminForm.email.trim(),
        pin: "",
        companyId: company.id,
        companyName: company.name,
        companyPin: companyPin,
        authUid: null,
        pendingAuth: true  // Le Directeur doit créer son mot de passe à la 1ère connexion
      };

      await setDoc(doc(db, "users", userId), newAdmin);
      onAdminCreated({ ...newAdmin });
      showToast("✅ Directeur créé — invitation WhatsApp envoyée !");
      setAdminForm({ name: "", phone: "", email: "" });
      setCreatingAdmin(null);
    } catch(e) {
      showToast("❌ Erreur : " + e.message);
    }
  };

  return (
    <>
      <div className="topbar"><h2>🏢 {tx.companies}</h2><button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>{tx.newCompany2}</button></div>
      <div className="content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[{ label: tx.total, count: companies.length, color: "var(--accent)" }, { label: "🟢 " + tx.actives, count: companies.filter(c => c.active !== false).length, color: "var(--green)" }, { label: "⏸️ " + tx.suspended, count: companies.filter(c => c.active === false).length, color: "var(--red)" }].map(s => (
            <div key={s.label} style={{ background: "var(--surface)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {showForm && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800, color: "var(--accent)", marginBottom: 12 }}>🏢 {tx.newCompany}</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><input className="form-input" style={companyFieldStyle(newName)} placeholder={tx.editName} value={newName} onChange={e => setNewName(e.target.value)} />{formSubmitted && !newName.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Nom obligatoire</div>}</div>
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 44, height: 44, borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", padding: 2 }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>📅 Date d'expiration *</label><input className="form-input" style={companyFieldStyle(newExpiry)} type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />{formSubmitted && !newExpiry && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Date obligatoire</div>}</div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>📧 Email contact *</label><input className="form-input" style={companyFieldStyle(newContactEmail)} type="email" placeholder="votre@email.com" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} />{formSubmitted && !newContactEmail.trim() && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Email obligatoire</div>}</div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>📞 Téléphone * (min. 7 chiffres)</label><input className="form-input" style={companyFieldStyle(newPhone.trim().length >= 7 ? newPhone : "")} type="tel" placeholder="+230 5XXX XXXX" value={newPhone} onChange={e => setNewPhone(e.target.value)} />{formSubmitted && newPhone.trim().length < 7 && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>⚠️ Téléphone obligatoire (min. 7 chiffres)</div>}</div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setFormSubmitted(false); }}>{tx.cancel}</button><button className="btn btn-primary btn-sm" disabled={!newName.trim() || !newExpiry || !newContactEmail.trim() || !newContactEmail.includes("@") || newPhone.trim().length < 7} onClick={createCompany}>{tx.create}</button></div>
          </div>
        )}
        {companies.length === 0 && !showForm && <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}><div style={{ fontSize: 48, marginBottom: 8 }}>🏢</div><div>{tx.noCompany}</div></div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {companies.map(company => {
            const compUsers = users.filter(u => u.companyId === company.id);
            const compTools = tools.filter(t => t.companyId === company.id);
            const compAdmins = compUsers.filter(u => ["admin","director"].includes(u.role));
            const isExpanded = expandedId === company.id;
            const isActive = company.active !== false;
            const days = getDaysUntilExpiry(company.expiryDate);
            return (
              <div key={company.id} style={{ background: "var(--surface)", border: `1px solid ${isActive ? "var(--border)" : "rgba(232,82,10,.3)"}`, borderRadius: 12, overflow: "hidden", opacity: isActive ? 1 : 0.7 }}>
                <div style={{ height: 5, background: company.color || "var(--accent)" }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: company.color || "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 800 }}>{company.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span>👷 {compUsers.length} · 🔧 {compTools.length}</span>
                        {company.companyPin && <span style={{ background: "var(--surface2)", padding: "1px 8px", borderRadius: 20, fontFamily: "var(--font-head)", fontWeight: 800, color: "var(--accent)", letterSpacing: 3 }}>🔐 {company.companyPin}</span>}
                        {!isActive && <span style={{ color: "var(--red)", fontWeight: 700 }}>⏸️ {tx.suspended2}</span>}
                        {company.expiryDate && days !== null && (days < 0 ? <span style={{ background: "rgba(232,82,10,.2)", color: "var(--red)", fontWeight: 700, padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>{`❌ ${tx.expiredLabel}`}</span> : days <= 5 ? <span style={{ background: "rgba(245,166,35,.2)", color: "var(--accent)", fontWeight: 700, padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>⚠️ {days}j</span> : <span style={{ background: "rgba(39,201,122,.15)", color: "var(--green)", fontWeight: 600, padding: "1px 8px", borderRadius: 20, fontSize: 11 }}>📅 {new Date(company.expiryDate).toLocaleDateString("fr-MU")}</span>)}
                      </div>
                      {days !== null && days <= 5 && compUsers.filter(u => u.role === "director").length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                          {compUsers.filter(u => u.role === "director").map(d => <button key={d.id} className="btn btn-sm" style={{ background: "rgba(37,211,102,.2)", color: "#25d366", fontSize: 11, padding: "3px 10px" }} onClick={e => { e.stopPropagation(); sendExpiryWarningWhatsApp(company, d, days); }}>📲 Rappel → {d.name}</button>)}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(isExpanded ? null : company.id)}>{isExpanded ? "▲" : "▼"}</button>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>{`📅 ${tx.expiryContact}`}</div>
                        {editingExpiry === company.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input className="form-input" type="date" value={editExpiryDate} onChange={e => setEditExpiryDate(e.target.value)} style={{ flex: 1 }} />
                              <input className="form-input" type="email" value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)} style={{ flex: 1 }} />
                            </div>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><button className="btn btn-ghost btn-sm" onClick={() => setEditingExpiry(null)}>{tx.cancel}</button><button className="btn btn-primary btn-sm" onClick={() => saveExpiry(company)}>✅ {tx.saveBtn}</button></div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div><div style={{ fontSize: 12 }}>{company.expiryDate ? `📅 ${new Date(company.expiryDate).toLocaleDateString("fr-MU")}` : `📅 ${tx.noDate}`}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📧 {company.contactEmail || tx.notDefined}</div></div>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingExpiry(company.id); setEditExpiryDate(company.expiryDate || ""); setEditContactEmail(company.contactEmail || ""); }}>✏️</button>
                          </div>
                        )}
                      </div>
                      {[{ role: "director", label: `🏢 ${tx.directors}`, color: "#9b59b6" }, { role: "admin", label: `🔑 ${tx.admins}`, color: "var(--accent)" }, { role: "viewer", label: "👷 " + tx.employee, color: "var(--blue)" }].map(({ role, label, color }) => {
                        const roleUsers = compUsers.filter(u => u.role === role);
                        return (
                          <div key={role} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>{label} ({roleUsers.length})</div>
                            {roleUsers.length === 0 ? <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", paddingLeft: 8 }}>{tx.none}</div> : roleUsers.map(u => (
                              <div key={u.id} style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: color, color: role === "viewer" ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{u.avatar}</div>
                                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{u.name}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>🔑 {u.pin}{u.phone ? ` · 📞 ${u.phone}` : ""}</div></div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {onSupervise && <button className="btn btn-blue btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => onSupervise(u)}>👁 Voir</button>}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>{`${tx.addDirector2} (${compAdmins.length}/30)`}</div>
                        {compAdmins.length >= 30 ? <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>{tx.maxReached}</div> : creatingAdmin === company.id ? (
                          <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                            <input className="form-input" placeholder={tx.editName} value={adminForm.name} onChange={e => setAdminForm(p => ({ ...p, name: e.target.value }))} />
                            <div style={{ display: "flex", gap: 8 }}><input className="form-input" placeholder="📞 Téléphone * (min. 7 chiffres)" type="tel" value={adminForm.phone} onChange={e => setAdminForm(p => ({ ...p, phone: e.target.value }))} /><input className="form-input" placeholder="Email * (invitation envoyée)" type="email" value={adminForm.email} onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))} /></div>
                            
                            
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="btn btn-ghost btn-sm" onClick={() => setCreatingAdmin(null)}>{tx.cancel}</button><button className="btn btn-primary btn-sm" disabled={!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.email.includes("@") || adminForm.phone.trim().length < 7} onClick={() => createFirstAdmin(company)}>{tx.create}</button></div>
                          </div>
                        ) : <button className="btn btn-blue btn-sm" onClick={() => setCreatingAdmin(company.id)}>{tx.addDirector}</button>}
                      </div>
                      <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className={`btn btn-sm ${isActive ? "btn-danger" : "btn-green"}`} onClick={() => toggleCompany(company)}>{isActive ? `⏸️ ${tx.suspend2}` : `✅ ${tx.reactivate2}`}</button>
                          <button className="btn btn-sm" style={{ background: "rgba(232,82,10,.2)", color: "var(--red)", border: "1px solid rgba(232,82,10,.4)", fontWeight: 700 }} onClick={() => { if (window.confirm(`⚠️ ${tx.deleteBtn} "${company.name}" ?`)) deleteCompany(company); }}>{`🏚 ${tx.deleteBtn}`}</button>
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

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ users, companies, onLogin, db, lang, setLanguage, t }) {
  const [step, setStep] = useState("company"), [selectedCompany, setSelectedCompany] = useState(null), [companyPin, setCompanyPin] = useState(""), [pinError, setPinError] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false), [adminEmail, setAdminEmail] = useState(""), [adminPassword, setAdminPassword] = useState(""), [adminLoading, setAdminLoading] = useState(false), [adminError, setAdminError] = useState(""), [resetSent, setResetSent] = useState(false), [showPwd, setShowPwd] = useState(false);
  const superAdmins = users.filter(u => u.role === "superadmin");

  const handleCompanyPin = (digit) => {
    const newPin = companyPin + digit;
    setCompanyPin(newPin); setPinError(false);
    if (newPin.length === 4) {
      const found = companies.find(c => c.companyPin === newPin);
      if (found && found.active === false) {
        // Compagnie suspendue — vérifier si c'est un Directeur qui essaie de se connecter
        const companyDirectors = companies && users ? users.filter(u => u.companyId === found.id && u.role === "director") : [];
        if (companyDirectors.length > 0) {
          // Il y a un directeur — le laisser passer pour qu'il puisse réactiver
          setSelectedCompany(found);
          setStep("profile");
          setCompanyPin("");
        } else {
          setPinError(true);
          setTimeout(() => { setCompanyPin(""); setPinError(false); }, 3000);
          alert(`⚠️ La compagnie "${found.name}" est temporairement suspendue.

Contactez le SuperAdmin : jdecomarmond.profile@intnet.mu`);
          return;
        }
      } else if (found) { setSelectedCompany(found); setStep("profile"); setCompanyPin(""); }
      else { setPinError(true); setTimeout(() => { setCompanyPin(""); setPinError(false); }, 1000); }
    }
  };

  const handleAdminEmailLogin = async () => {
    if (!adminEmail.trim() || !adminPassword) return;
    setAdminLoading(true); setAdminError("");

    // Chercher le profil par email dans Firestore
    const profileByEmail = users.find(u => u.email?.toLowerCase() === adminEmail.trim().toLowerCase());

    try {
      if (profileByEmail?.pendingAuth) {
        // Première connexion Directeur — essayer de créer, sinon connecter directement
        let uid;
        try {
          const cred = await createUserWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
          uid = cred.user.uid;
        } catch(createErr) {
          if (createErr.code === "auth/email-already-in-use") {
            // Compte Firebase Auth existe déjà — connecter directement
            const cred = await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
            uid = cred.user.uid;
          } else {
            throw createErr;
          }
        }
        // Mettre à jour le profil Firestore
        const updatedProfile = { ...profileByEmail, authUid: uid, id: uid, pendingAuth: false };
        await setDoc(doc(db, "users", uid), updatedProfile);
        if (String(profileByEmail.id) !== uid) {
          await deleteDoc(doc(db, "users", String(profileByEmail.id)));
        }
        onLogin(updatedProfile);
      } else {
        // Connexion normale
        const cred = await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
        const uid = cred.user.uid;
        // Vérifier liste noire
        try {
          const blackDoc = await getDoc(doc(db, "deletedAuthUids", uid));
          if (blackDoc.exists()) { 
            await signOut(auth); 
            setAdminError("❌ Ce compte a été supprimé. Contactez votre administrateur."); 
            setAdminLoading(false); return; 
          }
        } catch(e) {}
        const userProfile = users.find(u => u.authUid === uid || u.id === uid || u.email?.toLowerCase() === adminEmail.trim().toLowerCase());
        if (!userProfile) { await signOut(auth); setAdminError("❌ Profil introuvable. Contactez votre administrateur."); setAdminLoading(false); return; }
        onLogin(userProfile);
      }
    } catch(e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") setAdminError("❌ Email ou mot de passe incorrect.");
      else setAdminError("❌ Erreur : " + e.message);
      setAdminLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!adminEmail.trim()) { setAdminError("Entrez votre email d'abord."); return; }
    try { await sendPasswordResetEmail(auth, adminEmail.trim()); setResetSent(true); setAdminError(""); }
    catch(e) { setAdminError("❌ Impossible d'envoyer le reset. Vérifiez l'email."); }
  };

  if (users.length === 0) {
    return (
      <div className="login-screen"><div className="login-card"><div className="login-title">TOOL TRACK</div><div className="login-sub">Bienvenue ! Créez le premier administrateur.</div>
        <FirstAdminForm onSave={async (u) => { await setDoc(doc(db, "users", String(u.id)), u); onLogin(u); }} />
      </div></div>
    );
  }

  if (showAdminLogin) {
    return (
      <div className="login-screen"><div className="login-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, width: "100%" }}>
          <button onClick={() => { setShowAdminLogin(false); setAdminError(""); setResetSent(false); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
          <div className="login-title" style={{ fontSize: 22, marginBottom: 0 }}>TOOL TRACK</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700, marginBottom: 16, textAlign: "center" }}>👑 Connexion Administrateur</div>
        {resetSent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>Email envoyé !</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Vérifiez votre boîte mail pour réinitialiser votre mot de passe.</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setResetSent(false)}>Retour</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="admin@email.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdminEmailLogin()} /></div>
            <div className="form-group"><label className="form-label">Mot de passe</label><div style={{ position: "relative" }}><input className="form-input" type={showPwd ? "text" : "password"} placeholder="Choisissez un mot de passe (6+ car.)" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdminEmailLogin()} style={{ paddingRight: 40 }} /><button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--muted)", padding: 0 }}>{showPwd ? "🙈" : "👁"}</button></div></div>
            {adminError && <div style={{ fontSize: 12, color: "var(--red)", fontWeight: 700 }}>{adminError}</div>}
            <button className={`btn btn-primary ${adminLoading ? "loading" : ""}`} disabled={!adminEmail.trim() || !adminPassword || adminLoading} onClick={handleAdminEmailLogin} style={{ justifyContent: "center" }}>{adminLoading ? "⏳ Connexion..." : "🔑 Se connecter"}</button>
            <button className="btn btn-ghost btn-sm" onClick={handleResetPassword} style={{ justifyContent: "center", fontSize: 11 }}>Mot de passe oublié ?</button>
          </div>
        )}
      </div></div>
    );
  }

  if (step === "profile" && selectedCompany) {
    const companyUsers = users.filter(u => u.companyId === selectedCompany.id);
    const directorUsers = companyUsers.filter(u => u.role === "director");
    const adminUsers = companyUsers.filter(u => u.role === "admin");
    const viewerUsers = companyUsers.filter(u => u.role === "viewer");
    return (
      <div className="login-screen"><div className="login-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, width: "100%" }}>
          <button onClick={() => { setStep("company"); setSelectedCompany(null); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
          <div style={{ flex: 1 }}><div className="login-title" style={{ fontSize: 22, marginBottom: 0 }}>TOOL TRACK</div><div style={{ fontSize: 13, color: selectedCompany.color || "var(--accent)", fontWeight: 700 }}>🏢 {selectedCompany.name}</div></div>
        </div>
        {directorUsers.length > 0 && (
          <div style={{ width: "100%", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--accent)", textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🏢 Directeurs</div>
            {directorUsers.map(u => (
              <div key={u.id} className="user-select-item" onClick={() => { setAdminEmail(u.email || ""); setShowAdminLogin(true); }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0, background: "#9b59b6", color: "#fff" }}>{u.avatar}</div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>🏢 Directeur · Email + mot de passe</div></div>
                <span style={{ fontSize: 18, color: "var(--muted)" }}>›</span>
              </div>
            ))}
          </div>
        )}
        {adminUsers.length > 0 && (
          <><div style={{ borderTop: "1px solid var(--border)", margin: "12px 0" }} /><div className="login-sub">{`🔑 Admins — ${t.chooseProfile}`}</div>
          <div className="user-select-list">{adminUsers.map(u => <PinLogin key={u.id} user={u} onSuccess={onLogin} />)}</div></>
        )}
        {viewerUsers.length > 0 && (
          <><div style={{ borderTop: "1px solid var(--border)", margin: "12px 0" }} /><div className="login-sub">{`👷 ${t.employee}s — ${t.chooseProfile}`}</div>
          <div className="user-select-list">{viewerUsers.map(u => <PinLogin key={u.id} user={u} onSuccess={onLogin} />)}</div></>
        )}
        {companyUsers.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Aucun profil dans cette compagnie</div>}
      </div></div>
    );
  }

  return (
    <div className="login-screen"><div className="login-card">
      <div className="login-title">TOOL TRACK</div>

      {superAdmins.length > 0 && (
        <div style={{ width: "100%", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#e84040", textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>👑 Administration</div>
          {superAdmins.map(u => (
            <div key={u.id} className="user-select-item" onClick={() => { setAdminEmail(u.email || ""); setShowAdminLogin(true); }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0, background: "#e84040", color: "#fff" }}>{u.avatar}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>👑 Super Admin · Email + mot de passe</div></div>
              <span style={{ fontSize: 18, color: "var(--muted)" }}>›</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, marginBottom: 16 }} />
        </div>
      )}
      <div className="login-sub">{t.enterCompanyCode}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "20px 0" }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < companyPin.length ? (pinError ? "var(--red)" : "var(--accent)") : "var(--border)", transition: "all .15s" }} />)}
      </div>
      {pinError && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12, fontWeight: 700 }}>❌ Code incorrect</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%", maxWidth: 280 }}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
          <button key={i} onClick={() => { if (d === "⌫") { setCompanyPin(p => p.slice(0,-1)); setPinError(false); } else if (d !== "") handleCompanyPin(String(d)); }}
            style={{ padding: "16px 0", borderRadius: 12, border: "1px solid var(--border)", background: d === "⌫" ? "rgba(232,82,10,.1)" : "var(--surface)", color: d === "⌫" ? "var(--red)" : "var(--text)", fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, cursor: d === "" ? "default" : "pointer", opacity: d === "" ? 0 : 1 }}>
            {d}
          </button>
        ))}
      </div>
    </div></div>
  );
}

// ─── PIN LOGIN ────────────────────────────────────────────────────────────────
function PinLogin({ user, onSuccess }) {
  const [open, setOpen] = useState(false), [pin, setPin] = useState(""), [error, setError] = useState(false);
  const handlePin = (digit) => {
    const newPin = pin + digit; setPin(newPin); setError(false);
    if (newPin.length === 4) {
      if (!user.pin || newPin === user.pin) { setTimeout(() => onSuccess(user), 200); }
      else { setError(true); setTimeout(() => { setPin(""); setError(false); }, 1000); }
    }
  };
  if (!open) {
    const roleLabel = user.role === "superadmin" ? "👑 Super Admin" : user.role === "director" ? "🏢 Directeur" : user.role === "admin" ? "🔑 Admin" : "👷 Employé";
    const bgColor = user.role === "superadmin" ? "#e84040" : user.role === "director" ? "#9b59b6" : user.role === "admin" ? "var(--accent)" : "var(--blue)";
    const textColor = user.role === "admin" ? "#000" : "#fff";
    return (
      <div className="user-select-item" onClick={() => setOpen(true)}>
        <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0, background: bgColor, color: textColor }}>{user.avatar}</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{roleLabel}</div></div>
        <span style={{ fontSize: 18, color: "var(--muted)" }}>›</span>
      </div>
    );
  }
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 16, border: `1px solid ${error ? "var(--red)" : "var(--border)"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, background: user.role === "superadmin" ? "#e84040" : user.role === "director" ? "#9b59b6" : user.role === "admin" ? "var(--accent)" : "var(--blue)", color: ["admin"].includes(user.role) ? "#000" : "#fff" }}>{user.avatar}</div>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div><div style={{ fontSize: 11, color: error ? "var(--red)" : "var(--muted)" }}>{error ? "❌ Code incorrect" : "Entrez votre PIN"}</div></div>
        <button onClick={() => { setOpen(false); setPin(""); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? (error ? "var(--red)" : "var(--accent)") : "var(--border)", transition: "all .15s" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
          <button key={i} onClick={() => { if (d === "⌫") { setPin(p => p.slice(0,-1)); setError(false); } else if (d !== "") handlePin(String(d)); }}
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
  const [name, setName] = useState(""), [phone, setPhone] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [showSuperPwd, setShowSuperPwd] = useState(false);
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      const initials = name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      await onSave({ id: uid, name: name.trim(), role: "superadmin", avatar: initials, phone, email: email.trim(), pin: "", companyId: null, authUid: uid });
    } catch(e) {
      if (e.code === "auth/email-already-in-use") setError("❌ Cet email est déjà utilisé.");
      else if (e.code === "auth/invalid-email") setError("❌ Email invalide.");
      else setError("❌ Erreur : " + e.message);
      setLoading(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      <div className="form-group"><label className="form-label">Votre nom *</label><input className="form-input" placeholder="ex: Jean Dupont" value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" placeholder="+230 ..." value={phone} onChange={e => setPhone(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" placeholder="vous@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Mot de passe * (min. 6 caractères)</label><div style={{ position: "relative" }}><input className="form-input" type={showSuperPwd ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 40 }} /><button type="button" onClick={() => setShowSuperPwd(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--muted)", padding: 0 }}>{showSuperPwd ? "🙈" : "👁"}</button></div></div>
      
      {error && <div style={{ fontSize: 12, color: "var(--red)", fontWeight: 700 }}>{error}</div>}
      <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={!name.trim() || !email.trim() || password.length < 6 || loading} onClick={handleCreate} style={{ justifyContent: "center", marginTop: 4 }}>{loading ? "⏳ Création..." : "🚀 Créer et démarrer"}</button>
    </div>
  );
}
