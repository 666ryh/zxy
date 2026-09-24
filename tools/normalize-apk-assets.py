import sys, zipfile, tempfile, os
from pathlib import Path
apk=Path(sys.argv[1]); source=Path(sys.argv[2]); tmp=apk.with_suffix('.assets.tmp.apk')
with zipfile.ZipFile(apk,'r') as src, zipfile.ZipFile(tmp,'w') as out:
    seen=set()
    for item in src.infolist():
        normalized=item.filename.replace('\\','/')
        if normalized.startswith('assets/'):
            continue
        if normalized in seen: continue
        seen.add(normalized)
        info=zipfile.ZipInfo(normalized,item.date_time);info.compress_type=item.compress_type;info.external_attr=item.external_attr;info.flag_bits=item.flag_bits
        out.writestr(info,src.read(item.filename))
    for path in sorted(source.rglob('*')):
        if not path.is_file():continue
        name='assets/web/'+path.relative_to(source).as_posix()
        info=zipfile.ZipInfo(name);info.compress_type=zipfile.ZIP_DEFLATED
        out.writestr(info,path.read_bytes())
os.replace(tmp,apk)
print('Normalized APK assets:',sum(1 for p in source.rglob('*') if p.is_file()))
