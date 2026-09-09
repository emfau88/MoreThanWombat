import Phaser from 'phaser';
import type { Fighter } from '../combat/Fighter';
import type {
  ResourcePickupInteractionDefinition,
  StageInteractionDefinition,
  StageSectionDefinition,
  SteamVentInteractionDefinition,
} from '../data/stages';
import {
  advanceStageInteraction,
  createStageInteractionRuntime,
  isInsideInteractionEllipse,
  triggerSteamVent,
  type StageInteractionRuntime,
} from './StageInteractionContract';

export type WaveStageInteractionEvent =
  | Readonly<{ type: 'hazard_hit'; definition: SteamVentInteractionDefinition; actor: Fighter }>
  | Readonly<{ type: 'pickup_collected'; definition: ResourcePickupInteractionDefinition }>;

type InteractionVisual = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Shape;
  accent: Phaser.GameObjects.Shape;
  cue: Phaser.GameObjects.Text;
  smoke?: Phaser.GameObjects.Arc[];
};

export class WaveStageInteractionController {
  private definitions: readonly StageInteractionDefinition[] = [];
  private readonly runtimes = new Map<string, StageInteractionRuntime>();
  private readonly visuals = new Map<string, InteractionVisual>();
  private readonly hitActors = new Set<string>();
  private pickupToastRemainingMs = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  loadSection(section: StageSectionDefinition): void {
    this.clear();
    this.definitions = section.interactions ?? [];
    for (const definition of this.definitions) {
      this.runtimes.set(definition.id, createStageInteractionRuntime(definition));
      this.visuals.set(definition.id, definition.type === 'steam_vent'
        ? this.createSteamVentVisual(definition)
        : this.createPickupVisual(definition));
    }
    this.syncVisuals();
  }

  update(
    deltaMs: number,
    combatActive: boolean,
    player: Fighter,
    actors: readonly Fighter[],
    cameraWorldView: Phaser.Geom.Rectangle,
  ): WaveStageInteractionEvent[] {
    const events: WaveStageInteractionEvent[] = [];
    this.pickupToastRemainingMs = Math.max(0, this.pickupToastRemainingMs - Math.max(0, deltaMs));

    for (const definition of this.definitions) {
      const runtime = this.runtimes.get(definition.id);
      if (!runtime) continue;
      const previousCycle = runtime.cycle;
      const visible = this.isVisible(definition.x, definition.y, cameraWorldView);
      advanceStageInteraction(definition, runtime, deltaMs, combatActive, visible);
      if (runtime.cycle !== previousCycle) this.clearHazardHits(definition.id);

      if (definition.type === 'steam_vent' && runtime.phase === 'active' && visible) {
        for (const actor of actors) {
          const hitKey = `${definition.id}:${runtime.cycle}:${actor.instanceId}`;
          if (actor.state === 'dead' || !actor.isGrounded || this.hitActors.has(hitKey)
            || !isInsideInteractionEllipse(actor, definition)) continue;
          this.hitActors.add(hitKey);
          events.push({ type: 'hazard_hit', definition, actor });
        }
      } else if (definition.type === 'resource_pickup' && runtime.phase === 'available'
        && combatActive && player.isGrounded
        && Phaser.Math.Distance.Between(player.x, player.y, definition.x, definition.y) <= definition.collectRadius) {
        runtime.phase = 'collected';
        this.pickupToastRemainingMs = 900;
        events.push({ type: 'pickup_collected', definition });
      }
    }

    this.syncVisuals();
    return events;
  }

  trigger(interactionId: string): boolean {
    const definition = this.definitions.find((candidate): candidate is SteamVentInteractionDefinition => (
      candidate.id === interactionId && candidate.type === 'steam_vent'
    ));
    const runtime = this.runtimes.get(interactionId);
    const triggered = definition && runtime ? triggerSteamVent(definition, runtime) : false;
    if (triggered) this.syncVisuals();
    return triggered;
  }

  getSnapshot(interactionId: string): Readonly<StageInteractionRuntime> | null {
    const runtime = this.runtimes.get(interactionId);
    return runtime ? { ...runtime } : null;
  }

  getCount(): number {
    return this.definitions.length;
  }

  clear(): void {
    for (const visual of this.visuals.values()) visual.container.destroy(true);
    this.definitions = [];
    this.runtimes.clear();
    this.visuals.clear();
    this.hitActors.clear();
    this.pickupToastRemainingMs = 0;
  }

  destroy(): void {
    this.clear();
  }

