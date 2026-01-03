#!/usr/bin/env python3
"""
Script final ciblé pour corriger les erreurs JSX restantes de manière précise
"""
import os
import re

DASHBOARD_PATH = os.path.join(os.getcwd(), 'apps', 'frontend', 'src', 'app', '(dashboard)', 'dashboard')

def fix_ab_testing():
    """Corrige les erreurs dans ab-testing/page.tsx"""
    file_path = os.path.join(DASHBOARD_PATH, 'ab-testing/page.tsx')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix 1: Ligne 669 - Badge non fermé
    content = re.sub(
        r'<Badge variant="outline" className=\{`\$\{statusConfig\[experiment\.status\]\.color\} text-white border-0`\}>\\s*\{statusConfig\[experiment\.status\]\.label\}\\s*\{experiment\.winner',
        r'<Badge variant="outline" className={`${statusConfig[experiment.status].color} text-white border-0`}>\n                            {statusConfig[experiment.status].label}\n                          </Badge>\n                          {experiment.winner',
        content
    )
    
    # Fix 2: Ligne 675 - Badge non fermé avant )}
    content = re.sub(
        r'Winner: \{experiment\.winner\}\\s*\)\}',
        r'Winner: {experiment.winner}\n                            </Badge>\n                          )}',
        content
    )
    
    # Fix 3: Lignes 973, 4644, 4782 - Badges non fermés
    content = re.sub(
        r'<Badge variant="outline" className="border-slate-700">\\s*\{template\.category\}\\s*</div>',
        r'<Badge variant="outline" className="border-slate-700">\n                      {template.category}\n                    </Badge>\n                  </div>',
        content
    )
    
    # Fix 4: Lignes 5079, 5089 - Tokens inattendus à la fin
    lines = content.split('\n')
    fixed_lines = []
    for i, line in enumerate(lines):
        # Supprimer les lignes orphelines avant export default
        if i > 5075 and i < 5085 and line.strip() in ['</Select>', '</Badge>', '</Button>', '</div>']:
            continue
        fixed_lines.append(line)
    content = '\n'.join(fixed_lines)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def fix_affiliate():
    """Corrige les erreurs dans affiliate/page.tsx"""
    file_path = os.path.join(DASHBOARD_PATH, 'affiliate/page.tsx')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix: Badge non fermé ligne 650
    content = re.sub(
        r'<Badge variant=\{link\.isActive \? \'default\' : \'secondary\'\}>\\s*\{link\.isActive \? \'Actif\' : \'Inactif\'\}\\s*</div>',
        r'<Badge variant={link.isActive ? \'default\' : \'secondary\'}>\n                                  {link.isActive ? \'Actif\' : \'Inactif\'}\n                                </Badge>\n                          </div>',
        content
    )
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    print('🔧 Correction finale ciblée des erreurs restantes...\n')
    
    fixed = []
    if fix_ab_testing():
        print('✅ ab-testing/page.tsx')
        fixed.append('ab-testing/page.tsx')
    
    if fix_affiliate():
        print('✅ affiliate/page.tsx')
        fixed.append('affiliate/page.tsx')
    
    if not fixed:
        print('⏭️  Aucune correction nécessaire')
    else:
        print(f'\n📊 {len(fixed)} fichier(s) corrigé(s)')

if __name__ == '__main__':
    main()






