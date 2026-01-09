#!/usr/bin/env python3
"""
Script final de correction de toutes les erreurs JSX
Corrige systématiquement tous les problèmes identifiés
"""

import re
import os
from pathlib import Path

DASHBOARD_DIR = Path(__file__).parent.parent / 'apps/frontend/src/app/(dashboard)/dashboard'

# Composants auto-fermants
SELF_CLOSING = ['Separator', 'Progress', 'Checkbox', 'Input', 'Textarea']

def fix_file(file_path):
    """Corrige toutes les erreurs JSX dans un fichier"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    original_lines = lines.copy()
    modified = False
    
    # 1. Supprimer fermetures pour composants auto-fermants
    for i, line in enumerate(lines):
        for comp in SELF_CLOSING:
            if f'</{comp}>' in line:
                lines[i] = line.replace(f'</{comp}>', '')
                modified = True
    
    # 2. Corriger Buttons non fermés
    for i in range(len(lines)):
        line = lines[i]
        if '<Button' in line and '</Button>' not in line and '/>' not in line:
            # Chercher la fermeture dans les lignes suivantes
            found_close = False
            for j in range(i + 1, min(i + 10, len(lines))):
                if '</Button>' in lines[j]:
                    found_close = True
                    break
                # Si on trouve </div>, </CardContent>, </Card> avant </Button>, c'est une erreur
                if '</div>' in lines[j] or '</CardContent>' in lines[j] or '</Card>' in lines[j]:
                    # Ajouter </Button> avant cette ligne
                    indent = len(line) - len(line.lstrip())
                    lines.insert(j, ' ' * indent + '</Button>\n')
                    modified = True
                    found_close = True
                    break
    
    # 3. Corriger Badges non fermés
    for i in range(len(lines)):
        line = lines[i]
        if '<Badge' in line and '</Badge>' not in line and '/>' not in line:
            found_close = False
            for j in range(i + 1, min(i + 10, len(lines))):
                if '</Badge>' in lines[j]:
                    found_close = True
                    break
                if '</div>' in lines[j] or '</CardContent>' in lines[j]:
                    indent = len(line) - len(line.lstrip())
                    lines.insert(j, ' ' * indent + '</Badge>\n')
                    modified = True
                    found_close = True
                    break
    
    # 4. Nettoyer les caractères spéciaux suspects
    for i in range(len(lines)):
        # Supprimer les caractères de contrôle non-ASCII sauf les sauts de ligne
        cleaned = ''.join(c if (32 <= ord(c) <= 126) or c in '\n\r\t' else ' ' for c in lines[i])
        if cleaned != lines[i]:
            lines[i] = cleaned
            modified = True
    
    if modified and lines != original_lines:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    
    return False

def main():
    print('🔧 Correction finale de toutes les erreurs JSX...\n')
    
    # Fichiers avec erreurs critiques
    critical_files = [
        'ab-testing/page.tsx',
        'affiliate/page.tsx',
        'ai-studio/animations/page.tsx',
        'ai-studio/templates/page.tsx',
        'ai-studio/3d/page.tsx',
        'integrations/page.tsx',
        'ar-studio/preview/page.tsx',
        'analytics/page.tsx'
    ]
    
    fixed_count = 0
    
    for file in critical_files:
        file_path = DASHBOARD_DIR / file
        if file_path.exists():
            if fix_file(file_path):
                fixed_count += 1
                print(f'✅ {file}')
            else:
                print(f'⏭️  {file} (pas de corrections)')
        else:
            print(f'⚠️  {file} (non trouvé)')
    
    print(f'\n📊 {fixed_count} fichier(s) corrigé(s)\n')

if __name__ == '__main__':
    main()











