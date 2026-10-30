import sqlite3, pathlib, urllib.request, json
paths=[p for p in pathlib.Path('.wrangler/state/v3/d1').rglob('*.sqlite') if p.name!='metadata.sqlite']
conn=sqlite3.connect(paths[0]); ids=[f'qa-history-{i}' for i in range(105)]
try:
    conn.executemany('INSERT OR REPLACE INTO memorials (id,owner,name,kind,message,created_at) VALUES (?,?,?,?,?,?)',[(id,'qa-history','테스트 기억','dog','로컬 이력 검증',i+1) for i,id in enumerate(ids)]); conn.commit()
    data=json.load(urllib.request.urlopen('http://127.0.0.1:5173/api/garden'))
    returned={m['id'] for m in data['memorials']}
    assert all(id in returned for id in ids),f'Older memorial records inaccessible: {len(set(ids)-returned)}'
    print('PASS: all 105 memorials remain accessible')
finally:
    conn.executemany('DELETE FROM memorials WHERE id=?',[(id,) for id in ids]);conn.commit();conn.close()
