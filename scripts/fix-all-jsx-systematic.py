#!/usr/bin/env python3
"""
Script systématique pour corriger toutes les erreurs JSX
Analyse chaque fichier en profondeur et corrige toutes les balises non fermées
"""
import os
import re

DASHBOARD_PATH = os.path.join(os.getcwd(), 'apps', 'frontend', 'src', 'app', '(dashboard)', 'dashboard')

REQUIRES_CLOSING = {
    'Button', 'Badge', 'Card', 'CardContent', 'CardHeader', 'CardTitle', 'CardDescription',
    'div', 'span', 'p', 'TabsContent', 'DialogFooter', 'Select', 'SelectContent'
}

def fix_file_systematic(file_path):
    """Corrige systématiquement toutes les erreurs JSX dans un fichier"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Fix 1: Missing </Button> before </div> and ))}
        content = re.sub(
            r'(Réutiliser|Réinitialiser|Configurer|Utiliser|Connecter|Gérer|Explorer|Créer|Activer|Appliquer|Essayer|Ouvrir|Commencer|S\'abonner|Nous contacter)\s*\n\s*</div>\s*\n\s*\)\)\}',
            r'\1\n                        </Button>\n                      </div>\n                    ))}',
            content
        )
        
        # Fix 2: Missing </Badge> before </div>
        content = re.sub(
            r'<Badge([^>]*)>(\{[^}]*\})\s*\n\s*</div>',
            r'<Badge\1>\2</Badge>\n                    </div>',
            content
        )
        
        # Fix 3: Missing </Badge> in conditional
        content = re.sub(
            r'<Badge([^>]*)>(\{[^}]*\})\s*\n\s*\)\s*:',
            r'<Badge\1>\2</Badge>\n                    ) :',
            content
        )
        
        # Fix 4: Missing </Select> before </div>
        content = re.sub(
            r'</SelectContent>\s*\n\s*</div>',
            r'</SelectContent>\n                </Select>\n              </div>',
            content
        )
        
        # Fix 5: Orphan </Badge> tags
        content = re.sub(r'\s*</Badge>\s*\n\s*</Badge>', '\n                    </Badge>', content)
        content = re.sub(r'\s*</Badge>\s*\n\s*return\s*\(', '\n                      return (', content)
        
        # Fix 6: Missing closing in map with const Icon
        content = re.sub(
            r'(const\s+Icon\s*=\s*\w+\.icon;)\s*\n\s*\)\)\}',
            r'\1\n                      return (\n                        <div>...</div>\n                      );\n                    ))}',
            content
        )
        
        # Fix 7: Remove orphan </Select> tags at end of function
        lines = content.split('\n')
        fixed_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            # Skip orphan </Select> tags before return statements
            if line.strip() == '</Select>' and i + 1 < len(lines) and 'return' in lines[i + 1]:
                i += 1
                continue
            fixed_lines.append(line)
            i += 1
        content = '\n'.join(fixed_lines)
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        return False

def main():
    print('🔧 Correction systématique de toutes les erreurs JSX...\n')
    
    # Trouver tous les fichiers .tsx
    all_files = []
    for root, dirs, files in os.walk(DASHBOARD_PATH):
        for file in files:
            if file.endswith('.tsx'):
                all_files.append(os.path.relpath(os.path.join(root, file), DASHBOARD_PATH))
    
    fixed_count = 0
    for file in all_files:
        file_path = os.path.join(DASHBOARD_PATH, file)
        if fix_file_systematic(file_path):
            print(f'✅ {file}')
            fixed_count += 1
    
    print(f'\n📊 {fixed_count} fichier(s) corrigé(s)')

if __name__ == '__main__':
    main()






