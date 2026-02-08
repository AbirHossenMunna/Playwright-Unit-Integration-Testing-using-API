import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export function getConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function setConfig(key, value) {
  const cfg = getConfig();
  if (typeof key === 'object') {
    // replace full config
    writeConfig(key);
    return;
  }
  // nested user keys support: 'user.id'
  if (key.includes('.')) {
    const parts = key.split('.');
    let cur = cfg;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!cur[p]) cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  } else {
    cfg[key] = value;
  }
  writeConfig(cfg);
}

function writeConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {
    // ignore
  }
}

export default { getConfig, setConfig };
