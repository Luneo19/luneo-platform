#!/usr/bin/env python3
"""
Script final pour corriger toutes les erreurs JSX de manière systématique
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
    'Textarea', 'Separator', 'Progress', 'Alert', 'AlertTitle', 'AlertDescription',
    'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DialogFooter'
}

def fix_jsx_file(file_path):
    """Corrige toutes les erreurs JSX dans un fichier"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        fixed_lines = []
        tag_stack = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            indent = len(line) - len(line.lstrip())
            
            # Détecter les balises ouvrantes
            open_tags = re.findall(r'<(\w+)([^>]*?)(/?)>', line)
            for tag_match in open_tags:
                tag_name = tag_match[0]
                attrs = tag_match[1]
                is_self_closing = tag_match[2] == '/' or attrs.strip().endswith('/')
                
                if not is_self_closing and tag_name in REQUIRES_CLOSING:
                    tag_stack.append({'tag': tag_name, 'line': i + 1, 'indent': indent})
            
            # Détecter les balises fermantes
            close_tags = re.findall(r'</(\w+)>', line)
            for tag_name in close_tags:
                # Retirer de la stack
                for j in range(len(tag_stack) - 1, -1, -1):
                    if tag_stack[j]['tag'] == tag_name:
                        tag_stack.pop(j)
                        break
            
            # Vérifier les patterns problématiques
            # Pattern 1: {variable} suivi de </div> ou ))} sans balise fermante
            if re.search(r'\{[^}]*\}\s*$', line) and i + 1 < len(lines):
                next_line = lines[i + 1]
                if re.match(r'^\s*</div>|^\s*\)\)\}|^\s*</Card', next_line):
                    # Vérifier si on a une balise ouverte non fermée
                    if tag_stack:
                        last_open = tag_stack[-1]
                        if last_open['tag'] in ['Button', 'Badge']:
                            # Insérer la balise fermante
                            fixed_lines.append(line)
                            fixed_lines.append(' ' * last_open['indent'] + f"</{last_open['tag']}>")
                            tag_stack.pop()
                            i += 1
                            continue
            
            # Pattern 2: Badge ou Button avec {variable} non fermé
            if re.search(r'<(Button|Badge)([^>]*)>\s*\{[^}]*\}\s*$', line):
                match = re.search(r'<(Button|Badge)([^>]*)>\s*(\{[^}]*\})\s*$', line)
                if match:
                    tag_name = match.group(1)
                    attrs = match.group(2)
                    content = match.group(3)
                    # Fermer la balise
                    fixed_lines.append(f"{line.rstrip()}</{tag_name}>")
                    i += 1
                    continue
            
            fixed_lines.append(line)
            i += 1
        
        # Vérifier les balises restantes dans la stack à la fin
        while tag_stack:
            last_open = tag_stack.pop()
            fixed_lines.append(' ' * last_open['indent'] + f"</{last_open['tag']}>")
        
        new_content = '\n'.join(fixed_lines)
        
        # Corrections supplémentaires avec regex
        # Fix: Missing </Button> before </div> and ))}
        new_content = re.sub(
            r'(Réutiliser|Réinitialiser|Configurer|Utiliser|Connecter|Gérer|Explorer|Créer|Activer|Appliquer|Essayer|Ouvrir)\s*\n\s*</div>\s*\n\s*\)\)\}',
            r'\1\n                        </Button>\n                      </div>\n                    ))}',
            new_content
        )
        
        # Fix: Missing </Badge> before </div>
        new_content = re.sub(
            r'(\{[^}]*\})\s*\n\s*</div>',
            lambda m: m.group(1) + '</Badge>\n                    </div>' if '<Badge' in new_content[:new_content.find(m.group(0))] and '</Badge>' not in new_content[new_content.rfind('<Badge', 0, new_content.find(m.group(0))):new_content.find(m.group(0))] else m.group(0),
            new_content
        )
        
        # Fix: Remove orphan closing tags
        new_content = re.sub(r'\s*</Select>\s*\n', '\n', new_content)
        new_content = re.sub(r'\s*</Badge>\s*\n\s*return\s*\(', '\n                      return (', new_content)
        
        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        return False

def main():
    print('🔧 Correction finale complète de toutes les erreurs JSX...\n')
    
    # Fichiers avec erreurs identifiés
    problem_files = [
        'ab-testing/page.tsx',
        'affiliate/page.tsx',
        'ai-studio/animations/page.tsx',
        'ai-studio/page.tsx',
        'ai-studio/2d/page.tsx',
    ]
    
    fixed_count = 0
    for file in problem_files:
        file_path = os.path.join(DASHBOARD_PATH, file)
        if os.path.exists(file_path):
            if fix_jsx_file(file_path):
                print(f'✅ {file}')
                fixed_count += 1
            else:
                print(f'⏭️  {file} (pas de corrections)')
        else:
            print(f'❌ {file} (fichier non trouvé)')
    
    print(f'\n📊 {fixed_count} fichier(s) corrigé(s)')

if __name__ == '__main__':
    main()








