import pathlib, re
root = pathlib.Path('g:/centro-cultural')
file_patterns = ['*.ts', '*.tsx', '*.js', '*.jsx']
ignore_dirs = {'node_modules', '.next', 'out', 'dist', 'public', 'supabase'}

select_re = re.compile(r"\.select\(\s*([`'])(.*?)\1", re.S)
rel_re = re.compile(r"^\s*([a-z0-9_]+)\s*(?:[:][a-z0-9_]+)?\s*\(", re.I)

for path in root.rglob('*'):
    if path.is_dir():
        continue
    if any(path.match(pat) for pat in file_patterns):
        if any(part in ignore_dirs for part in path.parts):
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        for m in select_re.finditer(text):
            arg = m.group(2)
            if '!' in arg:
                continue
            if '(' not in arg:
                continue
            lines = arg.splitlines()
            rels = [line.strip() for line in lines if rel_re.match(line.strip())]
            if rels:
                print(f'{path}:{m.start()}')
                for line in rels:
                    print('  ', line)
                print()