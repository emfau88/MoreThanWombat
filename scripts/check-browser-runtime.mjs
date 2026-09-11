// Isolated headless regression runner. Uses no personal browser profile.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const url = process.argv[2] ?? 'http://127.0.0.1:4189/MoreThanWombat/tests/browser/g1.html';
const outputDir = resolve(process.argv[3] ?? 'docs/qa/g1-runtime-2026-09-05');
const profile = await mkdtemp(join(tmpdir(), 'wombat-browser-qa-'));
const executable = process.env.BROWSER_EXECUTABLE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const child = spawn(executable, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-extensions',
  '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', 'about:blank'],
{ windowsHide: true, stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await sleep(100); }
  }
  if (!port) throw new Error('Isolated headless browser did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
      else entry.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args);
    else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
      errors.push({ url: message.params.response.url, status: message.params.response.status });
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.enable');
  const width = Number(process.argv[4] ?? process.env.QA_WIDTH ?? 844);
  const height = Number(process.argv[5] ?? process.env.QA_HEIGHT ?? 390);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url });
  await mkdir(outputDir, { recursive: true });
  if (!url.includes('/tests/browser/')) {
    for (let attempt = 0; attempt < 240; attempt++) {
      if (await evaluate('window.__MORE_THAN_WOMBAT_GAME__?.scene.isActive("MainMenuScene")')) break;
      await sleep(250);
    }
    const snapshots = [];
    const capture = async (label) => {
      await sleep(300);
      const metrics = await evaluate(`(() => {
        const game = window.__MORE_THAN_WOMBAT_GAME__;
        const rect = game.canvas.getBoundingClientRect();
        const scene = game.scene.getScene('BattleScene');
        return { viewport: [innerWidth, innerHeight], canvas: [rect.x, rect.y, rect.width, rect.height],
          backing: [game.canvas.width, game.canvas.height], logical: [game.scale.width, game.scale.height],
          phase: scene.encounterDirector?.getPhase(), playerId: scene.player?.instanceId,
          imageRendering: getComputedStyle(game.canvas).imageRendering };
      })()`);
      snapshots.push({ label, ...metrics });
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(outputDir, `${label}.png`), Buffer.from(shot.data, 'base64'));
    };
    await capture('menu-landscape');
    await evaluate(`window.__MORE_THAN_WOMBAT_GAME__.scene.stop('MainMenuScene');
      window.__MORE_THAN_WOMBAT_GAME__.scene.start('BattleScene', {mode:'waves'}); void 0;`);
    await sleep(1600);
    await capture('wave-landscape');
    if (process.env.QA_CAPTURE_UI_R4 === '1') {
      const waveHudState = await evaluate(`(() => {
        const scene = window.__MORE_THAN_WOMBAT_GAME__.scene.getScene('BattleScene');
        const enemy = scene.waveEnemies[0];
        enemy.hp = Math.max(1, enemy.maxHp * 0.62);
        scene.revealLocalEnemyHealthBars([{ attacker: scene.player, defender: enemy, damage: 1 }]);
        scene.enemyHealthBars.update(0, scene.waveEnemies);
        return {
          opponentVisible: scene.hud.opponentBar.frame.visible,
          priorityVisible: scene.hud.priorityBar.frame.visible,
          localBars: scene.enemyHealthBars.getActiveCount(),
          header: scene.modeText.text,
        };
      })()`);
      assert.equal(waveHudState.opponentVisible, false, 'Normal Wave must not show an arbitrary global opponent HUD');
      assert.equal(waveHudState.priorityVisible, false, 'Normal Wave must not show the priority HUD');
      assert.equal(waveHudState.localBars, 1, 'Damaged normal-wave enemy must show one local health bar');
      assert.match(waveHudState.header, /1 LEFT/, 'Wave header must expose the remaining enemy count');
      await capture('wave-local-health');
    }
    if (process.env.QA_CAPTURE_HUD_GATES === '1') {
      const originalResources = await evaluate(`(() => {
        const game = window.__MORE_THAN_WOMBAT_GAME__;
        const scene = game.scene.getScene('BattleScene');
        game.scene.pause('BattleScene');
        return { hp: scene.player.hp, mana: scene.player.mana };
      })()`);
      for (const [label, ratio] of [['0', 0], ['1', 0.01], ['50', 0.5], ['100', 1]]) {
        await evaluate(`(() => {
          const scene = window.__MORE_THAN_WOMBAT_GAME__.scene.getScene('BattleScene');
          scene.player.hp = scene.player.maxHp * ${ratio};
          scene.player.mana = scene.player.maxMana * ${ratio};
          scene.hud.update(scene.player, scene.getHudEnemy());
        })()`);
        await capture(`hud-fill-${label}`);
      }
      await evaluate(`(() => {
        const game = window.__MORE_THAN_WOMBAT_GAME__;
        const scene = game.scene.getScene('BattleScene');
        scene.player.hp = ${JSON.stringify(originalResources.hp)};
        scene.player.mana = ${JSON.stringify(originalResources.mana)};
        scene.hud.update(scene.player, scene.getHudEnemy());
        game.scene.resume('BattleScene');
      })()`);
    }
    for (const [label, w, h] of [['portrait', 390, 844], ['landscape-after-rotation', 844, 390], ['wide-landscape', 932, 430]]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 3, mobile: true });
      await sleep(600);
      await capture(label);
    }
    const safeAreaShift = await evaluate(`(() => {
      const game = window.__MORE_THAN_WOMBAT_GAME__;
      const controls = game.scene.getScene('BattleScene').mobileControls;
      const before = { attackX: controls.layout.attack.x, attackY: controls.layout.attack.y,
        joystickX: controls.layout.joystick.x, menuX: controls.layout.menu.x };
      document.documentElement.style.setProperty('--game-safe-area-right', '34px');
      document.documentElement.style.setProperty('--game-safe-area-bottom', '20px');
      document.documentElement.style.setProperty('--game-safe-area-left', '24px');
      controls.updateLayout(game.scale.width, game.scale.height);
      const after = { attackX: controls.layout.attack.x, attackY: controls.layout.attack.y,
        joystickX: controls.layout.joystick.x, menuX: controls.layout.menu.x };
      return { before, after };
    })()`);
    assert.ok(safeAreaShift.before.attackX - safeAreaShift.after.attackX > 30, 'Right safe area does not shift action controls');
    assert.ok(safeAreaShift.before.attackY - safeAreaShift.after.attackY > 20, 'Bottom safe area does not shift action controls');
    assert.ok(safeAreaShift.after.joystickX - safeAreaShift.before.joystickX > 20, 'Left safe area does not shift joystick home');
    assert.ok(safeAreaShift.after.menuX - safeAreaShift.before.menuX > 20, 'Left safe area does not shift menu');
    await capture('wide-safe-area');
    await evaluate(`(() => {
      const game = window.__MORE_THAN_WOMBAT_GAME__;
      for (const side of ['right', 'bottom', 'left']) {
        document.documentElement.style.removeProperty('--game-safe-area-' + side);
      }
      game.scene.getScene('BattleScene').mobileControls.updateLayout(game.scale.width, game.scale.height);
    })()`);
    await writeFile(join(outputDir, 'mobile-metrics.json'), JSON.stringify({ snapshots, errors }, null, 2));
    console.log(JSON.stringify({ snapshots, errors }, null, 2));
    for (const snapshot of snapshots) {
      const [w, h] = snapshot.viewport;
      const [x, y, cw, ch] = snapshot.canvas;
      assert.ok(Math.abs(cw / ch - snapshot.logical[0] / snapshot.logical[1]) < 0.005, `${snapshot.label}: aspect ratio distorted`);
      assert.ok(x >= -1 && y >= -1 && x + cw <= w + 1 && y + ch <= h + 1, `${snapshot.label}: canvas clipped`);
      if (w > h) assert.ok(w - cw < 2 && h - ch < 2, `${snapshot.label}: unused landscape borders`);
    }
    assert.ok(snapshots.slice(1).every((snapshot) => snapshot.playerId === snapshots[1].playerId), 'Rotation restarted the Wave run');
    await evaluate(`(() => {
      const controls = window.__MORE_THAN_WOMBAT_GAME__.scene.getScene('BattleScene').mobileControls;
      const getState = controls.getState.bind(controls);
      window.__QA_ACTIONS__ = [];
      controls.getState = () => {
        const state = getState();
        for (const key of ['attackPressed','specialPressed','ultimatePressed','jumpPressed','defendPressed']) {
          if (state[key]) window.__QA_ACTIONS__.push(key);
        }
        return state;
      };
    })()`);
    const controlPoint = (name, offsetX = 0, offsetY = 0) => evaluate(`(() => {
      const game = window.__MORE_THAN_WOMBAT_GAME__;
      const scene = game.scene.getScene('BattleScene');
      const rect = game.canvas.getBoundingClientRect();
      const control = scene.mobileControls.controls.${name};
      return { x: rect.x + (control.x + ${offsetX}) * rect.width / game.scale.width,
        y: rect.y + (control.y + ${offsetY}) * rect.height / game.scale.height, id: 1 };
    })()`);
    const edgeDirections = {
      attack: [1, 0],
      jump: [-1, 0],
      special: [-1, 0],
      defend: [1, 0],
      ultimate: [0, 1],
    };
    for (const action of ['attack', 'special', 'ultimate', 'jump', 'defend']) {
      const radius = await evaluate(`window.__MORE_THAN_WOMBAT_GAME__.scene.getScene('BattleScene').mobileControls.controls.${action}Button.radius`);
      assert.ok(Math.abs(radius - (action === 'attack' ? 46 : 41)) < 0.001,
      `${action}: wrong rendered radius`);
      await evaluate('window.__QA_ACTIONS__ = []; void 0;');
      const [directionX, directionY] = edgeDirections[action];
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
        await controlPoint(`${action}Button`, radius * 0.94 * directionX, radius * 0.94 * directionY),
      ] });
      await sleep(100);
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await sleep(100);
      assert.deepEqual(await evaluate('window.__QA_ACTIONS__'), [`${action}Pressed`], `${action}: edge touch should trigger exactly one matching action`);
    }
    await evaluate(`(() => {
      const battle = window.__MORE_THAN_WOMBAT_GAME__.scene.getScene('BattleScene');
      const player = battle.player;
      player.cancelAttack();
      player.z = 0;
      player.velocityZ = 0;
      player.isGrounded = true;
      player.state = 'idle';
      for (const enemy of battle.waveEnemies) {
        enemy.faction = 'player';
      }
    })()`);
    const joystickStart = await controlPoint('base', 35, -20);
    const joystickRight = await controlPoint('base', 80, -20);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [joystickStart] });
    assert.ok(await evaluate(`(() => {
      const controls = window.__MORE_THAN_WOMBAT_GAME__.scene.getScene('BattleScene').mobileControls;
      return controls.joystickCenter.x - controls.layout.joystick.x > 30;
    })()`), 'Floating joystick does not move its origin beneath the initial touch');
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [joystickRight] });
    await sleep(300);
    assert.ok(await evaluate('window.__MORE_THAN_WOMBAT_GAME__.scene.getScene("BattleScene").mobileControls.touchState.moveX > 0'), 'Rotated joystick misses touch');
    const activeJoystickShot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(outputDir, 'joystick-active.png'), Buffer.from(activeJoystickShot.data, 'base64'));
    assert.equal(await evaluate('window.__MORE_THAN_WOMBAT_GAME__.scene.getScene("BattleScene").player.state'), 'run',
      'Sustained full joystick input should start Run');
    const attackTouch = { ...(await controlPoint('attackButton')), id: 2 };
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [joystickRight, attackTouch] });
    let dashState = '';
    for (let attempt = 0; attempt < 12; attempt++) {
      await sleep(25);
      dashState = await evaluate('window.__MORE_THAN_WOMBAT_GAME__.scene.getScene("BattleScene").player.state');
      if (dashState === 'dashAttack') break;
    }
    assert.equal(dashState, 'dashAttack',
      'ATK while holding the joystick should start Dash Attack');
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(100);
    assert.equal(await evaluate('window.__MORE_THAN_WOMBAT_GAME__.scene.getScene("BattleScene").mobileControls.touchState.moveX'), 0, 'Joystick sticks after release');
    assert.ok(await evaluate(`(() => {
      const controls = window.__MORE_THAN_WOMBAT_GAME__.scene.getScene('BattleScene').mobileControls;
      return Math.abs(controls.joystickCenter.x - controls.layout.joystick.x) < 0.01
        && Math.abs(controls.joystickCenter.y - controls.layout.joystick.y) < 0.01;
    })()`), 'Floating joystick does not return to its safe home position');
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await controlPoint('menuButton')] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(400);
    assert.ok(await evaluate('window.__MORE_THAN_WOMBAT_GAME__.scene.isActive("MainMenuScene")'), 'Menu touch misses after rotation');
    assert.equal(errors.length, 0, 'Uncaught browser errors');
    const report = 'PASS — adaptive compact layout, rotation, aspect ratio, preserved Wave state, five nearest-target edge touches, floating joystick Run, touch Dash Attack, release and menu touch';
    await writeFile(join(outputDir, 'checks.log'), `${report}\n${JSON.stringify(await send('Browser.getVersion'))}\n`);
    console.log(report);
  } else {
  let report;
  for (let attempt = 0; attempt < 240; attempt++) {
    await sleep(250);
    report = await evaluate('document.querySelector("#results")?.textContent ?? document.title');
    if (/^(PASS|FAIL)/.test(report)) break;
  }
  await writeFile(join(outputDir, `runtime-${width}x${height}.log`), `${report}\n${JSON.stringify(errors, null, 2)}\n`);
  console.log(report.split('\n')[0]);
  if (!report?.startsWith('PASS') || errors.length) process.exitCode = 1;
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(outputDir, `runtime-${width}x${height}.png`), Buffer.from(screenshot.data, 'base64'));
  }
} finally {
  socket?.close();
  child.kill();
}
