import { ProxyAgent, setGlobalDispatcher } from 'undici';
setGlobalDispatcher(new ProxyAgent('http://localhost:3128'));
import { extract } from './src/tools/fetch-page-content.ts';

async function probe(ua: string) {
  const r = await fetch('https://hellogrowthcrm.com/pricing', { headers: { 'user-agent': ua, accept: 'text/plain, text/html, application/xml;q=0.9, */*;q=0.5' } });
  const html = await r.text();
  const ct = r.headers.get('content-type');
  const mo = html.search(/<main[^>]*>/i), mc = html.search(/<\/main>/i);
  const d = extract(html, 'https://hellogrowthcrm.com/pricing');
  console.log(`UA=${ua.slice(0,25)} | status=${r.status} ct=${ct} bytes=${html.length} mainOpen@${mo} mainClose@${mc} | headings=${d.headings.length} links=${d.links.length} textLen=${d.text.length}`);
  if (mo >= 0 && mc > mo) console.log('  main inner sample:', html.slice(mo, Math.min(mc, mo+280)).replace(/\s+/g,' ').slice(0,240));
  return html;
}
await probe('mcp-bot-crawler/1.0');
await probe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36');
await probe('GPTBot/1.0 (+https://openai.com/gptbot)');
