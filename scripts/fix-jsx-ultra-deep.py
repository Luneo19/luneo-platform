#!/usr/bin/env python3
"""
Script ultra approfondi pour analyser et corriger TOUTES les erreurs JSX
Utilise un parsing avancé avec pile de balises pour détecter et corriger toutes les erreurs
"""
import os
import re
import sys

DASHBOARD_PATH = os.path.join(os.getcwd(), 'apps', 'frontend', 'src', 'app', '(dashboard)', 'dashboard')

# Tous les composants qui nécessitent une balise fermante
REQUIRES_CLOSING = {
    'Button', 'Badge', 'Card', 'CardContent', 'CardHeader', 'CardTitle', 'CardDescription',
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a',
    'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent', 'Accordion', 'AccordionItem',
    'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
    'Select', 'SelectTrigger', 'SelectContent', 'SelectItem', 'Label', 'Input', 'Textarea',
    'Separator', 'Progress', 'Alert', 'AlertTitle', 'AlertDescription',
    'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger',
    'Table', 'TableHeader', 'TableBody', 'TableRow', 'TableCell', 'TableHead',
    'form', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'
}

# Composants self-closing
SELF_CLOSING = {'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'}

def is_self_closing(tag_name, attrs_str):
    """Vérifie si une balise est self-closing"""
    if tag_name.lower() in SELF_CLOSING:
        return True
    if attrs_str.strip().endswith('/') or '/>' in attrs_str:
        return True
    return False

