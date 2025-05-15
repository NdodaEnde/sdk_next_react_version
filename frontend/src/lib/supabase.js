import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-application-name': 'sdk-next-healthcare' },
  },
};

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  options
);

/**
 * Gets the current authenticated user
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

/**
 * Signs up a new user
 * @param {string} email 
 * @param {string} password 
 * @param {Object} options
 * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
 */
export async function signUp(email, password, options = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options.metadata || {},
      emailRedirectTo: options.redirectTo || undefined,
    },
  });
  
  return { 
    user: data?.user || null, 
    session: data?.session || null, 
    error 
  };
}

/**
 * Signs in a user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user: Object|null, session: Object|null, error: Error|null}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { 
    user: data?.user || null, 
    session: data?.session || null, 
    error 
  };
}

/**
 * Signs out the current user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Resets a user's password
 * @param {string} email 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  return { data, error };
}

/**
 * Updates a user's password
 * @param {string} password 
 * @returns {Promise<{user: Object|null, error: Error|null}>}
 */
export async function updatePassword(password) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  
  return { user: data?.user || null, error };
}

/**
 * Sends a magic link to a user's email
 * @param {string} email 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  return { data, error };
}

/**
 * Sets up listeners for auth state changes
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Subscribes to real-time changes on a table
 * @param {string} table 
 * @param {Function} callback 
 * @param {Object} options 
 * @returns {Object} Subscription object with unsubscribe method
 */
export function subscribeToChanges(table, callback, options = {}) {
  const channel = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', 
      { 
        event: options.event || '*', 
        schema: 'public', 
        table 
      }, 
      (payload) => callback(payload)
    )
    .subscribe();
    
  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Get all organizations for the current user
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getUserOrganizations() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: [], error: new Error('User not authenticated') };
  }
  
  return await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      settings,
      logo_url,
      created_at,
      organization_users!inner (
        role
      )
    `)
    .eq('organization_users.user_id', user.id);
}

/**
 * Get all documents for a specific organization
 * @param {string} organizationId 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getOrganizationDocuments(organizationId) {
  return await supabase
    .from('documents')
    .select(`
      id,
      name,
      file_path,
      content_type,
      size,
      document_type,
      status,
      result_path,
      extracted_data,
      processing_error,
      uploaded_by_id,
      processed_at,
      created_at,
      updated_at
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
}

/**
 * Get all certificates for a specific organization
 * @param {string} organizationId 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getOrganizationCertificates(organizationId) {
  return await supabase
    .from('certificates')
    .select(`
      id,
      patient_id,
      document_id,
      type,
      issue_date,
      expiry_date,
      status,
      issuer_name,
      metadata,
      created_at,
      updated_at,
      patients (
        name,
        identification_number
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
}

/**
 * Save a certificate
 * @param {Object} certificateData 
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export async function saveCertificate(certificateData) {
  return await supabase
    .from('certificates')
    .upsert(certificateData)
    .select();
}

/**
 * Get certificate history
 * @param {string} certificateId 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getCertificateHistory(certificateId) {
  return await supabase
    .from('activity_logs')
    .select('*')
    .eq('entity_type', 'certificate')
    .eq('entity_id', certificateId)
    .order('created_at', { ascending: false });
}