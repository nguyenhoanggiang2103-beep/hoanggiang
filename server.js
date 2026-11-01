// Gameshow "Đố vui Sách Lời Chúa" - không cần cài thêm thư viện nào (chỉ cần Node 18+)
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const KEY = process.env.HOST_PASSWORD || 'giaoly';   // mật khẩu quản trò
const TIME = 20000;                                   // 20 giây mỗi câu
const Q = [
["Theo quy điển Công giáo, Kinh Thánh có tất cả bao nhiêu quyển?",["66 quyển","70 quyển","73 quyển","75 quyển"],2],
["Kinh Thánh được chia thành mấy phần chính?",["Hai phần","Ba phần","Bốn phần","Năm phần"],0],
["Hai phần chính của Kinh Thánh là gì?",["Sách Luật và sách Lịch sử","Cựu Ước và Tân Ước","Cựu Ước và sách Tin Mừng","Sách Ngôn Sứ và sách Thánh Vịnh"],1],
["Cựu Ước có bao nhiêu quyển theo Kinh Thánh Công giáo?",["27 quyển","39 quyển","46 quyển","50 quyển"],2],
["Tân Ước có bao nhiêu quyển?",["21 quyển","27 quyển","39 quyển","46 quyển"],1],
["Năm quyển đầu tiên của Cựu Ước được gọi là gì?",["Ngũ Thư","Thánh Vịnh","Tin Mừng","Thư Chung"],0],
["Ngũ Thư gồm bao nhiêu quyển?",["4 quyển","5 quyển","7 quyển","10 quyển"],1],
["Trong cách phân chia quen thuộc của Cựu Ước Công giáo, có bao nhiêu sách Ngôn Sứ?",["12 sách","15 sách","16 sách","18 sách"],3],
["Có bao nhiêu sách Tin Mừng trong Tân Ước?",["2 sách","3 sách","4 sách","5 sách"],2],
["Bốn sách Tin Mừng là của những tác giả nào?",["Phêrô, Phaolô, Giacôbê, Giuđa","Mátthêu, Máccô, Luca, Gioan","Isaia, Giêrêmia, Êdêkien, Đanien","Môsê, Đavít, Salômôn, Êlia"],1],
["Sau bốn sách Tin Mừng, sách nào tiếp theo trong Tân Ước?",["Sách Khải Huyền","Sách Công Vụ Tông Đồ","Thư Rôma","Thư Do Thái"],1],
["Sách Công Vụ Tông Đồ do ai viết theo truyền thống Kitô giáo?",["Thánh Luca","Thánh Mátthêu","Thánh Gioan","Thánh Phêrô"],0],
["Trong Tân Ước có bao nhiêu thư của thánh Phaolô theo cách sắp xếp truyền thống?",["7 thư","10 thư","13 thư","15 thư"],2],
["Sách cuối cùng của Kinh Thánh là sách nào?",["Sách Công Vụ Tông Đồ","Sách Khải Huyền","Thư Giuđa","Tin Mừng Gioan"],1],
["Bảy quyển thuộc nhóm sách Giáo huấn/Khôn Ngoan trong Cựu Ước gồm những sách nào?",["Gióp, Thánh Vịnh, Châm Ngôn, Giảng Viên, Diễm Ca, Khôn Ngoan, Huấn Ca","Sáng Thế, Xuất Hành, Lêvi, Dân Số, Đệ Nhị Luật, Giôsuê, Thủ Lãnh","Mátthêu, Máccô, Luca, Gioan, Công Vụ, Rôma, Khải Huyền","Isaia, Giêrêmia, Êdêkien, Đanien, Hôsê, Giôen, Amos"],0]
].map(x => ({ q: x[0], o: x[1], a: x[2] }));

let S, timer = null;
const clients = new Set();
const fresh = () => { S = { phase: 'lobby', q: 0, t0: 0, players: new Map() }; };
fresh();

