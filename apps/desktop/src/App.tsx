import { useEffect, useState } from 'react';
import {
  Activity, Archive, Bell, CalendarClock, ChevronRight, CircleUserRound,
  ClipboardList, CloudUpload, FileArchive, Files, Gauge, LogOut, MessageSquare, Mic2,
  Music2, RefreshCcw, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles,
  Users, XCircle
} from 'lucide-react';
import { login, uploadFile } from './api';
import { lines, modulesByRole, projects, retakes, roleLabels } from './data';
import type { Retake, Role, User } from './types';

type Page = 'dashboard' | 'projects' | 'lines' | 'retakes' | 'mixing' | 'files' | 'team' | 'messages' | 'reports' | 'admin' | 'settings';
type UpdateStatus = { state?: string; version?: string; percent?: number; message?: string };

const navItems: Array<{ id: Page; label: string; icon: typeof Gauge }> = [
  { id: 'dashboard', label: 'Genel Bakış', icon: Gauge },
  { id: 'projects', label: 'Projeler', icon: Archive },
  { id: 'lines', label: 'Line Yönetimi', icon: ClipboardList },
  { id: 'retakes', label: 'Retake & Revizyon', icon: RefreshCcw },
  { id: 'mixing', label: 'Miksaj', icon: Music2 },
  { id: 'files', label: 'Dosyalar', icon: Files },
  { id: 'team', label: 'Ekip', icon: Users },
  { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
  { id: 'reports', label: 'Raporlar', icon: Activity },
  { id: 'admin', label: 'Sistem Yönetimi', icon: ShieldCheck },
  { id: 'settings', label: 'Ayarlar', icon: Settings }
];

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('odium-user');
    return raw ? JSON.parse(raw) : null;
  });
  const [page, setPage] = useState<Page>('dashboard');
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({});

  useEffect(() => window.odiumDesktop?.onUpdateStatus(payload => setUpdateStatus(payload as UpdateStatus)), []);

  if (!user) return <Login onLogin={next => { setUser(next); localStorage.setItem('odium-user', JSON.stringify(next)); }} />;

  const allowed = modulesByRole[user.role];
  const visibleNav = navItems.filter(item => allowed.includes(item.id));
  const safePage = allowed.includes(page) ? page : 'dashboard';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Mic2 size={21} /></div><div><strong>ODIUM</strong><span>STUDIO WRAPPER</span></div></div>
        <div className="project-switcher"><span>AKTİF ÇALIŞMA ALANI</span><button>Odium Studio <ChevronRight size={16} /></button></div>
        <nav>{visibleNav.map(item => <button key={item.id} className={safePage === item.id ? 'active' : ''} onClick={() => setPage(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === 'retakes' && <b>3</b>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="server-state"><i /> Hugging Face API hazır</div>
          <button className="profile" onClick={() => setPage('settings')}><div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div><div><strong>{user.name}</strong><span>{roleLabels[user.role]}</span></div></button>
          <button className="logout" onClick={() => { localStorage.removeItem('odium-user'); setUser(null); }}><LogOut size={16} /> Oturumu kapat</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="search"><Search size={17} /><input placeholder="Proje, line, kullanıcı veya dosya ara…" /></div><div className="top-actions"><button><Bell size={18} /><i /></button><div className="live-pill"><span /> CANLI</div></div></header>
        <div className="page-content">
          {safePage === 'dashboard' && <Dashboard user={user} />}
          {safePage === 'projects' && <Projects />}
          {safePage === 'lines' && <Lines role={user.role} />}
          {safePage === 'retakes' && <Retakes role={user.role} />}
          {safePage === 'mixing' && <Mixing />}
          {safePage === 'files' && <FileCenter user={user} />}
          {safePage === 'team' && <Team />}
          {safePage === 'messages' && <Messages />}
          {safePage === 'reports' && <Reports />}
          {safePage === 'admin' && <Admin />}
          {safePage === 'settings' && <SettingsPage user={user} updateStatus={updateStatus} />}
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('director@demo.odium.studio');
  const [password, setPassword] = useState('odium123');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { const user = await login(email, password); onLogin(user); if (!remember) sessionStorage.setItem('odium-session-only', '1'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Giriş başarısız.'); }
    finally { setBusy(false); }
  }
  return <div className="login-page"><div className="login-orb orb-one" /><div className="login-orb orb-two" /><section className="login-copy"><div className="brand large"><div className="brand-mark"><Mic2 size={26} /></div><div><strong>ODIUM</strong><span>STUDIO WRAPPER</span></div></div><h1>Dublaj üretiminin<br /><em>tek kontrol merkezi.</em></h1><p>Kayıttan miksaja, retake’den final teslimine kadar ekibinizin bütün üretim akışını yönetin.</p><div className="login-metrics"><div><strong>Line bazlı</strong><span>üretim takibi</span></div><div><strong>Rol bazlı</strong><span>güvenli erişim</span></div><div><strong>Tek kurulum</strong><span>otomatik güncelleme</span></div></div></section><form className="login-card" onSubmit={submit}><div><span className="eyebrow">EKİP PORTALI</span><h2>Tekrar hoş geldin</h2><p>Odium hesabınla çalışma alanına giriş yap.</p></div><label>E-posta adresi<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" /></label><label>Şifre<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" /></label><div className="login-options"><label className="checkbox"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Beni hatırla</label><button type="button">Şifremi unuttum</button></div>{error && <div className="error"><XCircle size={16} />{error}</div>}<button className="primary wide" disabled={busy}>{busy ? 'Bağlanılıyor…' : 'Çalışma alanına gir'}<ChevronRight size={17} /></button><div className="demo-note"><Sparkles size={15} /> Demo hesaplar için şifre: <code>odium123</code></div></form></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Dashboard({ user }: { user: User }) {
  const actor = user.role === 'voice_actor'; const mixer = user.role === 'mixer';
  const cards = actor ? [['Atanan line', '146', '+24 bu hafta'], ['Tamamlanan', '101', '%69 ilerleme'], ['Retake', '3', '2 yüksek öncelik'], ['Yaklaşan teslim', '16 Tem', '22:00']] : mixer ? [['Aktif miks paketi', '4', '2 proje'], ['Teslim bekleyen', '2', 'Bugün'], ['Miks retake', '1', 'Kritik'], ['Tamamlanan', '18', 'Bu ay']] : [['Aktif proje', '3', '+1 bu ay'], ['Toplam line', '12.080', '%52 tamamlandı'], ['Bekleyen retake', '59', '8 kritik'], ['Ekip üyesi', '41', '27 aktif']];
  return <><PageHeader eyebrow="PRODUCTION CONTROL" title={`İyi akşamlar, ${user.name.split(' ')[0]}.`} description="Bugünün üretim durumu ve dikkat etmen gereken işler burada." action={<button className="primary"><CloudUpload size={17} /> Yeni dosya yükle</button>} /><div className="stats-grid">{cards.map(([label, value, meta], i) => <div className="stat-card" key={label}><div className={`stat-icon i${i}`}><Activity size={19} /></div><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>)}</div><div className="content-grid"><section className="panel span-two"><div className="panel-title"><div><span>PROJE İLERLEMESİ</span><h3>Aktif prodüksiyonlar</h3></div><button>Tümünü gör <ChevronRight size={15} /></button></div>{projects.map(project => <div className="project-row" key={project.id}><div className="project-badge">{project.name.slice(0, 2).toUpperCase()}</div><div className="project-main"><strong>{project.name}</strong><span>{project.id} · {project.stage}</span><div className="progress"><i style={{ width: `${project.progress}%` }} /></div></div><div className="project-stat"><strong>{project.progress}%</strong><span>{project.linesDone.toLocaleString('tr-TR')} / {project.linesTotal.toLocaleString('tr-TR')} line</span></div><div className="deadline"><CalendarClock size={16} /><span>{project.deadline}</span></div></div>)}</section><section className="panel"><div className="panel-title"><div><span>ACİL İŞLER</span><h3>Öncelik kuyruğu</h3></div></div>{retakes.slice(0, 3).map(item => <div className="priority-item" key={item.id}><div className={`priority-dot ${item.priority.toLowerCase()}`} /><div><strong>{item.target}</strong><span>{item.reason}</span><small>{item.assignedTo} · {item.deadline}</small></div></div>)}</section></div></>;
}

function Projects() { return <><PageHeader eyebrow="PROJELER" title="Dublaj prodüksiyonları" description="Bütün projelerin aşamalarını, ekiplerini ve teslim risklerini izle." action={<button className="primary">+ Yeni proje</button>} /><div className="project-cards">{projects.map(p => <article className="project-card" key={p.id}><div className="project-cover"><span>{p.id}</span><div>{p.name.slice(0, 2).toUpperCase()}</div></div><div className="project-card-body"><div className="stage">{p.stage}</div><h3>{p.name}</h3><p>{p.game} · {p.members} ekip üyesi</p><div className="progress big"><i style={{ width: `${p.progress}%` }} /></div><div className="project-card-stats"><span><strong>{p.progress}%</strong>Tamamlandı</span><span><strong>{p.retakes}</strong>Retake</span><span><strong>{p.deadline}</strong>Deadline</span></div></div></article>)}</div></> }

function Lines({ role }: { role: Role }) { const visible = role === 'voice_actor' ? lines.filter(l => l.assignee === 'Deniz Aksoy') : lines; return <><PageHeader eyebrow="LINE TRACKER" title={role === 'voice_actor' ? 'Kayıt görevlerim' : 'Line yönetimi'} description="Replikleri, atamaları, kayıt durumlarını ve teslim tarihlerini tek yerde yönet." action={<div className="button-row"><button className="secondary"><SlidersHorizontal size={16} /> Filtrele</button>{role !== 'voice_actor' && <button className="primary">CSV / XLSX içe aktar</button>}</div>} /><div className="table-panel"><div className="table-toolbar"><div className="search compact"><Search size={16} /><input placeholder="Line ID veya metin ara…" /></div><div className="filter-pills"><button className="active">Tümü</button><button>Bekleyen</button><button>Retake</button><button>Onaylanan</button></div></div><table><thead><tr><th>LINE ID</th><th>KARAKTER & METİN</th><th>ATANAN</th><th>DURUM</th><th>SÜRE</th><th>DEADLINE</th></tr></thead><tbody>{visible.map(line => <tr key={line.id}><td><code>{line.id}</code></td><td><strong>{line.character}</strong><span>{line.text}</span></td><td>{line.assignee}</td><td><Status value={line.status} /></td><td>{line.duration}</td><td>{line.deadline}</td></tr>)}</tbody></table></div></> }

function Retakes({ role }: { role: Role }) { const mine = role === 'voice_actor' ? retakes.filter(r => r.targetType === 'voice_line') : role === 'mixer' ? retakes.filter(r => r.targetType.includes('mix')) : retakes; return <><PageHeader eyebrow="REVİZYON MERKEZİ" title="Retake & revizyon" description="Seslendirme, çeviri, miksaj ve final teslim revizyonlarını sürüm geçmişiyle takip et." action={!['voice_actor','mixer','translator'].includes(role) ? <button className="primary">+ Retake oluştur</button> : undefined} /><div className="retake-board">{['Bekleniyor','Çalışılıyor','Teslim edildi'].map(status => <section className="retake-column" key={status}><header><span>{status}</span><b>{mine.filter(r => r.status === status).length}</b></header>{mine.filter(r => r.status === status).map(item => <RetakeCard key={item.id} item={item} />)}</section>)}</div></> }
function RetakeCard({ item }: { item: Retake }) { const type = item.targetType.includes('mix') ? 'MİKSAJ' : item.targetType === 'translation' ? 'ÇEVİRİ' : 'SESLENDİRME'; return <article className="retake-card"><div className="retake-top"><span>{type}</span><b className={item.priority.toLowerCase()}>{item.priority}</b></div><h3>{item.target}</h3><p>{item.reason}</p><div className="retake-person"><CircleUserRound size={16} /><span><strong>{item.assignedTo}</strong>{item.requestedBy} tarafından</span></div><footer><span>{item.id} · v{item.version}</span><b><CalendarClock size={14} />{item.deadline}</b></footer></article> }

function Mixing() { return <><PageHeader eyebrow="MIX DELIVERY" title="Miksaj kontrolü" description="Onaylı kayıt paketlerini, miks sürümlerini ve miksajcı revizyonlarını yönet." action={<button className="primary"><FileArchive size={17} /> Miks paketi oluştur</button>} /><div className="mix-grid"><section className="panel span-two"><div className="panel-title"><div><span>AKTİF PAKETLER</span><h3>Miks teslim kuyruğu</h3></div></div>{[['Chapter_03_Mix','Mert Kaya','v3 · Retake çalışılıyor','78%'],['Combat_Barks_Batch_07','Mert Kaya','v1 · İnceleniyor','100%'],['NPC_Town_East','Ayşe Demir','Kaynaklar hazırlanıyor','42%']].map(row => <div className="mix-row" key={row[0]}><div className="mix-icon"><Music2 size={20} /></div><div><strong>{row[0]}</strong><span>{row[1]} · {row[2]}</span></div><div className="progress"><i style={{width: row[3]}} /></div><b>{row[3]}</b><button>İncele</button></div>)}</section><section className="panel"><div className="panel-title"><div><span>TEKNİK KURAL</span><h3>Project Nightfall</h3></div></div><div className="tech-list"><span><b>Format</b>WAV</span><span><b>Sample rate</b>48 kHz</span><span><b>Bit depth</b>24 bit</span><span><b>Channel</b>Mono</span><span><b>Target</b>-23 LUFS</span></div></section></div></> }

function FileCenter({ user }: { user: User }) { const [state, setState] = useState(''); async function pick(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file) return; setState('Yükleniyor…'); try { await uploadFile(file, user, 'OD-001', user.role === 'mixer' ? 'mix_package' : 'voice_recording'); setState(`${file.name} başarıyla yüklendi.`); } catch (err) { setState(err instanceof Error ? err.message : 'Yükleme hatası'); } } return <><PageHeader eyebrow="DOSYA MERKEZİ" title="Kayıt ve paketler" description="ZIP, WAV ve proje teslimlerini yükle; sürümlerini ve kullanım durumlarını takip et." /><label className="dropzone"><CloudUpload size={38} /><strong>Dosyaları buraya bırak veya seç</strong><span>WAV, ZIP, MP3, CSV, XLSX · Büyük dosyalar kuyruklanır</span><input type="file" onChange={pick} />{state && <b>{state}</b>}</label><div className="table-panel"><table><thead><tr><th>DOSYA</th><th>TÜR</th><th>YÜKLEYEN</th><th>BOYUT</th><th>SÜRÜM</th><th>DURUM</th></tr></thead><tbody><tr><td><strong>Chapter_03_Mix_v2.zip</strong><span>Project Nightfall / Miksaj</span></td><td>ZIP paket</td><td>Mert Kaya</td><td>1.8 GB</td><td>v2</td><td><Status value="Retake istendi" /></td></tr><tr><td><strong>Kael_Batch_04.zip</strong><span>Project Nightfall / Ham kayıt</span></td><td>ZIP paket</td><td>Deniz Aksoy</td><td>486 MB</td><td>v1</td><td><Status value="Onaylandı" /></td></tr></tbody></table></div></> }

function Team() { return <><PageHeader eyebrow="EKİP YÖNETİMİ" title="Prodüksiyon ekibi" description="Kullanıcıların proje rollerini, erişimlerini ve iş yüklerini yönet." action={<button className="primary">+ Kullanıcı davet et</button>} /><div className="team-grid">{[['PY','Pelin Yılmaz','Proje Yönetmeni','3 proje · 59 açık revizyon'],['DA','Deniz Aksoy','Seslendirme Sanatçısı','146 line · %69'],['MK','Mert Kaya','Miksajcı','4 aktif paket'],['EY','Ece Yalın','Çevirmen','2.084 line · %54'],['SE','Selin Erdem','Ses Yönetmeni','127 inceleme bekliyor'],['QA','QA Ekibi','Kalite Kontrol','3 final paket']].map(x => <article className="person-card" key={x[1]}><div className="avatar large-avatar">{x[0]}</div><div><strong>{x[1]}</strong><span>{x[2]}</span><small>{x[3]}</small></div><button>•••</button></article>)}</div></> }
function Messages() { return <><PageHeader eyebrow="İLETİŞİM" title="Proje mesajları" description="Üretim kararlarını proje, line ve dosya bağlamında konuş." /><div className="messages-layout"><aside><button className="active"># project-nightfall</button><button># seslendirme</button><button># miksaj</button><button># kalite-kontrol</button><span>DİREKT MESAJLAR</span><button>● Pelin Yılmaz</button><button>● Mert Kaya</button></aside><section><div className="message"><div className="avatar">PY</div><div><strong>Pelin Yılmaz <small>18:04</small></strong><p>Chapter 03 miks retake notlarını pakete bağladım. Özellikle 1042–1051 aralığına bakalım.</p><code>Bağlantı: RT-183 · Chapter_03_Mix_v2.zip</code></div></div><div className="message"><div className="avatar">MK</div><div><strong>Mert Kaya <small>18:11</small></strong><p>Notları aldım. Müzik stem seviyelerini düşürüp v3 olarak yükleyeceğim.</p></div></div><div className="message-input"><input placeholder="# project-nightfall kanalına mesaj yaz…" /><button className="primary">Gönder</button></div></section></div></> }
function Reports() { return <><PageHeader eyebrow="ANALİTİK" title="Production raporları" description="İş yükünü, teslim hızını ve revizyon oranlarını karşılaştır." /><div className="stats-grid"><div className="stat-card"><span>Haftalık teslim</span><strong>1.284</strong><small>+%18 önceki haftaya göre</small></div><div className="stat-card"><span>İlk onay oranı</span><strong>%87</strong><small>Hedef: %90</small></div><div className="stat-card"><span>Ortalama retake</span><strong>1.3</strong><small>line başına</small></div><div className="stat-card"><span>Deadline riski</span><strong>2</strong><small>görev gecikebilir</small></div></div><section className="panel chart-placeholder"><Activity size={48} /><h3>İlerleme raporu</h3><p>Proje, rol ve kullanıcı filtreleriyle dışa aktarılabilir rapor alanı.</p><button className="secondary">CSV dışa aktar</button></section></> }
function Admin() { return <><PageHeader eyebrow="SİSTEM" title="Yönetim merkezi" description="Kullanıcı erişimleri, depolama, audit ve uygulama politikaları." /><div className="admin-grid">{[['Kullanıcılar','41 aktif · 3 davet bekliyor',Users],['Rol politikaları','9 rol · kaynak bazlı izinler',ShieldCheck],['Hugging Face depolama','38.4 GB kullanılıyor',CloudUpload],['Audit kayıtları','18.492 değiştirilemez olay',Activity],['Yedekleme','Son yedek bugün 17:00',Archive],['Sürüm kanalları','Stable 0.1.0 · Beta kapalı',RefreshCcw]].map(([a,b,Icon]) => { const I=Icon as typeof Users; return <article className="admin-card" key={String(a)}><I size={22}/><div><strong>{String(a)}</strong><span>{String(b)}</span></div><ChevronRight size={18}/></article>})}</div></> }
function SettingsPage({ user, updateStatus }: { user: User; updateStatus: UpdateStatus }) { const [version,setVersion]=useState('0.1.0'); useEffect(()=>{window.odiumDesktop?.getVersion().then(setVersion)},[]); return <><PageHeader eyebrow="AYARLAR" title="Uygulama ve profil" description="Bildirim, oturum ve güncelleme tercihlerini yönet." /><div className="settings-grid"><section className="panel"><h3>Profil</h3><div className="profile-detail"><div className="avatar large-avatar">{user.name.slice(0,2).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span><small>{roleLabels[user.role]}</small></div></div></section><section className="panel"><h3>Otomatik güncelleme</h3><p>Yeni sürümler GitHub Releases üzerinden uygulama içinde indirilir. Kullanıcıya yeniden EXE gönderilmez.</p><div className="update-box"><div><strong>Yüklü sürüm v{version}</strong><span>{updateStatus.state === 'available' ? `v${updateStatus.version} hazır` : updateStatus.state === 'downloading' ? `%${Math.round(updateStatus.percent || 0)} indirildi` : updateStatus.message || 'Stable kanal'}</span></div><button className="secondary" onClick={() => window.odiumDesktop?.checkForUpdates()}><RefreshCcw size={15}/> Güncelleme ara</button>{updateStatus.state === 'available' && <button className="primary" onClick={() => window.odiumDesktop?.downloadUpdate()}>İndir</button>}{updateStatus.state === 'downloaded' && <button className="primary" onClick={() => window.odiumDesktop?.installUpdate()}>Yeniden başlat ve kur</button>}</div></section></div></> }
function Status({ value }: { value: string }) { return <span className={`status ${value.toLowerCase().replaceAll(' ','-').replaceAll('ı','i')}`}>{value}</span> }

export default App;
