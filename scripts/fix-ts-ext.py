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
        # Change .js to .ts in local imports
        content = re.sub(r"from\s+'(\.?\.?\/[^']+)\.js'", r"from '\1.ts'", content)
        if content != orig:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
            count += 1
print(f'Changed .js to .ts in {count} files')
