import * as Phaser from "phaser";

export interface VisualState {
  distance: number; // 0 = jauh, 100 = mencapai pemain
  bossHp: number;
  bossMaxHp: number;
}

const SCENE_KEY = "boss";

export class BossScene extends Phaser.Scene {
  private state: VisualState = { distance: 0, bossHp: 100, bossMaxHp: 100 };
  private boss!: Phaser.GameObjects.Container;
  private player!: Phaser.GameObjects.Container;
  private bossGlow!: Phaser.GameObjects.Arc;
  private slash!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; r: number; a: number }[] = [];
  private bob = 0;

  constructor() {
    super(SCENE_KEY);
  }

  create() {
    this.cameras.main.setBackgroundColor("#070a16");
    this.bg = this.add.graphics();
    this.drawBackground();

    this.bossGlow = this.add
      .circle(this.scale.width - 120, this.scale.height * 0.55, 74, 0xfb7185, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.boss = this.buildBoss();
    this.player = this.buildPlayer();

    this.slash = this.add.graphics().setDepth(30);

    this.layout();

    this.scale.on("resize", () => {
      this.drawBackground();
      this.layout();
    });

    this.input.on("pointerdown", () => {
      // sentuhan kecil agar terasa interaktif
      this.tweens.add({
        targets: this.player,
        y: this.player.y - 6,
        duration: 90,
        yoyo: true,
      });
    });
  }

  private drawBackground() {
    const width = this.scale.width;
    const height = this.scale.height;
    const g = this.bg;
    g.clear();

    g.fillGradientStyle(0x1b1440, 0x241a52, 0x0a0e1f, 0x070a16, 1);
    g.fillRect(0, 0, width, height);

    // bintang
    this.stars = Array.from({ length: 46 }).map((_, index) => ({
      x: (index * 97.3) % width,
      y: (index * 53.7) % (height * 0.62),
      r: (index % 3) * 0.7 + 0.7,
      a: 0.25 + ((index * 7) % 40) / 100,
    }));
    this.stars.forEach((star) => {
      g.fillStyle(0xffffff, star.a);
      g.fillCircle(star.x, star.y, star.r);
    });

    // bulan
    g.fillStyle(0x22d3ee, 0.09);
    g.fillCircle(width * 0.78, height * 0.24, 64);
    g.fillStyle(0x22d3ee, 0.22);
    g.fillCircle(width * 0.78, height * 0.24, 34);
    g.fillStyle(0xd8f7ff, 0.85);
    g.fillCircle(width * 0.78, height * 0.24, 22);

    // gunung berlapis
    g.fillStyle(0x171e3a, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(0, height),
        new Phaser.Geom.Point(0, height * 0.62),
        new Phaser.Geom.Point(width * 0.22, height * 0.44),
        new Phaser.Geom.Point(width * 0.42, height * 0.66),
        new Phaser.Geom.Point(width * 0.6, height * 0.5),
        new Phaser.Geom.Point(width * 0.82, height * 0.7),
        new Phaser.Geom.Point(width, height * 0.58),
        new Phaser.Geom.Point(width, height),
      ],
      true,
    );

    g.fillStyle(0x0d1226, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(0, height),
        new Phaser.Geom.Point(0, height * 0.82),
        new Phaser.Geom.Point(width * 0.3, height * 0.72),
        new Phaser.Geom.Point(width * 0.55, height * 0.86),
        new Phaser.Geom.Point(width * 0.78, height * 0.76),
        new Phaser.Geom.Point(width, height * 0.88),
        new Phaser.Geom.Point(width, height),
      ],
      true,
    );

    // tanah
    g.fillStyle(0x080c1a, 1);
    g.fillRect(0, height * 0.82, width, height * 0.18);
    g.lineStyle(1, 0x8b6cff, 0.35);
    g.lineBetween(0, height * 0.82, width, height * 0.82);

    // glow lantai
    g.fillStyle(0x8b6cff, 0.08);
    g.fillEllipse(width / 2, height * 0.84, width * 0.9, 40);
  }

  private buildPlayer() {
    const container = this.add.container(0, 0).setDepth(20);
    const g = this.add.graphics();

    // badan
    g.fillStyle(0x6d4cf1, 1);
    g.fillRoundedRect(-16, -6, 32, 34, 12);
    g.fillStyle(0x22d3ee, 0.25);
    g.fillRoundedRect(-16, 8, 32, 8, 5);

    // kepala
    g.fillStyle(0xffe9dc, 1);
    g.fillCircle(0, -20, 14);
    // rambut
    g.fillStyle(0x3a2f6b, 1);
    g.fillCircle(0, -24, 14);
    g.fillRect(-14, -24, 28, 8);
    g.fillStyle(0xffe9dc, 1);
    g.fillCircle(0, -17, 11);
    // mata
    g.fillStyle(0x151233, 1);
    g.fillCircle(-4, -18, 1.8);
    g.fillCircle(4, -18, 1.8);
    // pedang
    g.fillStyle(0xbfe9ff, 1);
    g.fillRect(18, -30, 4, 40);
    g.fillStyle(0x22d3ee, 1);
    g.fillRect(30, -4, 10, 3);

    container.add(g);
    container.setSize(40, 60);
    return container;
  }

  private buildBoss() {
    const container = this.add.container(0, 0).setDepth(15);
    const g = this.add.graphics();

    // aura
    g.fillStyle(0xfb7185, 0.12);
    g.fillCircle(0, 0, 62);

    // duri
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const x1 = Math.cos(angle) * 36;
      const y1 = Math.sin(angle) * 36;
      const x2 = Math.cos(angle) * 56;
      const y2 = Math.sin(angle) * 56;
      g.lineStyle(6, 0x2b1f45, 1);
      g.lineBetween(x1, y1, x2, y2);
      g.fillStyle(0xfb7185, 0.7);
      g.fillCircle(x2, y2, 2.4);
    }

    // badan
    g.fillStyle(0x2b1f45, 1);
    g.fillCircle(0, 0, 40);
    g.lineStyle(2, 0xfb7185, 0.8);
    g.strokeCircle(0, 0, 40);

    // mata
    g.fillStyle(0xfb7185, 1);
    g.fillCircle(-13, -6, 6);
    g.fillCircle(13, -6, 6);
    g.fillStyle(0xffe4ea, 1);
    g.fillCircle(-13, -7, 2.2);
    g.fillCircle(13, -7, 2.2);

    // mulut bergerigi
    g.fillStyle(0x090b16, 1);
    g.fillRoundedRect(-16, 12, 32, 12, 4);
    g.fillStyle(0xffffff, 0.85);
    for (let index = 0; index < 4; index += 1) {
      g.fillTriangle(-14 + index * 8, 12, -10 + index * 8, 12, -12 + index * 8, 17);
    }

    container.add(g);
    container.setSize(120, 120);
    return container;
  }

  private layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const playerX = Math.max(74, width * 0.14);
    const playerY = height * 0.8;
    this.player?.setPosition(playerX, playerY);

    if (this.bossGlow) this.bossGlow.setPosition(width - 120, height * 0.55);
    if (this.boss) {
      const startX = width - 110;
      const targetX = playerX + 96;
      const x = startX - (this.state.distance / 100) * (startX - targetX);
      this.boss.setPosition(x, height * 0.55);
    }
  }

  setVisualState(state: VisualState) {
    this.state = state;
    this.layout();
  }

  playAttack(strong = false) {
    const targetX = this.boss.x;
    const targetY = this.boss.y;
    const startX = this.player.x;

    this.tweens.add({
      targets: this.player,
      x: startX + (strong ? 90 : 60),
      duration: 110,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    this.tweens.add({
      targets: this.boss,
      alpha: 0.4,
      duration: 90,
      yoyo: true,
      repeat: 1,
    });

    this.slash.clear();
    this.slash.lineStyle(4, 0x22d3ee, 0.95);
    this.slash.beginPath();
    this.slash.arc(targetX, targetY, 46, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60));
    this.slash.strokePath();
    this.slash.setAlpha(1);
    this.tweens.add({
      targets: this.slash,
      alpha: 0,
      duration: 260,
    });

    for (let index = 0; index < 10; index += 1) {
      const spark = this.add.circle(targetX, targetY, Phaser.Math.Between(2, 5), 0x22d3ee, 0.95).setDepth(40);
      this.tweens.add({
        targets: spark,
        x: targetX + Phaser.Math.Between(-70, 70),
        y: targetY + Phaser.Math.Between(-70, 70),
        alpha: 0,
        duration: 380,
        onComplete: () => spark.destroy(),
      });
    }

    this.cameras.main.shake(strong ? 180 : 100, strong ? 0.008 : 0.004);
  }

  playHurt() {
    this.cameras.main.flash(160, 251, 113, 133);
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
    });
    this.cameras.main.shake(160, 0.006);
  }

  playVictory() {
    const width = this.scale.width;
    const height = this.scale.height;
    for (let index = 0; index < 40; index += 1) {
      const color = [0x22d3ee, 0x8b6cff, 0x34d399, 0xfbbf24][index % 4];
      const spark = this.add.circle(
        Phaser.Math.Between(width * 0.3, width * 0.8),
        Phaser.Math.Between(height * 0.2, height * 0.6),
        Phaser.Math.Between(3, 6),
        color,
        1,
      );
      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(60, 180),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1400),
        onComplete: () => spark.destroy(),
      });
    }
  }

  playDefeat() {
    this.cameras.main.shake(400, 0.01);
    this.tweens.add({
      targets: [this.player, this.boss],
      alpha: 0.2,
      duration: 500,
    });
  }

  update(time: number) {
    this.bob += 0.002;
    if (this.boss) {
      this.boss.y = this.scale.height * 0.55 + Math.sin(time / 520) * 8;
    }
    if (this.player) {
      this.player.y = this.scale.height * 0.8 + Math.sin(time / 380) * 3;
    }
    if (this.bossGlow) {
      this.bossGlow.setScale(1 + Math.sin(time / 600) * 0.06);
      this.bossGlow.setAlpha(0.1 + Math.sin(time / 700) * 0.03);
    }
  }
}

export const bossSceneKey = SCENE_KEY;
