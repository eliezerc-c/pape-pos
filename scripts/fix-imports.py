import os

backend = r'C:\Users\casa\Documents\IA\proyecto104\papeleria-pos\backend\src'

# shared/ files should use ../../config/ and ../../shared/
# modules/*/ files should use ../../../config/ and ../../../shared/

fixed = 0
for dp, dn, fn in os.walk(backend):
    for f in fn:
        if not f.endswith('.ts'):
            continue
        fpath = os.path.join(dp, f)
        with open(fpath, 'r', encoding='utf-8') as fh:
            content = fh.read()
        original = content

        relpath = os.path.relpath(dp, backend)
        parts = relpath.split(os.sep)

        if 'shared' in parts:
            # shared/services/*.ts, shared/middleware/*.ts -> ../../
            content = content.replace("from '../../../config/", "from '../../config/")
            content = content.replace("from '../../../shared/", "from '../../shared/")
        elif 'modules' in parts:
            # modules/*/*.ts -> ../../../
            content = content.replace("from '../../config/", "from '../../../config/")
            content = content.replace("from '../../shared/", "from '../../../shared/")

        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)
            fixed += 1

print(f'Fixed {fixed} files')
