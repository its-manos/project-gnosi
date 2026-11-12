import { supabase } from "./supabase";
import type { PvpRoom, PvpSettings } from "../quiz/pvp";
import { normalizeRoomCode } from "../quiz/pvp";

async function call(name: string, args: Record<string, unknown> = {}): Promise<PvpRoom | null> {
  if (!supabase) throw new Error("pvp_auth_required");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const { data, error } = await supabase.rpc(name, args).abortSignal(controller.signal);
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as PvpRoom | null;
  } finally { clearTimeout(timeout); }
}
export const pvpAvailable = Boolean(supabase);
export const resumePvpRoom = () => call("pvp_resume_room");
export const getPvpRoom = (roomId: string) => call("pvp_get_room", { p_room: roomId });
export const createPvpRoom = (name: string, settings: PvpSettings) => call("pvp_create_room", {
  p_name: name.trim(), p_category: settings.category, p_count: settings.count, p_seconds: settings.seconds,
});
export const joinPvpRoom = (name: string, code: string) => call("pvp_join_room", { p_name: name.trim(), p_code: normalizeRoomCode(code) });
export const readyPvpRoom = (roomId: string, ready: boolean) => call("pvp_set_ready", { p_room: roomId, p_ready: ready });
export const startPvpRoom = (roomId: string, matchId: string) => call("pvp_start_room", { p_room: roomId, p_match: matchId });
export const answerPvpRoom = (room: PvpRoom, value: number) => call("pvp_answer", {
  p_room: room.id, p_match: room.matchId, p_index: room.index, p_answer: value,
});
export const rematchPvpRoom = (roomId: string, matchId: string) => call("pvp_rematch", { p_room: roomId, p_match: matchId });
export const leavePvpRoom = (roomId: string) => call("pvp_leave_room", { p_room: roomId });
