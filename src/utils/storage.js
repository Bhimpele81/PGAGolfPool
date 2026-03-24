// Legacy localStorage fallback — no longer primary storage, Supabase is used instead
export const getEntries = () => {
  try { return JSON.parse(localStorage.getItem('golfpool') || '{}'); }
  catch { return {}; }
};
export const saveEntries = (data) => {
  localStorage.setItem('golfpool', JSON.stringify(data));
};
