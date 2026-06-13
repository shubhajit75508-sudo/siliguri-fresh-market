import { supabase } from "./client";

export async function signUp(email: string, password: string, name: string) {
  const { data: authData, error: authError } = await supabase!
    .auth
    .signUp({ email, password });
  if (authError) throw authError;

  if (authData.user) {
    const { error: profileError } = await supabase!
      .from("users")
      .insert({
        id: authData.user.id,
        name,
        email,
        phone: "",
        loyalty_points: 0,
      });
    if (profileError) throw profileError;
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase!
    .auth
    .signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase!.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase!.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase!.auth.getSession();
  return session;
}
