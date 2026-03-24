import { supabase } from './supabase';

const LOCAL_KEY = 'golf_tracker_v1';
const ROW_ID    = 'golf-pool-2026';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function emptyGolfer() {
  return { id: generateId(), name: '', place: '', strokes: '', thru: '' };
}

export function emptyWeek() {
  return {
    id: generateId(),
    tournament: '', course: '', date: '', notes: '',
    billGolfers: Array.from({ length: 8 }, emptyGolfer),
    donGolfers:  Array.from({ length: 8 }, emptyGolfer),
    result: null, runningTotal: 0,
    completed: false
  };
}

function localLoad() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function localSave(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {}
}

export async function loadData() {
  try {
    const { data, error } = await supabase
      .from('race_weeks')
      .select('data')
      .eq('id', ROW_ID)
      .single();
    if (error || !data) {
      const seed = { weeks: [] };
      await saveData(seed);
      localSave(seed);
      return seed;
    }
    localSave(data.data);
    return data.data;
  } catch (err) {
    console.warn('Supabase unavailable, using local cache:', err);
    return localLoad() || { weeks: [] };
  }
}

export async function saveData(appData) {
  localSave(appData);
  try {
    await supabase
      .from('race_weeks')
      .upsert({ id: ROW_ID, data: appData, updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn('Supabase save failed, data kept locally:', err);
  }
}
