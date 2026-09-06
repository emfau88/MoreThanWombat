import Phaser from 'phaser';
import { applyDepthSort } from '../core/DepthSort';
import type { AttackDefinition } from '../data/attacks';
import { attacksById } from '../data/attacks';
import type { Rect } from '../utils/Rect';
import type { CombatResponse } from './CombatResolver';
import type { CombatFaction } from './CombatFaction';
import {
  getAttackHitboxWindow,
  getFighterBoxProfileId,
  resolveFighterBox,
  type FighterBoxProfileId,
  type FighterBoxProfiles,
  type LocalBox,
} from './BoxProfiles';
import {
  getAttackPhaseAtElapsed,
  getMoveTimelineSnapshot,
  type AttackPhase as TimelineAttackPhase,
} from './MoveTimeline';

export type FighterFacing = 'left' | 'right';
export type FighterState =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'special'
  | 'ultimate'
  | 'hitstun'
  | 'jump'
  | 'fall'
  | 'airAttack'
  | 'landing'
  | 'dead';
export type AttackPhase = TimelineAttackPhase;

export type ActiveWorldHitbox = {
  profileId: string;
  rect: Rect;
  laneTolerance: number;
  heightTolerance: number;
};

export type FighterDefinition = {
  id: string;
  label: string;
  fillColor: number;
  outlineColor: number;
  maxHp: number;
  maxMana: number;
  manaRegenPerSecond: number;
  startingMana?: number;
  moveSpeed: number;
  width: number;
  height: number;
  hurtbox: LocalBox;
  hurtboxProfiles?: FighterBoxProfiles;
  pushbox: LocalBox;
  pushboxProfiles?: FighterBoxProfiles;
  attacks: {
    basic: string;
    special?: string;
    ultimate?: string;
  };
  sprite?: {
    textureKey: string;
    scale: number;
    animations: Partial<Record<FighterState, string>>;
    attackAnimations?: Partial<Record<string, string>>;
    attackScaleOverrides?: Partial<Record<string, number>>;
    frameScaleSets?: Record<string, number[]>;
    frameOffsetSets?: Record<string, Array<{ x: number; y: number }>>;
  };
};

export type FighterBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type FighterUpdateOptions = {
  allowManaRegen?: boolean;
};

export class Fighter {
  private static readonly JUMP_VELOCITY_Z = 480;
  private static readonly GRAVITY_Z = 1180;
  private static readonly LANDING_RECOVERY_MS = 60;
  private static nextInstanceId = 1;

  readonly instanceId: number;
  readonly id: string;
  readonly label: string;
  readonly faction: CombatFaction;
  readonly maxHp: number;
  readonly maxMana: number;
  readonly manaRegenPerSecond: number;
  readonly moveSpeed: number;
  readonly bodyWidth: number;
  readonly bodyHeight: number;
  readonly container: Phaser.GameObjects.Container;
  readonly visualContainer: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Rectangle;
  readonly sprite?: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly roleCueText: Phaser.GameObjects.Text;
  readonly debugLabel: Phaser.GameObjects.Text;
  readonly hurtboxDebug: Phaser.GameObjects.Rectangle;
  readonly pushboxDebug: Phaser.GameObjects.Rectangle;
  readonly hitboxDebug: Phaser.GameObjects.Rectangle;
  readonly contactDebug: Phaser.GameObjects.Ellipse;
  x: number;
  y: number;
  z = 0;
  velocityZ = 0;
  hp: number;
  mana: number;
  isGrounded = true;
  facing: FighterFacing = 'right';
  state: FighterState = 'idle';
  private readonly baseFillColor: number;
  private readonly definition: FighterDefinition;
  private currentAttack: AttackDefinition | null = null;
  private attackElapsedMs = 0;
  private attackPhase: AttackPhase = 'none';
  private hitstunRemainingMs = 0;
  private velocityX = 0;
  private velocityY = 0;
  private readonly hitTargets = new Set<string>();
  private debugEnabled = true;
  private statusNote = '';
  private flashRemainingMs = 0;
  private flashColor = 0xfff1bf;
  private roleTint: number | null = null;
  private attackInstanceId = 0;
  private landingRemainingMs = 0;
  private hasUsedAirAttack = false;
  private combatResponse: CombatResponse = 'normal';
  private readonly hitboxDebugRects: Phaser.GameObjects.Rectangle[];
  private contactDebugRemainingMs = 0;

