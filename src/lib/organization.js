import { supabase } from '../supabaseClient';

/** @returns {Promise<string[]>} */
export async function getUserOrganizationIds(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId);
  if (error) {
    console.error('getUserOrganizationIds:', error);
    return [];
  }
  return (data || []).map((row) => row.organization_id);
}

/**
 * Devuelve la organización del usuario (primera membresía) o crea org + membership owner.
 * @returns {Promise<{ id: string, name: string } | null>}
 */
export async function getOrCreateOrganizationForUser(userId, orgName) {
  const existingIds = await getUserOrganizationIds(userId);
  if (existingIds.length > 0) {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', existingIds[0])
      .maybeSingle();
    if (error) throw error;
    return org;
  }

  const name = (orgName || '').trim() || 'Mi organización';
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert([{ name }])
    .select('id, name')
    .single();
  if (orgError) throw orgError;

  const { error: memberError } = await supabase.from('organization_members').insert([
    { organization_id: org.id, user_id: userId, role: 'owner' },
  ]);
  if (memberError) throw memberError;

  return org;
}

/** @returns {Promise<boolean>} */
export async function userCanManageChallenge(userId, challengeOrganizationId) {
  if (!userId || !challengeOrganizationId) return false;
  const orgIds = await getUserOrganizationIds(userId);
  return orgIds.includes(challengeOrganizationId);
}

export const DIFFICULTY_TO_DB = {
  Básico: 'beginner',
  Intermedio: 'intermediate',
  Avanzado: 'advanced',
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

export const DIFFICULTY_LABELS = {
  beginner: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};
