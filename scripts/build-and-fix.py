import subprocess, os, re

backend = r'C:\Users\casa\Documents\IA\proyecto104\papeleria-pos\backend'

# Compile with tsc
result = subprocess.run(['npx', 'tsc'], cwd=backend, capture_output=True, text=True, shell=True)
print('TSC done')

# Fix dist files - replace ../../../ with ./ and add .js extensions
dist_dir = os.path.join(backend, 'dist')
count = 0
for dp, dn, fn in os.walk(dist_dir):
    for f in fn:
        if f.endswith('.js'):
            path = os.path.join(dp, f)
            with open(path, 'r', encoding='utf-8') as fh:
                content = fh.read()
            orig = content
            # Replace ../../../ with ./ (since dist mirrors src structure)
            content = content.replace('../../../', '../../')
            # Add .js extension to relative requires without it
            content = re.sub(r'require\((["\'])(\.\.?\/.+?)\1\)', lambda m: f'require({m.group(1)}{m.group(2)}.js{m.group(1)})' if '.' not in m.group(2).split('/')[-1] else m.group(0), content)
            if content != orig:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(content)
                count += 1
print(f'Fixed {count} dist files')
print('Ready to run: node dist/index.js')
