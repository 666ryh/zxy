import sys
from pathlib import Path
root=Path(sys.argv[1])
for path in root.rglob('*'):
    if not path.is_file() or path.suffix.lower() not in {'.html','.js','.css'}:continue
    raw=path.read_text('utf-8')
    raw=raw.replace('"/assets/','"./assets/').replace("'/assets/","'./assets/")
    raw=raw.replace('"/static/','"./static/').replace("'/static/","'./static/")
    path.write_text(raw,'utf-8')
print('Prepared H5 assets for android_asset relative paths')
