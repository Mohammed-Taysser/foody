import fs from 'fs';
import path from 'path';

// Traverse up to find project root
function findProjectRoot(start = __dirname) {
  let dir = start;

  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.resolve(dir, '..');
    if (parent === dir) {
      throw new Error('package.json not found');
    }
    dir = parent;
  }

  return dir;
}

// Flatten nested keys (e.g. { home: { welcome: "Hi" } } → { "home.welcome": "Hi" })
function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenKeys(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

const projectRoot = findProjectRoot();
const localesDir = path.join(projectRoot, 'locales');
const languages = fs.readdirSync(localesDir);

// Detect duplicate keys
const duplicates: Record<string, { key: string; sources: string[] }[]> = {};
// Detect missing keys
const missing: Record<string, string[]> = {};

const allKeysPerLang: Record<string, Set<string>> = {}; // lang -> Set of keys
const allFilesPerLang: Record<string, Record<string, Set<string>>> = {}; // lang -> filename -> Set of keys

languages.forEach((lang) => {
  const langDir = path.join(localesDir, lang);
  const files = fs.readdirSync(langDir).filter((f) => f.endsWith('.json'));

  const keyMap: Record<string, string[]> = {};
  const keySet: Set<string> = new Set();
  allFilesPerLang[lang] = {};

  files.forEach((file) => {
    const filePath = path.join(langDir, file);

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`❌ Error parsing ${filePath}: ${err.message}`);
      process.exit(1);
    }

    const flattened = flattenKeys(data);
    allFilesPerLang[lang][file] = new Set(Object.keys(flattened));

    Object.keys(flattened).forEach((key) => {
      keySet.add(key);
      if (!keyMap[key]) {
        keyMap[key] = [];
      }
      keyMap[key].push(file);
    });
  });

  allKeysPerLang[lang] = keySet;

  Object.entries(keyMap).forEach(([key, sources]) => {
    if (sources.length > 1) {
      if (!duplicates[lang]) duplicates[lang] = [];
      duplicates[lang].push({ key, sources });
    }
  });
});

// Check for missing keys across locales
const allKeys: Set<string> = new Set();
Object.values(allKeysPerLang).forEach((keySet) => {
  keySet.forEach((k) => allKeys.add(k));
});

languages.forEach((lang) => {
  const langKeys = allKeysPerLang[lang];
  const missingKeys: string[] = [];
  allKeys.forEach((key) => {
    if (!langKeys.has(key)) {
      missingKeys.push(key);
    }
  });
  if (missingKeys.length > 0) {
    missing[lang] = missingKeys;
  }
});

// Output report
const hasDuplicates = Object.keys(duplicates).length > 0;
const hasMissing = Object.keys(missing).length > 0;

if (!hasDuplicates && !hasMissing) {
  console.log('🎉 All translation files are consistent — no duplicate or missing keys found!');
  console.log(`🌐 Total languages checked: ${languages.length}`);
  console.log(`🔑 Total keys found: ${allKeys.size}`);

  process.exit(0);
}

console.log('\n📋 Translation Validation Report\n');

if (hasDuplicates) {
  console.log('🔁 Duplicate Translation Keys Found:\n');
  Object.entries(duplicates).forEach(([lang, entries]) => {
    console.log(`🌍 Language: ${lang}`);
    entries.forEach(({ key, sources }) => {
      console.log(`  🔁 "${key}" found in: ${sources.join(', ')}`);
    });
    console.log('');
  });
}

if (hasMissing) {
  console.log('🚫 Missing Translation Keys:\n');
  Object.entries(missing).forEach(([lang, keys]) => {
    console.log(`🌍 Language: ${lang}`);
    keys.forEach((key) => {
      console.log(`  ❌ Missing: "${key}"`);
    });
    console.log('');
  });
}

process.exit(1);
