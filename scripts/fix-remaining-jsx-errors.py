#!/usr/bin/env python3
"""Script to fix remaining JSX errors in frontend files"""

import re
import sys

files_to_fix = [
    {
        'path': 'apps/frontend/src/app/(dashboard)/dashboard/ab-testing/page.tsx',
        'fixes': [
            (r'(Winner: \{experiment\.winner\})\s*(\}\)\s*</div>)', r'\1\n                            </Badge>\n                          \2'),
        ]
    },
    {
        'path': 'apps/frontend/src/app/(dashboard)/dashboard/ai-studio/page.tsx',
        'fixes': [
            (r'(\{suggestion\.impact\})\s*(</div>)', r'\1\n                                </Badge>\n                          \2'),
        ]
    },
    {
        'path': 'apps/frontend/src/app/(dashboard)/dashboard/ai-studio/templates/page.tsx',
        'fixes': [
            (r'(\{format\})\s*(\}\)\s*</div>)', r'\1\n                          </Badge>\n                        \2'),
        ]
    },
]

for file_info in files_to_fix:
    file_path = file_info['path']
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for pattern, replacement in file_info['fixes']:
            content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Fixed {file_path}")
        else:
            print(f"- No changes needed for {file_path}")
    except Exception as e:
        print(f"✗ Error fixing {file_path}: {e}")

print("\nDone! Please run 'pnpm run build' to verify.")








