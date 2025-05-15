import { supabase } from './supabase';

/**
 * Data access layer for Supabase tables
 */

// Organizations

/**
 * Fetch all organizations for the current user
 */
export async function getOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data;
}

/**
 * Fetch a single organization by ID
 */
export async function getOrganization(id) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Create a new organization
 */
export async function createOrganization(organizationData) {
  const { data, error } = await supabase
    .from('organizations')
    .insert([organizationData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update an organization
 */
export async function updateOrganization(id, updates) {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Delete an organization
 */
export async function deleteOrganization(id) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}

// Users

/**
 * Fetch all users for the current organization
 */
export async function getUsers(organizationId) {
  const { data, error } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      role,
      users (
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at
      )
    `)
    .eq('organization_id', organizationId);
    
  if (error) throw error;
  
  // Format the data to make it easier to work with
  return data.map(item => ({
    id: item.user_id,
    ...item.users,
    role: item.role,
    organizationId
  }));
}

/**
 * Fetch a single user by ID
 */
export async function getUser(userId, organizationId) {
  const { data, error } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      role,
      users (
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();
    
  if (error) throw error;
  
  return {
    id: data.user_id,
    ...data.users,
    role: data.role,
    organizationId
  };
}

/**
 * Invite a user to an organization
 */
export async function inviteUser(email, organizationId, role) {
  // This would typically send an email via a serverless function
  // For now, we'll just create the user and organization relationship
  const { data, error } = await supabase.rpc('invite_user_to_organization', {
    p_email: email,
    p_organization_id: organizationId,
    p_role: role
  });
  
  if (error) throw error;
  return data;
}

/**
 * Update a user's role in an organization
 */
export async function updateUserRole(userId, organizationId, role) {
  const { data, error } = await supabase
    .from('organization_users')
    .update({ role })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Remove a user from an organization
 */
export async function removeUserFromOrganization(userId, organizationId) {
  const { error } = await supabase
    .from('organization_users')
    .delete()
    .eq('user_id', userId)
    .eq('organization_id', organizationId);
    
  if (error) throw error;
  return true;
}

// Documents

/**
 * Fetch all documents for the current organization
 */
export async function getDocuments(organizationId, options = {}) {
  const { page = 1, limit = 20, status, type } = options;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
    
  if (status) {
    query = query.eq('status', status);
  }
  
  if (type) {
    query = query.eq('document_type', type);
  }
  
  const { data, error, count } = await query
    .range(offset, offset + limit - 1);
    
  if (error) throw error;
  
  return {
    data,
    meta: {
      total: count,
      page,
      limit
    }
  };
}

/**
 * Fetch a single document by ID
 */
export async function getDocument(id, organizationId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Create a new document
 */
export async function createDocument(documentData) {
  const { data, error } = await supabase
    .from('documents')
    .insert([documentData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update a document
 */
export async function updateDocument(id, updates, organizationId) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Delete a document
 */
export async function deleteDocument(id, organizationId) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);
    
  if (error) throw error;
  return true;
}

// File Storage

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(file, bucket, path) {
  const filename = `${Date.now()}-${file.name}`;
  const fullPath = path ? `${path}/${filename}` : filename;
  
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw error;
  
  // Get the public URL
  const { data: urlData } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(data.path);
    
  return {
    ...data,
    url: urlData.publicUrl
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path, bucket) {
  const { error } = await supabase
    .storage
    .from(bucket)
    .remove([path]);
    
  if (error) throw error;
  return true;
}

/**
 * Get a signed URL for a file (for private files)
 */
export async function getSignedUrl(path, bucket, expiresIn = 60) {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
    
  if (error) throw error;
  return data.signedUrl;
}

// Analytics

/**
 * Get document processing statistics
 */
export async function getDocumentStats(organizationId, period = 'month') {
  // This would use a database function or custom SQL query
  const { data, error } = await supabase.rpc('get_document_statistics', {
    p_organization_id: organizationId,
    p_period: period
  });
  
  if (error) throw error;
  return data;
}

/**
 * Get certificate expiration counts
 */
export async function getCertificateExpirations(organizationId) {
  // This would use a database function or custom SQL query
  const { data, error } = await supabase.rpc('get_certificate_expirations', {
    p_organization_id: organizationId
  });
  
  if (error) throw error;
  return data;
}

/**
 * Get user activity feed
 */
export async function getActivityFeed(organizationId, limit = 10) {
  // This would usually query an activity_log table
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data;
}