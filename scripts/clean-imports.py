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
        # Remove all .js and .ts extensions from local imports
        def clean_import(m):
            imp = m.group(1)
            if imp.startswith('.'):
                imp = re.sub(r'\.(js|ts)$', '', imp)
            return f"from '{imp}'"
        content = re.sub(r"from\s+'([^']+)'", clean_import, content)
        if content != orig:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
            count += 1
print(f'Cleaned {count} files')