def fix_jsx_file_ultra(file_path):
    """Corrige toutes les erreurs JSX avec une analyse ultra approfondie"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        lines = content.split('\n')
        fixed_lines = []
        tag_stack = []  # Pile pour suivre les balises ouvertes
        
        i = 0
        while i < len(lines):
            line = lines[i]
            original_line = line
            indent = len(line) - len(line.lstrip())
            
            # Détecter toutes les balises ouvrantes
            open_tag_pattern = r'<(\w+)([^>]*?)(/?)>'
            for match in re.finditer(open_tag_pattern, line):
                tag_name = match.group(1)
                attrs = match.group(2)
                is_self_closing_tag = match.group(3) == '/' or is_self_closing(tag_name, attrs)
                
                if not is_self_closing_tag and tag_name in REQUIRES_CLOSING:
                    tag_stack.append({
                        'tag': tag_name,
                        'line': i + 1,
                        'indent': indent,
                        'full_match': match.group(0)
                    })
            
            # Détecter toutes les balises fermantes
            close_tag_pattern = r'</(\w+)>'
            for match in re.finditer(close_tag_pattern, line):
                tag_name = match.group(1)
                # Retirer de la pile (chercher la dernière occurrence correspondante)
                for j in range(len(tag_stack) - 1, -1, -1):
                    if tag_stack[j]['tag'] == tag_name:
                        tag_stack.pop(j)
                        break
            
            # CORRECTIONS SPÉCIFIQUES
            
            # 1. Pattern: {variable} suivi de </div> ou ))} sans balise fermante
            if re.search(r'\{[^}]*\}\s*$', line) and i + 1 < len(lines):
                next_line = lines[i + 1]
                if re.match(r'^\s*</div>|^\s*\)\)\}|^\s*</Card|^\s*</Button|^\s*</Badge', next_line):
                    if tag_stack:
                        last_open = tag_stack[-1]
                        if last_open['tag'] in ['Button', 'Badge']:
                            # Insérer la balise fermante
                            fixed_lines.append(line)
                            fixed_lines.append(' ' * last_open['indent'] + f"</{last_open['tag']}>")
                            tag_stack.pop()
                            i += 1
                            continue
            
            # 2. Pattern: Badge ou Button avec {variable} non fermé sur la même ligne
            badge_button_pattern = r'<(Button|Badge)([^>]*)>\s*(\{[^}]*\})\s*$'
            if re.search(badge_button_pattern, line):
                match = re.search(badge_button_pattern, line)
                tag_name = match.group(1)
                attrs = match.group(2)
                content = match.group(3)
                # Fermer la balise
                line = f"{line.rstrip()}</{tag_name}>"
                # Retirer de la pile si présent
                for j in range(len(tag_stack) - 1, -1, -1):
                    if tag_stack[j]['tag'] == tag_name:
                        tag_stack.pop(j)
                        break
            
            # 3. Pattern: Missing </Select> before </div>
            if '</SelectContent>' in line and i + 1 < len(lines):
                next_line = lines[i + 1]
                if re.match(r'^\s*</div>', next_line) and not '</Select>' in line:
                    # Vérifier si Select est dans la pile
                    for j in range(len(tag_stack) - 1, -1, -1):
                        if tag_stack[j]['tag'] == 'Select':
                            line = line.rstrip() + '\n' + ' ' * tag_stack[j]['indent'] + '</Select>'
                            tag_stack.pop(j)
                            break
            
            # 4. Pattern: Orphan closing tags (balises fermantes orphelines)
            # Supprimer les balises fermantes orphelines avant return
            if line.strip() in ['</Select>', '</Badge>', '</Button>', '</div>']:
                if i + 1 < len(lines) and 'return' in lines[i + 1]:
                    i += 1
                    continue
            
            # 5. Pattern: Missing closing in conditional Badge
            conditional_badge = r'<Badge([^>]*)>(\{[^}]*\})\s*\n\s*\)\s*:'
            if re.search(conditional_badge, '\n'.join(lines[max(0, i-2):i+2])):
                line = re.sub(
                    r'<Badge([^>]*)>(\{[^}]*\})\s*\n\s*\)\s*:',
                    r'<Badge\1>\2</Badge>\n                    ) :',
                    line
                )
            
            # 6. Pattern: Text content before closing tag
            text_before_close = r'(\w+)\s*\n\s*</div>\s*\n\s*\)\)\}'
            if re.search(text_before_close, '\n'.join(lines[max(0, i-1):i+2])):
                match = re.search(text_before_close, '\n'.join(lines[max(0, i-1):i+2]))
                if match and tag_stack and tag_stack[-1]['tag'] == 'Button':
                    text = match.group(1)
                    line = f"{text}\n                        </Button>\n                      </div>\n                    ))}}"
                    tag_stack.pop()
            
            fixed_lines.append(line)
            i += 1
        
        # Fermer toutes les balises restantes dans la pile (à la fin du fichier)
        # Mais seulement si elles ne sont pas dans une fonction export default
        if tag_stack:
            # Vérifier si on est dans une fonction export default
            content_str = '\n'.join(fixed_lines)
            if 'export default function' in content_str:
                # Ne pas fermer les balises après export default
                pass
            else:
                # Fermer les balises restantes
                for tag_info in reversed(tag_stack):
                    fixed_lines.append(' ' * tag_info['indent'] + f"</{tag_info['tag']}>")
        
        new_content = '\n'.join(fixed_lines)
        
        # CORRECTIONS FINALES AVEC REGEX
        
        # Fix 1: Remove orphan </Select> tags before return
        new_content = re.sub(r'\s*</Select>\s*\n\s*return\s*\(', '\n  return (', new_content)
        new_content = re.sub(r'\s*</Badge>\s*\n\s*return\s*\(', '\n  return (', new_content)
        new_content = re.sub(r'\s*</Button>\s*\n\s*return\s*\(', '\n  return (', new_content)
        
        # Fix 2: Remove multiple orphan closing tags
        new_content = re.sub(r'\s*</Select>\s*\n\s*</Select>\s*\n', '\n', new_content)
        new_content = re.sub(r'\s*</Badge>\s*\n\s*</Badge>\s*\n', '\n', new_content)
        
        # Fix 3: Fix missing </Button> before </div> and ))}
        button_texts = ['Réutiliser', 'Réinitialiser', 'Configurer', 'Utiliser', 'Connecter', 
                       'Gérer', 'Explorer', 'Créer', 'Activer', 'Appliquer', 'Essayer', 
                       'Ouvrir', 'Commencer', "S'abonner", 'Nous contacter', 'Démarrer',
                       'Voir', 'Modifier', 'Supprimer', 'Partager', 'Télécharger']
        for text in button_texts:
            pattern = f'({re.escape(text)})\\s*\\n\\s*</div>\\s*\\n\\s*\\)\\)\\}}'
            replacement = text + '\\n                        </Button>\\n                      </div>\\n                    ))}}'
            new_content = re.sub(pattern, replacement, new_content)
        
        # Fix 4: Fix missing </Badge> before </div>
        new_content = re.sub(
            r'<Badge([^>]*)>(\{[^}]*\})\s*\n\s*</div>',
            r'<Badge\1>\2</Badge>\n                    </div>',
            new_content
        )
        
        # Fix 5: Fix missing </Select> after </SelectContent>
        new_content = re.sub(
            r'</SelectContent>\s*\n\s*</div>',
            r'</SelectContent>\n                </Select>\n              </div>',
            new_content
        )
        
        # Fix 6: Remove empty lines with only closing tags before return
        new_content = re.sub(r'\n\s*</(Select|Badge|Button|div)>\s*\n\s*return\s*\(', '\n  return (', new_content)
        
        # Fix 7: Fix duplicate closing tags
        new_content = re.sub(r'</Badge>\s*\n\s*</Badge>', '</Badge>', new_content)
        new_content = re.sub(r'</Button>\s*\n\s*</Button>', '</Button>', new_content)
        
        # Fix 8: Clean up orphan tags at end of file
        lines_final = new_content.split('\n')
        cleaned_lines = []
        i = 0
        while i < len(lines_final):
            line = lines_final[i]
            # Skip orphan closing tags before return or export
            if line.strip() in ['</Select>', '</Badge>', '</Button>', '</div>']:
                if i + 1 < len(lines_final):
                    next_line = lines_final[i + 1]
                    if 'return' in next_line or 'export' in next_line:
                        i += 1
                        continue
            cleaned_lines.append(line)
            i += 1
        new_content = '\n'.join(cleaned_lines)
        
        if new_content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    
    except Exception as e:
        print(f"  ❌ Erreur dans {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print('🔍 Analyse ultra approfondie et correction de TOUTES les erreurs JSX...\n')
    
    # Trouver tous les fichiers .tsx dans le dashboard
    all_files = []
    for root, dirs, files in os.walk(DASHBOARD_PATH):
        for file in files:
            if file.endswith('.tsx'):
                rel_path = os.path.relpath(os.path.join(root, file), DASHBOARD_PATH)
                all_files.append(rel_path)
    
    print(f'📋 {len(all_files)} fichier(s) trouvé(s)\n')
    
    fixed_count = 0
    error_count = 0
    
    for file in sorted(all_files):
        file_path = os.path.join(DASHBOARD_PATH, file)
        try:
            if fix_jsx_file_ultra(file_path):
                print(f'✅ {file}')
                fixed_count += 1
        except Exception as e:
            print(f'❌ {file} - Erreur: {e}')
            error_count += 1
    
    print(f'\n📊 Résultats:')
    print(f'   ✅ {fixed_count} fichier(s) corrigé(s)')
    print(f'   ❌ {error_count} erreur(s)')
    print(f'   ⏭️  {len(all_files) - fixed_count - error_count} fichier(s) sans corrections nécessaires')

if __name__ == '__main__':
    main()

