import Phaser from 'phaser';
import { applyDepthSort } from '../core/DepthSort';
import type { AttackDefinition } from '../data/attacks';
import { attacksById } from '../data/attacks';
import type { Rect } from '../utils/Rect';

export type FighterFacing = 'left' | 'right';
export type FighterState =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'special'
  | 'hitstun'
  | 'jump'
  | 'fall'
  | 'airAttack'
  | 'landing'
  | 'dead';
export type AttackPhase = 'startup' | 'active' | 'recovery' | 'none';
type LocalBox = {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export type FighterDefinition = {
  id: string;
  label: string;
  fillColor: number;
  outlineColor: number;
  maxHp: number;
  moveSpeed: number;
  width: number;
  height: number;
  hurtbox: LocalBox;
  pushbox: LocalBox;
  attacks: {
    basic: string;
    special?: string;
  };
  sprite?: {
    textureKey: string;
    scale: number;
    animations: Partial<Record<FighterState, string>>;
    attackAnimations?: Partial<Record<string, string>>;
    frameOffsetSets?: Record<string, Array<{ x: number; y: number }>>;
  };
};

export type FighterBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export class Fighter {
  private static readonly JUMP_VELOCITY_Z = 430;
  private static readonly GRAVITY_Z = 1120;
  private static readonly LANDING_RECOVERY_MS = 90;
  private static nextInstanceId = 1;

  readonly instanceId: number;
  readonly id: string;
  readonly label: string;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly bodyWidth: number;
  readonly bodyHeight: number;
  readonly container: Phaser.GameObjects.Container;
  readonly visualContainer: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Rectangle;
  readonly sprite?: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly debugLabel: Phaser.GameObjects.Text;
  readonly hurtboxDebug: Phaser.GameObjects.Rectangle;
  readonly pushboxDebug: Phaser.GameObjects.Rectangle;
  readonly hitboxDebug: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  z = 0;
  velocityZ = 0;
  hp: number;
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
  private attackInstanceId = 0;
  private landingRemainingMs = 0;
  private hasUsedAirAttack = false;

  constructor(scene: Phaser.Scene, definition: FighterDefinition, spawn: { x: number; y: number }) {
    this.definition = definition;
    this.instanceId = Fighter.nextInstanceId;
    Fighter.nextInstanceId += 1;
    this.id = definition.id;
    this.label = definition.label;
    this.maxHp = definition.maxHp;
    this.moveSpeed = definition.moveSpeed;
    this.bodyWidth = definition.width;
    this.bodyHeight = definition.height;
    this.baseFillColor = definition.fillColor;
    this.x = spawn.x;
    this.y = spawn.y;
    this.hp = definition.maxHp;

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
    this.hurtboxDebug = scene.add.rectangle(0, 0, definition.hurtbox.width, definition.hurtbox.height).setOrigin(0, 0);
    this.hurtboxDebug.setStrokeStyle(2, 0x48bfe3).setFillStyle(0x48bfe3, 0.08);
    this.pushboxDebug = scene.add.rectangle(0, 0, definition.pushbox.width, definition.pushbox.height).setOrigin(0, 0);
    this.pushboxDebug.setStrokeStyle(2, 0xffb703).setFillStyle(0xffb703, 0.08);
    this.hitboxDebug = scene.add.rectangle(0, 0, 1, 1).setOrigin(0, 0);
    this.hitboxDebug.setStrokeStyle(2, 0xfb5607).setFillStyle(0xfb5607, 0.1).setVisible(false);
    this.visualContainer = scene.add.container(0, 0, [
      this.body,
      ...(this.sprite ? [this.sprite] : []),
      this.hurtboxDebug,
      this.pushboxDebug,
      this.hitboxDebug,
      this.debugLabel,
    ]);

    this.container = scene.add.container(this.x, this.y, [
      this.shadow,
      this.visualContainer,
    ]);
    this.updateVisuals();
  }

  update(deltaSeconds: number, moveX: number, moveY: number, bounds: FighterBounds): void {
    this.flashRemainingMs = Math.max(0, this.flashRemainingMs - deltaSeconds * 1000);

    if (this.state === 'dead') {
      this.z = 0;
      this.velocityZ = 0;
      this.isGrounded = true;
      this.updateVisuals();
      return;
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

  tryStartAttack(kind: 'basic' | 'special'): boolean {
    const attackId = kind === 'basic' ? this.definition.attacks.basic : this.definition.attacks.special;
    return attackId ? this.tryStartAttackById(attackId, kind) : false;
  }

  tryStartAttackById(attackId: string, kind: 'basic' | 'special'): boolean {
    if (this.state === 'hitstun' || this.state === 'dead' || this.currentAttack || !this.isGrounded || this.landingRemainingMs > 0) {
      return false;
    }

    const attack = attacksById[attackId];

    if (!attack) {
      return false;
    }

    this.currentAttack = attack;
    this.attackElapsedMs = 0;
    this.attackPhase = 'startup';
    this.attackInstanceId += 1;
    this.hitTargets.clear();
    this.state = kind === 'basic' ? 'attack' : 'special';
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

  getAttackPhase(): AttackPhase {
    return this.attackPhase;
  }

  getAttackInstanceId(): number {
    return this.attackInstanceId;
  }

  hasHitTarget(targetId: string): boolean {
    return this.hitTargets.has(targetId);
  }

  registerHit(targetId: string): void {
    this.hitTargets.add(targetId);
  }

  getHurtbox(): Rect | null {
    if (this.state === 'dead') {
      return null;
    }

    return this.getWorldRect(this.definition.hurtbox);
  }

  getPushbox(): Rect {
    return this.getWorldRect(this.definition.pushbox);
  }

  getActiveHitbox(): Rect | null {
    if (!this.currentAttack || this.attackPhase !== 'active' || this.state === 'dead') {
      return null;
    }

    return this.getWorldRect(this.currentAttack.hitbox);
  }

  receiveHit(hit: {
    damage: number;
    hitstunMs: number;
    knockbackX: number;
    knockbackY: number;
    sourceFacing: FighterFacing;
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
    this.flashRemainingMs = 110;

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

  setDebugVisible(enabled: boolean): void {
    this.debugEnabled = enabled;
    this.debugLabel.setVisible(enabled);
    this.hurtboxDebug.setVisible(enabled);
    this.pushboxDebug.setVisible(enabled);
    this.hitboxDebug.setVisible(enabled && this.attackPhase === 'active' && this.currentAttack !== null);
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

    if (this.attackElapsedMs < attack.startupMs) {
      this.attackPhase = 'startup';
    } else if (this.attackElapsedMs < attack.startupMs + attack.activeMs) {
      this.attackPhase = 'active';
    } else if (this.attackElapsedMs < attack.startupMs + attack.activeMs + attack.recoveryMs) {
      this.attackPhase = 'recovery';
    } else {
      this.currentAttack = null;
      this.attackElapsedMs = 0;
      this.attackPhase = 'none';
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
    this.syncSpriteAnimation();
    this.syncDebugBoxes();
    const suffix = this.statusNote ? `\n${this.statusNote}` : '';
    this.debugLabel.setText(`${this.label}\n${this.state} ${this.attackPhase}\nHP ${this.hp}${suffix}`);
    applyDepthSort(this.container, this.y);
  }

  private syncDebugBoxes(): void {
    const hurtbox = this.getWorldRect(this.definition.hurtbox);
    const pushbox = this.getWorldRect(this.definition.pushbox);
    const activeHitbox = this.getActiveHitbox();

    this.hurtboxDebug.setPosition(hurtbox.x - this.x, hurtbox.y - this.y + this.z);
    this.pushboxDebug.setPosition(pushbox.x - this.x, pushbox.y - this.y + this.z);

    if (activeHitbox) {
      this.hitboxDebug.setPosition(activeHitbox.x - this.x, activeHitbox.y - this.y + this.z);
      this.hitboxDebug.setSize(activeHitbox.width, activeHitbox.height);
    }

    this.hurtboxDebug.setVisible(this.debugEnabled);
    this.pushboxDebug.setVisible(this.debugEnabled);
    this.hitboxDebug.setVisible(this.debugEnabled && activeHitbox !== null);
    this.debugLabel.setVisible(this.debugEnabled);
  }

  private getBodyColor(): number {
    if (this.flashRemainingMs > 0) {
      return 0xfff1bf;
    }

    if (this.state === 'dead') {
      return 0x4b5563;
    }

    if (this.state === 'hitstun') {
      return 0xe76f51;
    }

    if (this.state === 'special') {
      return 0x9d4edd;
    }

    if (this.state === 'airAttack') {
      return 0xffc857;
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
    const spriteScale = this.definition.sprite.scale * (this.state === 'airAttack' ? 1.06 : 1);
    this.sprite.setScale(spriteScale);

    if (this.flashRemainingMs > 0) {
      this.sprite.setTint(0xfff1bf);
    } else if (this.state === 'hitstun') {
      this.sprite.setTint(0xffb4a2);
    } else if (this.state === 'airAttack') {
      this.sprite.setTint(0xffd166);
    } else {
      this.sprite.setTint(0xffffff);
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

    const frameName = Number(this.sprite.frame.name);
    const frameIndex = Number.isFinite(frameName) ? frameName : 0;
    const offset = frameOffsets[frameIndex] ?? frameOffsets[frameOffsets.length - 1] ?? { x: 0, y: 0 };
    const facingDirection = this.facing === 'left' ? -1 : 1;
    this.sprite.setPosition(offset.x * facingDirection, offset.y);
  }
}
