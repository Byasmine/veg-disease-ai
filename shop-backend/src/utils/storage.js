const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

async function ensureDataFile(fileName, defaultValue) {
  const filePath = path.join(dataDir, fileName);
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }
  return filePath;
}

async function readJson(fileName, defaultValue) {
  const filePath = await ensureDataFile(fileName, defaultValue);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw || 'null') ?? defaultValue;
}

async function writeJson(fileName, data) {
  const filePath = await ensureDataFile(fileName, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return data;
}

module.exports = {
  readJson,
  writeJson,
};
