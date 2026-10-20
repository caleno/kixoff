import type { Player } from '../game/state';

export interface CheatReport {
  playerId: string;
  type: 'speed' | 'teleport' | 'aimbot' | 'desync';
  severity: 'low' | 'medium' | 'high';
  details: string;
}

export class AntiCheatV2 {
  private lastPositions = new Map<string, { x: number; y: number; tick: number }>();

  analyzePlayer(player: Player, tick: number): CheatReport[] {
    const reports: CheatReport[] = [];
    const last = this.lastPositions.get(player.id);

    if (last) {
      const dx = player.x - last.x;
      const dy = player.y - last.y;
      const dt = Math.max(1, tick - last.tick);
      const distance = Math.hypot(dx, dy);
      const speed = distance / dt;

      if (speed > 18) {
        reports.push({
          playerId: player.id,
          type: 'speed',
          severity: speed > 30 ? 'high' : 'medium',
          details: `Unusual speed detected: ${speed.toFixed(2)} px/tick`,
        });
      }

      if (distance > 120) {
        reports.push({
          playerId: player.id,
          type: 'teleport',
          severity: 'high',
          details: `Large position jump detected: ${distance.toFixed(2)} px`,
        });
      }
    }

    this.lastPositions.set(player.id, { x: player.x, y: player.y, tick });
    return reports;
  }
}