  constructor(
    scene: Phaser.Scene,
    definition: FighterDefinition,
    spawn: { x: number; y: number },
    faction: CombatFaction = 'neutral',
  ) {
    this.definition = definition;
    this.instanceId = Fighter.nextInstanceId;
    Fighter.nextInstanceId += 1;
    this.id = definition.id;
    this.label = definition.label;
    this.faction = faction;
    this.maxHp = definition.maxHp;
    this.maxMana = definition.maxMana;
    this.manaRegenPerSecond = definition.manaRegenPerSecond;
    this.moveSpeed = definition.moveSpeed;
    this.bodyWidth = definition.width;
    this.bodyHeight = definition.height;
    this.baseFillColor = definition.fillColor;
    this.x = spawn.x;
    this.y = spawn.y;
    this.hp = definition.maxHp;
    this.mana = Phaser.Math.Clamp(definition.startingMana ?? definition.maxMana, 0, definition.maxMana);

    this.shadow = scene.add.ellipse(0, 0, definition.width * 0.9, 16, 0x000000, 0.28);
    this.body = scene.add
      .rectangle(0, -definition.height * 0.5, definition.width, definition.height, definition.fillColor)
      .setStrokeStyle(3, definition.outlineColor);
    this.sprite = definition.sprite
      ? scene.add.sprite(0, 0, definition.sprite.textureKey).setOrigin(0.5, 1).setScale(definition.sprite.scale)
      : undefined;

    if (this.sprite) {
      this.body.setVisible(false);
    }

    this.debugLabel = scene.add
      .text(0, -definition.height - 24, '', {
        color: '#f5f0d8',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '13px',
        align: 'center',
      })
      .setOrigin(0.5);
    this.roleCueText = scene.add
      .text(0, -definition.height - 8, '', {
        color: '#ffffff',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#17151f',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.hurtboxDebug = scene.add.rectangle(0, 0, definition.hurtbox.width, definition.hurtbox.height).setOrigin(0, 0);
    this.hurtboxDebug.setStrokeStyle(2, 0x48bfe3).setFillStyle(0x48bfe3, 0.08);
    this.pushboxDebug = scene.add.rectangle(0, 0, definition.pushbox.width, definition.pushbox.height).setOrigin(0, 0);
    this.pushboxDebug.setStrokeStyle(2, 0xffb703).setFillStyle(0xffb703, 0.08);
    this.hitboxDebugRects = [this.createHitboxDebugRect(scene)];
    this.hitboxDebug = this.hitboxDebugRects[0];
    this.contactDebug = scene.add.ellipse(0, 0, 10, 10, 0xffffff, 0.32)
      .setStrokeStyle(2, 0xff2e88)
      .setVisible(false);
    this.visualContainer = scene.add.container(0, 0, [
      this.body,
      ...(this.sprite ? [this.sprite] : []),
      this.hurtboxDebug,
      this.pushboxDebug,
      ...this.hitboxDebugRects,
      this.contactDebug,
      this.roleCueText,
      this.debugLabel,
    ]);

    this.container = scene.add.container(this.x, this.y, [
      this.shadow,
      this.visualContainer,
    ]);
    this.updateVisuals();
  }

  update(
    deltaSeconds: number,
    moveX: number,
    moveY: number,
    bounds: FighterBounds,
    options: FighterUpdateOptions = {},
  ): void {
    if (this.state === 'dead') {
      this.z = 0;
      this.velocityZ = 0;
      this.isGrounded = true;
      this.updateVisuals();
      return;
    }

    if (options.allowManaRegen ?? true) {
      this.regenerateMana(deltaSeconds);
    }
    this.updateVerticalMotion(deltaSeconds);
    this.applyKnockback(deltaSeconds, bounds);

    if (this.hitstunRemainingMs > 0) {
      this.hitstunRemainingMs = Math.max(0, this.hitstunRemainingMs - deltaSeconds * 1000);

      if (this.hitstunRemainingMs === 0) {
        this.state = this.isGrounded ? 'idle' : 'fall';
      }

      this.updateVisuals();
      return;
    }

    if (this.landingRemainingMs > 0) {
      this.landingRemainingMs = Math.max(0, this.landingRemainingMs - deltaSeconds * 1000);

      if (this.landingRemainingMs === 0) {
        this.state = 'idle';
      }

      this.updateVisuals();
      return;
    }

    if (this.currentAttack) {
      if (this.currentAttack.canMoveDuringAttack) {
        this.applyMovementInput(moveX, moveY, deltaSeconds, bounds, false);
      }

      this.updateAttack(deltaSeconds, bounds);
      return;
    }

    this.applyMovementInput(moveX, moveY, deltaSeconds, bounds, true);
  }

  tryStartAttack(kind: 'basic' | 'special' | 'ultimate'): boolean {
    const attackId =
      kind === 'basic'
        ? this.definition.attacks.basic
        : kind === 'special'
          ? this.definition.attacks.special
          : this.definition.attacks.ultimate;
    return attackId ? this.tryStartAttackById(attackId, kind) : false;
  }

  getAttackManaCost(kind: 'basic' | 'special' | 'ultimate'): number | null {
    const attackId =
      kind === 'basic'
        ? this.definition.attacks.basic
        : kind === 'special'
          ? this.definition.attacks.special
          : this.definition.attacks.ultimate;
    const attack = attackId ? attacksById[attackId] : undefined;
    return attack ? attack.manaCost ?? 0 : null;
  }

  canStartAttack(kind: 'basic' | 'special' | 'ultimate'): boolean {
    if (this.state === 'hitstun' || this.state === 'dead' || this.currentAttack || !this.isGrounded || this.landingRemainingMs > 0) {
      return false;
    }
    const manaCost = this.getAttackManaCost(kind);
    return manaCost !== null && this.mana >= manaCost;
  }

  tryStartAttackById(attackId: string, kind: 'basic' | 'special' | 'ultimate'): boolean {
    if (this.state === 'hitstun' || this.state === 'dead' || this.currentAttack || !this.isGrounded || this.landingRemainingMs > 0) {
      return false;
    }

    const attack = attacksById[attackId];

    if (!attack) {
      return false;
    }

    if (!this.canPayAttackCost(attack)) {
      return false;
    }

    this.payAttackCost(attack);
    this.currentAttack = attack;
    this.attackElapsedMs = 0;
    this.attackPhase = 'startup';
    this.attackInstanceId += 1;
    this.hitTargets.clear();
    this.state = kind === 'basic' ? 'attack' : kind === 'special' ? 'special' : 'ultimate';
    this.updateVisuals();
    return true;
  }

  tryStartJump(): boolean {
    if (!this.isGrounded || this.currentAttack || this.state === 'hitstun' || this.state === 'dead' || this.landingRemainingMs > 0) {
      return false;
    }

    this.z = 0;
    this.velocityZ = Fighter.JUMP_VELOCITY_Z;
    this.isGrounded = false;
    this.hasUsedAirAttack = false;
    this.state = 'jump';
    this.updateVisuals();
    return true;
  }

  tryStartAirAttack(): boolean {
    if (this.isGrounded || this.hasUsedAirAttack || this.currentAttack || this.state === 'hitstun' || this.state === 'dead') {
      return false;
    }

    const attack = attacksById.air_bonk;

    if (!attack) {
      return false;
    }

    this.currentAttack = attack;
    this.attackElapsedMs = 0;
    this.attackPhase = 'startup';
    this.attackInstanceId += 1;
    this.hitTargets.clear();
    this.hasUsedAirAttack = true;
    this.state = 'airAttack';
    this.updateVisuals();
    return true;
  }

  getCurrentAttack(): AttackDefinition | null {
    return this.currentAttack;
  }

  cancelAttack(): void {
    if (!this.currentAttack) return;
    this.currentAttack = null;
    this.attackElapsedMs = 0;
    this.attackPhase = 'none';
    this.hitTargets.clear();
    if (this.state !== 'dead' && this.state !== 'hitstun') this.state = this.isGrounded ? 'idle' : 'fall';
  }

  getAttackPhase(): AttackPhase {
    return this.attackPhase;
  }

  getAttackInstanceId(): number {
    return this.attackInstanceId;
  }

  getAttackElapsedMs(): number {
    return this.attackElapsedMs;
  }

  getAttackPhaseRemainingMs(): number {
    if (!this.currentAttack) {
      return 0;
    }

    return getMoveTimelineSnapshot(this.currentAttack, this.attackElapsedMs).phaseRemainingMs;
  }

  getAnimationDebugInfo(): { animationKey: string; frameIndex: number } {
    return {
      animationKey: this.sprite?.anims.currentAnim?.key ?? 'none',
      frameIndex: this.sprite?.anims.currentFrame?.index ? this.sprite.anims.currentFrame.index - 1 : 0,
    };
  }

  hasHitTarget(targetId: string): boolean {
    return this.hitTargets.has(targetId);
  }

  registerHit(targetId: string): void {
    this.hitTargets.add(targetId);
  }

  getCombatResponse(): CombatResponse {
    return this.combatResponse;
  }

  setCombatResponse(response: CombatResponse): void {
    this.combatResponse = response;
  }

  setRolePresentation(cue: string, tint?: number): void {
    this.roleTint = tint ?? null;
    this.roleCueText.setText(cue).setVisible(cue.length > 0 && this.state !== 'dead');
  }

  getHurtbox(): Rect | null {
    const localBox = resolveFighterBox(
      this.definition.hurtbox,
      this.definition.hurtboxProfiles,
      this.getHurtboxProfileId(),
    );

    if (!localBox) {
      return null;
    }

    return this.getWorldRect(localBox);
  }

  getHurtboxProfileId(): FighterBoxProfileId {
    return getFighterBoxProfileId(this.state, this.isGrounded);
  }

  getPushbox(): Rect | null {
    const profileId = getFighterBoxProfileId(this.state, this.isGrounded);
    const localBox = resolveFighterBox(this.definition.pushbox, this.definition.pushboxProfiles, profileId);
    return localBox ? this.getWorldRect(localBox) : null;
  }

  getActiveHitboxes(): ActiveWorldHitbox[] {
    if (!this.currentAttack || this.attackPhase !== 'active' || this.state === 'dead') {
      return [];
    }

    const attack = this.currentAttack;
    const profile = attack.hitboxProfile;
    if (!profile) {
      return [{
        profileId: 'main',
        rect: this.getWorldRect(attack.hitbox),
        laneTolerance: 48,
        heightTolerance: 96,
      }];
    }

    const activeElapsedMs = this.attackElapsedMs - attack.startupMs;
    const window = getAttackHitboxWindow(profile, activeElapsedMs);
    if (!window) {
      return [];
    }

    return window.boxes.map((box) => ({
      profileId: window.id,
      rect: this.getWorldRect(box),
      laneTolerance: profile.laneTolerance,
      heightTolerance: profile.heightTolerance,
    }));
  }

  getActiveHitbox(): Rect | null {
    return this.getActiveHitboxes()[0]?.rect ?? null;
  }

  getActiveHitboxProfileId(): string {
    return this.getActiveHitboxes()[0]?.profileId ?? 'none';
  }

  showDebugContact(contactX: number, contactY: number): void {
    this.contactDebugRemainingMs = 260;
    this.contactDebug.setPosition(contactX - this.x, contactY - this.y + this.z);
    this.contactDebug.setVisible(this.debugEnabled);
  }

  advancePresentation(deltaMs: number): void {
    const safeDeltaMs = Math.max(0, deltaMs);
    this.flashRemainingMs = Math.max(0, this.flashRemainingMs - safeDeltaMs);
    this.contactDebugRemainingMs = Math.max(0, this.contactDebugRemainingMs - safeDeltaMs);
  }

  showImpactFlash(durationMs: number, color: number): void {
    this.flashRemainingMs = Math.max(this.flashRemainingMs, Math.max(0, durationMs));
    this.flashColor = color;
    this.updateVisuals();
  }

  receiveHit(hit: {
    damage: number;
    hitstunMs: number;
    knockbackX: number;
    knockbackY: number;
    sourceFacing: FighterFacing;
    launchVelocityZ?: number;
  }): void {
    if (this.state === 'dead') {
      return;
    }

    this.hp = Math.max(0, this.hp - hit.damage);
    this.currentAttack = null;
    this.attackElapsedMs = 0;
    this.attackPhase = 'none';
    this.hitTargets.clear();
    this.landingRemainingMs = 0;
    this.velocityX = hit.sourceFacing === 'right' ? hit.knockbackX : -hit.knockbackX;
    this.velocityY = hit.knockbackY;
    if (hit.launchVelocityZ && hit.launchVelocityZ > 0) {
      this.z = Math.max(this.z, 1);
      this.velocityZ = Math.max(this.velocityZ, hit.launchVelocityZ);
      this.isGrounded = false;
    }
    if (this.hp <= 0) {
      this.z = 0;
      this.velocityZ = 0;
      this.isGrounded = true;
      this.state = 'dead';
      this.hitstunRemainingMs = 0;
    } else {
      this.state = 'hitstun';
      this.hitstunRemainingMs = hit.hitstunMs;
    }

    this.updateVisuals();
  }

  receiveArmoredHit(damage: number): void {
    if (this.state === 'dead' || damage <= 0) {
      return;
    }

    this.hp = Math.max(0, this.hp - damage);
    if (this.hp <= 0) {
      this.currentAttack = null;
      this.attackElapsedMs = 0;
      this.attackPhase = 'none';
      this.hitTargets.clear();
      this.z = 0;
      this.velocityZ = 0;
      this.isGrounded = true;
      this.state = 'dead';
      this.hitstunRemainingMs = 0;
    }
    this.updateVisuals();
  }

  setDebugVisible(enabled: boolean): void {
    this.debugEnabled = enabled;
    this.debugLabel.setVisible(enabled);
    this.hurtboxDebug.setVisible(enabled);
    this.pushboxDebug.setVisible(enabled);
    for (const hitboxDebug of this.hitboxDebugRects) {
      hitboxDebug.setVisible(false);
    }
    this.contactDebug.setVisible(enabled && this.contactDebugRemainingMs > 0);
    this.syncDebugBoxes();
  }

  setStatusNote(statusNote: string): void {
    this.statusNote = statusNote;
    this.updateVisuals();
  }

  nudge(deltaX: number, deltaY: number, bounds: FighterBounds): void {
    this.x = Phaser.Math.Clamp(this.x + deltaX, bounds.minX, bounds.maxX);
    this.y = Phaser.Math.Clamp(this.y + deltaY, bounds.minY, bounds.maxY);
    this.updateVisuals();
  }

  restoreMana(): void {
    this.mana = this.maxMana;
    this.updateVisuals();
  }

  setManaForDebug(mana: number): void {
    this.mana = Phaser.Math.Clamp(mana, 0, this.maxMana);
    this.updateVisuals();
  }

  destroy(): void {
    this.container.destroy(true);
  }

  faceTarget(targetX: number): void {
    if (this.currentAttack?.canTurnDuringAttack === false && this.attackPhase === 'active') {
      return;
    }

    if (targetX === this.x) {
      return;
    }

    this.facing = targetX < this.x ? 'left' : 'right';
    this.updateVisuals();
  }

  private applyMovementInput(
    moveX: number,
    moveY: number,
    deltaSeconds: number,
    bounds: FighterBounds,
    updateGroundState: boolean,
  ): void {
    const inputVector = new Phaser.Math.Vector2(moveX, moveY);

    if (inputVector.lengthSq() > 1) {
      inputVector.normalize();
    }

    if (inputVector.x !== 0) {
      this.facing = inputVector.x < 0 ? 'left' : 'right';
    }

    this.x = Phaser.Math.Clamp(this.x + inputVector.x * this.moveSpeed * deltaSeconds, bounds.minX, bounds.maxX);
    this.y = Phaser.Math.Clamp(this.y + inputVector.y * this.moveSpeed * deltaSeconds, bounds.minY, bounds.maxY);

    if (updateGroundState && this.isGrounded) {
      this.state = inputVector.lengthSq() > 0 ? 'walk' : 'idle';
    }

    if (updateGroundState) {
      this.updateVisuals();
    }
  }

  private updateVerticalMotion(deltaSeconds: number): void {
    if (this.isGrounded && this.z <= 0) {
      return;
    }

    this.velocityZ -= Fighter.GRAVITY_Z * deltaSeconds;
    this.z += this.velocityZ * deltaSeconds;

    if (this.velocityZ < 0 && this.state === 'jump') {
      this.state = 'fall';
    }

    if (this.z > 0) {
      return;
    }

    this.z = 0;
    this.velocityZ = 0;
    this.isGrounded = true;
    this.hasUsedAirAttack = false;

    if (this.state !== 'hitstun' && this.state !== 'dead') {
      this.state = 'landing';
      this.landingRemainingMs = Fighter.LANDING_RECOVERY_MS;
    }
  }

  private updateAttack(deltaSeconds: number, bounds: FighterBounds): void {
    const attack = this.currentAttack;

    if (!attack) {
      return;
    }

    this.applyKnockback(deltaSeconds, bounds);
    this.attackElapsedMs += deltaSeconds * 1000;

    this.attackPhase = getAttackPhaseAtElapsed(attack, this.attackElapsedMs);

    if (this.attackPhase === 'none') {
      this.currentAttack = null;
      this.attackElapsedMs = 0;
      this.hitTargets.clear();
      this.state = this.isGrounded ? 'idle' : 'fall';
    }

    this.updateVisuals();
  }

  private applyKnockback(deltaSeconds: number, bounds: FighterBounds): void {
    if (this.velocityX === 0 && this.velocityY === 0) {
      return;
    }

    this.x = Phaser.Math.Clamp(this.x + this.velocityX * deltaSeconds, bounds.minX, bounds.maxX);
    this.y = Phaser.Math.Clamp(this.y + this.velocityY * deltaSeconds, bounds.minY, bounds.maxY);
    this.velocityX = Phaser.Math.Linear(this.velocityX, 0, 0.22);
    this.velocityY = Phaser.Math.Linear(this.velocityY, 0, 0.28);

    if (Math.abs(this.velocityX) < 6) {
      this.velocityX = 0;
    }

    if (Math.abs(this.velocityY) < 6) {
      this.velocityY = 0;
    }
  }

  private getWorldRect(localRect: LocalBox): Rect {
    const offsetX = this.facing === 'right' ? localRect.offsetX : -(localRect.offsetX + localRect.width);

    return {
      x: this.x + offsetX,
      y: this.y + localRect.offsetY - this.z,
      width: localRect.width,
      height: localRect.height,
    };
  }

  updateVisuals(): void {
    this.container.setPosition(this.x, this.y);
    this.visualContainer.setPosition(0, -this.z);
    this.body.setScale(this.facing === 'left' ? -1 : 1, 1);
    this.body.setFillStyle(this.getBodyColor());
    this.roleCueText.setVisible(this.roleCueText.text.length > 0 && this.state !== 'dead');
    this.syncSpriteAnimation();
    this.syncDebugBoxes();
    const suffix = this.statusNote ? `\n${this.statusNote}` : '';
    const profileLine = `hurt ${this.getHurtboxProfileId()} | hit ${this.getActiveHitboxProfileId()}`;
    this.debugLabel.setText(`${this.label}\n${this.state} ${this.attackPhase}\n${profileLine}\nHP ${this.hp} MP ${Math.floor(this.mana)}${suffix}`);
    applyDepthSort(this.container, this.y);
  }

  private regenerateMana(deltaSeconds: number): void {
    if (this.mana >= this.maxMana || this.manaRegenPerSecond <= 0) {
      return;
    }

    this.mana = Phaser.Math.Clamp(this.mana + this.manaRegenPerSecond * deltaSeconds, 0, this.maxMana);
  }

  private canPayAttackCost(attack: AttackDefinition): boolean {
    return this.mana >= (attack.manaCost ?? 0);
  }

  private payAttackCost(attack: AttackDefinition): void {
    const manaCost = attack.manaCost ?? 0;

    if (manaCost <= 0) {
      return;
    }

    this.mana = Phaser.Math.Clamp(this.mana - manaCost, 0, this.maxMana);
  }

  private syncDebugBoxes(): void {
    const hurtbox = this.getHurtbox();
    const pushbox = this.getPushbox();
    const activeHitboxes = this.getActiveHitboxes();

    while (this.hitboxDebugRects.length < activeHitboxes.length) {
      const debugRect = this.createHitboxDebugRect(this.visualContainer.scene);
      this.hitboxDebugRects.push(debugRect);
      this.visualContainer.add(debugRect);
    }

    if (hurtbox) {
      this.hurtboxDebug
        .setPosition(hurtbox.x - this.x, hurtbox.y - this.y + this.z)
        .setSize(hurtbox.width, hurtbox.height);
    }
    if (pushbox) {
      this.pushboxDebug
        .setPosition(pushbox.x - this.x, pushbox.y - this.y + this.z)
        .setSize(pushbox.width, pushbox.height);
    }

    for (const [index, hitboxDebug] of this.hitboxDebugRects.entries()) {
      const activeHitbox = activeHitboxes[index]?.rect;
      if (activeHitbox) {
        hitboxDebug
          .setPosition(activeHitbox.x - this.x, activeHitbox.y - this.y + this.z)
          .setSize(activeHitbox.width, activeHitbox.height);
      }
      hitboxDebug.setVisible(this.debugEnabled && activeHitbox !== undefined);
    }

    this.hurtboxDebug.setVisible(this.debugEnabled && hurtbox !== null);
    this.pushboxDebug.setVisible(this.debugEnabled && pushbox !== null);
    this.contactDebug.setVisible(this.debugEnabled && this.contactDebugRemainingMs > 0);
    this.debugLabel.setVisible(this.debugEnabled);
  }

  private createHitboxDebugRect(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
    return scene.add.rectangle(0, 0, 1, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xfb5607)
      .setFillStyle(0xfb5607, 0.1)
      .setVisible(false);
  }

  private getBodyColor(): number {
    if (this.flashRemainingMs > 0) {
      return this.flashColor;
    }

    if (this.state === 'dead') {
      return 0x4b5563;
    }

    if (this.roleTint !== null) {
      return this.roleTint;
    }

    if (this.state === 'special') {
      return 0x9d4edd;
    }

    if (this.state === 'ultimate') {
      return 0xffd166;
    }

    if (this.state === 'attack') {
      return 0xf4a261;
    }

    if (this.state === 'walk') {
      return 0xb58c54;
    }

    return this.baseFillColor;
  }

  private syncSpriteAnimation(): void {
    if (!this.sprite || !this.definition.sprite) {
      return;
    }

    this.sprite.setFlipX(this.facing === 'left');
    const attackScale = this.currentAttack ? this.definition.sprite.attackScaleOverrides?.[this.currentAttack.id] ?? 1 : 1;
    const frameScale = this.getCurrentSpriteFrameScale();
    const spriteScale = this.definition.sprite.scale * attackScale * frameScale * (this.state === 'airAttack' ? 1.06 : 1);
    this.sprite.setScale(spriteScale);

    if (this.flashRemainingMs > 0) {
      this.sprite.setTint(this.flashColor);
    } else if (this.roleTint !== null) {
      this.sprite.setTint(this.roleTint);
    } else {
      this.sprite.clearTint();
    }

    const attackAnimationKey = this.currentAttack
      ? this.definition.sprite.attackAnimations?.[this.currentAttack.id]
      : undefined;
    const airAttackFallbackKey = this.currentAttack?.id === 'air_bonk' ? this.definition.sprite.animations.attack : undefined;
    const animationKey =
      attackAnimationKey ?? airAttackFallbackKey ?? this.definition.sprite.animations[this.state] ?? this.definition.sprite.animations.idle;

    if (!animationKey || this.sprite.anims.currentAnim?.key === animationKey) {
      this.applySpriteFrameOffset();
      return;
    }

    this.sprite.play(animationKey, true);
    this.applySpriteFrameOffset();
  }

  private applySpriteFrameOffset(): void {
    if (!this.sprite || !this.definition.sprite) {
      return;
    }

    const animationKey = this.sprite.anims.currentAnim?.key;
    const frameOffsets = animationKey ? this.definition.sprite.frameOffsetSets?.[animationKey] : undefined;

    if (!frameOffsets || frameOffsets.length === 0) {
      this.sprite.setPosition(0, 0);
      return;
    }

    const frameIndex = this.sprite.anims.currentFrame?.index ? this.sprite.anims.currentFrame.index - 1 : 0;
    const offset = frameOffsets[frameIndex] ?? frameOffsets[frameOffsets.length - 1] ?? { x: 0, y: 0 };
    const facingDirection = this.facing === 'left' ? -1 : 1;
    this.sprite.setPosition(offset.x * facingDirection, offset.y);
  }

  private getCurrentSpriteFrameScale(): number {
    if (!this.sprite || !this.definition.sprite) {
      return 1;
    }

    const animationKey = this.sprite.anims.currentAnim?.key;
    const frameScales = animationKey ? this.definition.sprite.frameScaleSets?.[animationKey] : undefined;

    if (!frameScales || frameScales.length === 0) {
      return 1;
    }

    const frameIndex = this.sprite.anims.currentFrame?.index ? this.sprite.anims.currentFrame.index - 1 : 0;
    return frameScales[frameIndex] ?? frameScales[frameScales.length - 1] ?? 1;
  }
}
