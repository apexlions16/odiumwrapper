import type { Line, Project, Retake, Role } from './types';

export const roleLabels: Record<Role, string> = {
  system_admin: 'Sistem Yöneticisi', project_director: 'Proje Yönetmeni', voice_director: 'Ses Yönetmeni',
  voice_actor: 'Seslendirme Sanatçısı', translator: 'Çevirmen', script_editor: 'Metin Editörü',
  mixer: 'Miksajcı', qa: 'Kalite Kontrol', observer: 'Gözlemci'
};

export const demoUsers: Record<string, { name: string; role: Role }> = {
  'admin@demo.odium.studio': { name: 'Odium Admin', role: 'system_admin' },
  'director@demo.odium.studio': { name: 'Proje Yönetmeni', role: 'project_director' },
  'actor@demo.odium.studio': { name: 'Deniz Aksoy', role: 'voice_actor' },
  'mixer@demo.odium.studio': { name: 'Mert Kaya', role: 'mixer' },
  'translator@demo.odium.studio': { name: 'Ece Yalın', role: 'translator' },
  'qa@demo.odium.studio': { name: 'Kalite Ekibi', role: 'qa' }
};

export const projects: Project[] = [
  { id: 'OD-001', name: 'Project Nightfall', game: 'Action RPG', stage: 'Kayıt Kontrolü', deadline: '24 Tem 2026', progress: 68, linesTotal: 3840, linesDone: 2612, retakes: 37, members: 24 },
  { id: 'OD-002', name: 'Iron Province', game: 'Strategy', stage: 'Çeviri', deadline: '12 Ağu 2026', progress: 31, linesTotal: 6720, linesDone: 2084, retakes: 8, members: 18 },
  { id: 'OD-003', name: 'Echoes of Meridian', game: 'Adventure', stage: 'Miksaj', deadline: '19 Tem 2026', progress: 86, linesTotal: 1520, linesDone: 1307, retakes: 14, members: 12 }
];

export const lines: Line[] = [
  { id: 'NF_01042', character: 'Kael', text: 'Kapılar kapanmadan içeri girmeliyiz.', assignee: 'Deniz Aksoy', status: 'Retake istendi', deadline: '16 Tem', duration: '03.4 sn' },
  { id: 'NF_01043', character: 'Kael', text: 'Beni burada bırakın. Bu yolu tek başıma tamamlayacağım.', assignee: 'Deniz Aksoy', status: 'İnceleniyor', deadline: '16 Tem', duration: '05.8 sn' },
  { id: 'NF_01044', character: 'Mira', text: 'Bunun bir veda olmasına izin vermeyeceğim.', assignee: 'Selin Aras', status: 'Onaylandı', deadline: '17 Tem', duration: '04.1 sn' },
  { id: 'NF_01045', character: 'Komutan', text: 'Birlikleri kuzey duvarına gönderin.', assignee: 'Burak Işık', status: 'Kayıt bekleniyor', deadline: '18 Tem', duration: '03.7 sn' }
];

export const retakes: Retake[] = [
  { id: 'RT-184', targetType: 'voice_line', target: 'NF_01042 · Kael', assignedTo: 'Deniz Aksoy', requestedBy: 'Ses Yönetmeni', reason: '“Kapılar” kelimesinde vurgu ve cümlenin sonundaki aciliyet artırılmalı.', priority: 'Yüksek', status: 'Bekleniyor', deadline: '16 Tem 22:00', version: 2 },
  { id: 'RT-183', targetType: 'mix_package', target: 'Chapter_03_Mix_v2.zip', assignedTo: 'Mert Kaya', requestedBy: 'Proje Yönetmeni', reason: 'Arka plan müziği 1042–1051 aralığında diyalogları bastırıyor.', priority: 'Kritik', status: 'Çalışılıyor', deadline: '17 Tem 18:00', version: 3 },
  { id: 'RT-179', targetType: 'translation', target: 'NF_00887', assignedTo: 'Ece Yalın', requestedBy: 'Metin Editörü', reason: 'Bağlamda kullanılan askerî rütbe terminoloji rehberiyle uyuşmuyor.', priority: 'Normal', status: 'Teslim edildi', deadline: '15 Tem 14:00', version: 2 }
];

export const modulesByRole: Record<Role, string[]> = {
  system_admin: ['dashboard', 'projects', 'lines', 'retakes', 'mixing', 'files', 'team', 'messages', 'reports', 'admin', 'settings'],
  project_director: ['dashboard', 'projects', 'lines', 'retakes', 'mixing', 'files', 'team', 'messages', 'reports', 'settings'],
  voice_director: ['dashboard', 'projects', 'lines', 'retakes', 'files', 'team', 'messages', 'reports', 'settings'],
  voice_actor: ['dashboard', 'projects', 'lines', 'retakes', 'files', 'messages', 'settings'],
  translator: ['dashboard', 'projects', 'lines', 'retakes', 'files', 'messages', 'settings'],
  script_editor: ['dashboard', 'projects', 'lines', 'retakes', 'files', 'messages', 'reports', 'settings'],
  mixer: ['dashboard', 'projects', 'retakes', 'mixing', 'files', 'messages', 'settings'],
  qa: ['dashboard', 'projects', 'lines', 'retakes', 'mixing', 'files', 'messages', 'reports', 'settings'],
  observer: ['dashboard', 'projects', 'reports', 'settings']
};
