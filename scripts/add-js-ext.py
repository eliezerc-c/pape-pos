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
        # Add .js extension to local imports that don't have it and aren't node_modules
        def add_js(m):
            imp = m.group(1)
            if imp.startswith('.') and not imp.endswith('.js') and not imp.endswith('.ts'):
                return f"from '{imp}.js'"
            return m.group(0)
        content = re.sub(r"from\s+'([^']+)'", add_js, content)
        if content != orig:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(content)
            count += 1
print(f'Added .js to {count} files')