  private clearHazardHits(interactionId: string): void {
    for (const key of this.hitActors) {
      if (key.startsWith(`${interactionId}:`)) this.hitActors.delete(key);
    }
  }

  private syncVisuals(): void {
    for (const definition of this.definitions) {
      const runtime = this.runtimes.get(definition.id);
      const visual = this.visuals.get(definition.id);
      if (!runtime || !visual) continue;
      if (definition.type === 'resource_pickup') {
        const available = runtime.phase === 'available';
        visual.body.setVisible(available);
        visual.accent.setVisible(available);
        visual.cue.setText(available ? definition.label.toUpperCase()
          : this.pickupToastRemainingMs > 0 ? 'LUNCH SECURED!' : '').setVisible(available || this.pickupToastRemainingMs > 0);
        visual.container.setAlpha(available ? 1 : this.pickupToastRemainingMs > 0 ? 0.9 : 0);
        continue;
      }

      const telegraph = runtime.phase === 'telegraph';
      const active = runtime.phase === 'active';
      visual.accent.setVisible(telegraph || active)
        .setFillStyle(active ? 0xe9f7ff : 0xffa62b, active ? 0.48 : 0.2)
        .setStrokeStyle(active ? 4 : 3, active ? 0xffffff : 0xffc15c, 0.9);
      visual.cue.setText(telegraph ? `${definition.label}!` : active ? 'PSSSSHHH!' : '')
        .setVisible(telegraph || active);
      for (const [index, puff] of (visual.smoke ?? []).entries()) {
        puff.setVisible(active).setAlpha(active ? 0.72 - index * 0.12 : 0);
      }
    }
  }

  private createSteamVentVisual(definition: SteamVentInteractionDefinition): InteractionVisual {
    const body = this.scene.add.ellipse(0, 0, definition.radiusX * 1.3, definition.radiusY * 1.05, 0x20252b, 0.94)
      .setStrokeStyle(4, 0x78838e, 0.9);
    const accent = this.scene.add.ellipse(0, 0, definition.radiusX * 2, definition.radiusY * 2, 0xffa62b, 0.2)
      .setStrokeStyle(3, 0xffc15c, 0.9);
    const slats = [-28, -14, 0, 14, 28].map((x) => this.scene.add.rectangle(x, 0, 7, definition.radiusY * 0.78, 0x0d1117, 0.95));
    const smoke = [
      this.scene.add.circle(-24, -35, 18, 0xe9f7ff, 0.7),
      this.scene.add.circle(4, -54, 24, 0xd6edf5, 0.58),
      this.scene.add.circle(30, -38, 16, 0xffffff, 0.5),
    ];
    const cue = this.scene.add.text(0, -82, '', {
      color: '#fff7e6', fontFamily: 'Verdana, Geneva, sans-serif', fontSize: '14px', fontStyle: 'bold',
      stroke: '#17151f', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5);
    const container = this.scene.add.container(definition.x, definition.y, [accent, body, ...slats, ...smoke, cue])
      .setDepth(definition.y - 2);
    return { container, body, accent, cue, smoke };
  }

  private createPickupVisual(definition: ResourcePickupInteractionDefinition): InteractionVisual {
    const shadow = this.scene.add.ellipse(0, 9, 76, 22, 0x000000, 0.28);
    const body = this.scene.add.rectangle(0, -12, 58, 42, 0xc95635, 1).setStrokeStyle(4, 0x5b271e, 1);
    const accent = this.scene.add.rectangle(0, -12, 22, 22, 0xffe5a8, 1).setStrokeStyle(2, 0x704829, 1);
    const crossV = this.scene.add.rectangle(0, -12, 5, 16, 0xc53b32, 1);
    const crossH = this.scene.add.rectangle(0, -12, 16, 5, 0xc53b32, 1);
    const cue = this.scene.add.text(0, -48, definition.label.toUpperCase(), {
      color: '#fff7e6', fontFamily: 'Verdana, Geneva, sans-serif', fontSize: '12px', fontStyle: 'bold',
      stroke: '#17151f', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5);
    const container = this.scene.add.container(definition.x, definition.y, [shadow, body, accent, crossV, crossH, cue])
      .setDepth(definition.y - 2);
    return { container, body, accent, cue };
  }

  private isVisible(x: number, y: number, cameraWorldView: Phaser.Geom.Rectangle): boolean {
    return x >= cameraWorldView.left + 24 && x <= cameraWorldView.right - 24
      && y >= cameraWorldView.top && y <= cameraWorldView.bottom;
  }
}
