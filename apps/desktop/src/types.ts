export type Role =
  | 'system_admin'
  | 'project_director'
  | 'voice_director'
  | 'voice_actor'
  | 'translator'
  | 'script_editor'
  | 'mixer'
  | 'qa'
  | 'observer';

export type User = { id: string; name: string; email: string; role: Role; token?: string };
export type Project = {
  id: string; name: string; game: string; stage: string; deadline: string;
  progress: number; linesTotal: number; linesDone: number; retakes: number; members: number;
};
export type Line = {
  id: string; character: string; text: string; assignee: string; status: string;
  deadline: string; duration: string;
};
export type Retake = {
  id: string; targetType: 'voice_line' | 'translation' | 'mix_line' | 'mix_package' | 'final_delivery';
  target: string; assignedTo: string; requestedBy: string; reason: string; priority: string;
  status: string; deadline: string; version: number;
};
