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
        # Add .ts extension to local imports that don't have any extension
        def add_ts(m):
            imp = m.group(1)
            if imp.startswith('.') and '.' not in imp.split('/')[-1]:
                return f"from '{imp}.ts'"
            return m.group(0)
        content = re.sub(r"from\s+'([^']+)'", add_ts, content)
        if content != orig:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
            count += 1
print(f'Added .ts to {count} files')
