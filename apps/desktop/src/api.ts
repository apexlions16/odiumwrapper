import type { User } from './types';
import { demoUsers } from './data';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7860';

export async function login(email: string, password: string): Promise<User> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Giriş başarısız');
    const data = await response.json();
    return { ...data.user, token: data.access_token };
  } catch {
    const demo = demoUsers[email.toLowerCase()];
    if (!demo || password !== 'odium123') throw new Error('E-posta veya şifre hatalı.');
    return { id: email, email, name: demo.name, role: demo.role, token: 'demo-token' };
  }
}

export async function uploadFile(file: File, user: User, projectId: string, targetType: string) {
  if (user.token === 'demo-token') {
    await new Promise(resolve => setTimeout(resolve, 900));
    return { filename: file.name, size: file.size, public_url: URL.createObjectURL(file), demo: true };
  }
  const form = new FormData();
  form.append('file', file);
  form.append('project_id', projectId);
  form.append('target_type', targetType);
  const response = await fetch(`${API_URL}/files/upload`, { method: 'POST', headers: { Authorization: `Bearer ${user.token}` }, body: form });
  if (!response.ok) throw new Error('Dosya yüklenemedi.');
  return response.json();
}
