export interface SocketData {
  user_id?: string;
  role?: 'master' | 'player';
  pin?: string;
  playerId?: string;
  nickname?: string;
  gameRoomId?: string;
}
