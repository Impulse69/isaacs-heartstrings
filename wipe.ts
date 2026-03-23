import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hovfyprwhmushgcogcyi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sBlVGcMQJQOyUdESlIWJ7A_1mUpN4IT";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function wipe() {
  console.log("Wiping game_records...");
  await supabase.from("game_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Wiping ella_answers...");
  await supabase.from("ella_answers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Wiping player_identities...");
  await supabase.from("player_identities").delete().in("role", ["isaac", "ella"]);

  console.log("Database is freshly wiped. Ready for Ella.");
}

wipe().catch(console.error);
