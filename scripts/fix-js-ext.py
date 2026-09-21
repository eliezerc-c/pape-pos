import os, re

backend = r'C:\Users\casa\Documents\IA\proyecto104\papeleria-pos\backend\src'
count = 0
for dp, dn, fn in os.walk(backend):
    for f in fn:
        if not f.endswith('.ts'):
            continue
        path = os.path.join(dp, f)
        with open(path, 'r', encoding='utf-8') as fh:
            content = fh.read()
        orig = content
        # Remove .js extension from all local imports (not node_modules)
        content = re.sub(r"from\s+'(\.?\.?\/[^']+)\.js'", r"from '\1'", content)
        if content != orig:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
            count += 1
print(f'Fixed {count} files')
