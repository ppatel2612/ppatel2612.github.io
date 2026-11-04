import { mkdir, writeFile } from 'node:fs/promises';

const username = 'ppatel2612';
const headers = { Accept: 'application/vnd.github+json' };
async function get(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.json();
}
const profile = await get(`https://api.github.com/users/${username}`);
const repos = [];
for (let page = 1; ; page++) {
  const batch = await get(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed&page=${page}`);
  repos.push(...batch);
  if (batch.length < 100) break;
}
const fields = ['name', 'description', 'html_url', 'homepage', 'language', 'topics', 'stargazers_count', 'forks_count', 'fork', 'archived', 'pushed_at'];
const snapshot = {
  fetchedAt: new Date().toISOString(),
  profile: { login: profile.login, name: profile.name, bio: profile.bio, location: profile.location },
  repos: repos.map(repo => Object.fromEntries(fields.map(key => [key, repo[key]])))
};
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/repos.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Saved ${repos.length} public repositories.`);
console.log(repos.map(r => `${r.name} | ${r.language || '—'} | ${r.description || 'No description'}`).join('\n'));
