from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from hashlib import sha256
ROOT=Path(__file__).resolve().parents[1]
out=ROOT.parent/'LedgerPilot_参赛准备包_20261102.zip'
with ZipFile(out,'w',ZIP_DEFLATED) as archive:
    for f in sorted(ROOT.rglob('*')):
        if not f.is_file():continue
        rel=f.relative_to(ROOT)
        if any(p in {'.git','data','tmp','node_modules','__pycache__'} for p in rel.parts):continue
        if f.name=='.env' or f.suffix in {'.log','.webm'}:continue
        if f.name.startswith('pitch-page-') or f.name=='pitch-contact-sheet.png':continue
        archive.write(f,Path('ledgerpilot')/rel)
with ZipFile(out) as archive:
    assert archive.testzip() is None
    assert not any('/data/' in n or n.endswith('/.env') for n in archive.namelist())
checksum=sha256(out.read_bytes()).hexdigest()
out.with_suffix('.sha256.txt').write_text(checksum+'  '+out.name+'\n',encoding='utf-8')
print(f'Packaged {out.name} ({out.stat().st_size} bytes); no session data or secrets included')