const sorted = () => [...S.players.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

function view(c) {
  const ps = [...S.players.values()];
  const v = { phase: S.phase, q: S.q, t0: S.t0, now: Date.now(), time: TIME, total: Q.length,
              count: ps.length, answered: ps.filter(p => p.ans[S.q]).length };
  if (S.phase === 'lobby') v.names = ps.map(p => p.name);
  if (S.phase === 'question' || S.phase === 'reveal') v.question = { q: Q[S.q].q, o: Q[S.q].o };
  if (S.phase === 'reveal') v.correct = Q[S.q].a;
  if (S.phase === 'reveal' || S.phase === 'final') v.top = sorted().slice(0, 3).map(p => ({ name: p.name, s: p.score }));
  if (!c.host) {
    const p = S.players.get(c.id);
    if (p) v.me = { name: p.name, choice: p.ans[S.q] ? p.ans[S.q].c : null,
                    gain: S.phase === 'reveal' ? p.last : 0, score: p.score, rank: sorted().indexOf(p) + 1 };
  }
  return v;
}
function broadcast() {
  for (const c of clients) c.res.write('data: ' + JSON.stringify(view(c)) + '\n\n');
}
function begin(i) {
  S.phase = 'question'; S.q = i; S.t0 = Date.now();
  clearTimeout(timer); timer = setTimeout(reveal, TIME + 300);
  broadcast();
}
function reveal() {
  if (S.phase !== 'question') return;
  clearTimeout(timer);
  for (const p of S.players.values()) {
    const a = p.ans[S.q]; p.last = a ? a.g : 0; p.score += p.last;
  }
  S.phase = 'reveal'; broadcast();
}

function body(req) {
  return new Promise(ok => {
    let d = ''; req.on('data', x => { d += x; if (d.length > 5000) req.destroy(); });
    req.on('end', () => { try { ok(JSON.parse(d || '{}')); } catch { ok({}); } });
  });
}
const send = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/host')) {
    return fs.readFile(path.join(__dirname, 'public', 'index.html'), (e, d) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(d);
    });
  }
  if (req.method === 'GET' && u.pathname === '/events') {
    const key = u.searchParams.get('key'), id = (u.searchParams.get('id') || '').slice(0, 40);
    const host = key === KEY;
    if (key && !host) return send(res, 401, { error: 'key' });
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform',
                         'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
    const c = { res, id, host }; clients.add(c);
    res.write('retry: 2000\n\ndata: ' + JSON.stringify(view(c)) + '\n\n');
    const hb = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(hb); clients.delete(c); });
    return;
  }
  if (req.method === 'POST' && u.pathname === '/api/join') {
    const b = await body(req), id = String(b.id || '').slice(0, 40), name = String(b.name || '').trim().slice(0, 20);
    if (!id || !name || S.players.size >= 3000) return send(res, 400, { error: 'bad' });
    const old = S.players.get(id);
    if (old) old.name = name; else S.players.set(id, { name, ans: {}, score: 0, last: 0 });
    broadcast(); return send(res, 200, { ok: 1 });
  }
  if (req.method === 'POST' && u.pathname === '/api/answer') {
    const b = await body(req), p = S.players.get(String(b.id || '')), c = b.c, t = Date.now() - S.t0;
    if (!p || S.phase !== 'question' || t > TIME || p.ans[S.q] || ![0, 1, 2, 3].includes(c)) return send(res, 400, { error: 'bad' });
    p.ans[S.q] = { c, g: c === Q[S.q].a ? Math.round(500 + 500 * (1 - t / TIME)) : 0 };
    if ([...S.players.values()].every(x => x.ans[S.q])) reveal(); else broadcast();
    return send(res, 200, { ok: 1 });
  }
  if (req.method === 'POST' && u.pathname === '/api/host') {
    const b = await body(req);
    if (b.key !== KEY) return send(res, 401, { error: 'key' });
    if (b.action === "ping") {}
    else if (b.action === "start" && S.phase === 'lobby' && S.players.size) begin(0);
    else if (b.action === 'next' && S.phase === 'reveal' && S.q < Q.length - 1) begin(S.q + 1);
    else if (b.action === 'final' && S.phase === 'reveal' && S.q === Q.length - 1) { S.phase = 'final'; broadcast(); }
    else if (b.action === 'reset') { clearTimeout(timer); fresh(); broadcast(); }
    return send(res, 200, { ok: 1 });
  }
  send(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log('Gameshow chạy tại cổng ' + PORT + ' — quản trò vào /host (mật khẩu: ' + KEY + ')'));
