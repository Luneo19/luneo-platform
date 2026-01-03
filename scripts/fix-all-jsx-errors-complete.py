#!/usr/bin/env python3
"""
Script complet pour corriger toutes les erreurs JSX structurelles
"""
import os
import re
import sys

DASHBOARD_PATH = os.path.join(os.getcwd(), 'apps', 'frontend', 'src', 'app', '(dashboard)', 'dashboard')

# Composants qui nécessitent une balise fermante
REQUIRES_CLOSING = {
    'Button', 'Badge', 'Card', 'CardContent', 'CardHeader', 'CardTitle', 'CardDescription',
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a',
    'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent', 'Accordion', 'AccordionItem',
    'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription',
    'Select', 'SelectTrigger', 'SelectContent', 'SelectItem', 'Label', 'Input',
    'Textarea', 'Separator', 'Progress', 'Alert', 'AlertTitle', 'AlertDescription'
}

def fix_jsx_errors(file_path):
    """Corrige les erreurs JSX dans un fichier"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        fixed_lines = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # Fix 1: Missing </Button> before ))}
            if re.search(r'\{[^}]*\}\s*$', line) and i + 1 < len(lines) and '))}' in lines[i + 1]:
                # Vérifier si c'est dans un Button non fermé
                if i > 0 and '<Button' in '\n'.join(lines[max(0, i-10):i]):
                    # Chercher la ligne avec <Button
                    for j in range(max(0, i-10), i):
                        if '<Button' in lines[j] and '</Button>' not in '\n'.join(lines[j:i+1]):
                            fixed_lines.append(line)
                            fixed_lines.append('              </Button>')
                            i += 1
                            continue
            
            # Fix 2: Missing closing tag before </div> and ))}
            if '</div>' in line and i + 1 < len(lines) and '))}' in lines[i + 1]:
                # Vérifier si on est dans un map et qu'il manque une fermeture
                context = '\n'.join(lines[max(0, i-20):i+1])
                if '.map(' in context and 'return (' in context:
                    # Compter les balises ouvertes/fermées
                    open_tags = len(re.findall(r'<(Button|Badge|Card|div)', context))
                    close_tags = len(re.findall(r'</(Button|Badge|Card|div)>', context))
                    if open_tags > close_tags:
                        # Trouver la dernière balise ouverte non fermée
                        last_open = None
                        for j in range(i-1, max(0, i-20), -1):
                            match = re.search(r'<(Button|Badge|Card)', lines[j])
                            if match:
                                tag = match.group(1)
                                # Vérifier si elle est fermée
                                remaining = '\n'.join(lines[j:i+1])
                                if f'</{tag}>' not in remaining:
                                    last_open = tag
                                    break
                        if last_open:
                            fixed_lines.append(f'                      </{last_open}>')
            
            # Fix 3: Orphan </Badge> before return
            if '</Badge>' in line and i + 1 < len(lines) and 'return (' in lines[i + 1]:
                # Supprimer cette ligne
                i += 1
                continue
            
            # Fix 4: Missing return statement in map
            if '.map(' in line and i + 1 < len(lines):
                next_line = lines[i + 1]
                if 'const Icon' in next_line and i + 2 < len(lines):
                    if 'return (' not in lines[i + 2] and '</Badge>' not in lines[i + 2]:
                        # Ajouter return
                        fixed_lines.append(line)
                        i += 1
                        fixed_lines.append(next_line)
                        i += 1
                        if 'return (' not in lines[i]:
                            fixed_lines.append('                      return (')
                        continue
            
            fixed_lines.append(line)
            i += 1
        
        new_content = '\n'.join(fixed_lines)
        
        # Corrections supplémentaires avec regex
        # Fix: Missing </Button> before ))}
        new_content = re.sub(
            r'(\{integration\.name\}|\{format\.name\}|\{action\.name\}|\{integration\})\s*\n\s*\)\)\}',
            r'\1\n              </Button>\n            ))}',
            new_content
        )
        
        # Fix: Missing </Button> before </div> and ))}
        new_content = re.sub(
            r'(Appliquer|Configurer|Utiliser|Connecter|Gérer|Explorer|Créer|Activer)\s*\n\s*</div>\s*\n\s*\)\)\}',
            r'\1\n                      </Button>\n                    </div>\n                  ))}',
            new_content
        )
        
        # Fix: Orphan </Badge> before return
        new_content = re.sub(
            r'\s*</Badge>\s*\n\s*return\s*\(',
            '\n                      return (',
            new_content
        )
        
        # Fix: Missing closing in map with const Icon
        new_content = re.sub(
            r'(const\s+Icon\s*=\s*\w+\.icon;)\s*\n\s*\)\)\}',
            r'\1\n                      return (\n                        <div>...</div>\n                      );\n                    ))}',
            new_content
        )
        
        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        return False

def main():
    print('🔧 Correction complète de toutes les erreurs JSX...\n')
    
    # Trouver tous les fichiers .tsx dans le dashboard
    files_to_fix = []
    for root, dirs, files in os.walk(DASHBOARD_PATH):
        for file in files:
            if file.endswith('.tsx'):
                files_to_fix.append(os.path.join(root, file))
    
    fixed_count = 0
    for file_path in files_to_fix:
        rel_path = os.path.relpath(file_path, DASHBOARD_PATH)
        if fix_jsx_errors(file_path):
            print(f'✅ {rel_path}')
            fixed_count += 1
        else:
            print(f'⏭️  {rel_path} (pas de corrections)')
    
    print(f'\n📊 {fixed_count} fichier(s) corrigé(s)')

if __name__ == '__main__':
    main()






