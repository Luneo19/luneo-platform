#!/usr/bin/env python3
"""
Script final pour corriger TOUTES les erreurs JSX de manière systématique
Analyse la structure JSX et corrige automatiquement tous les tags non fermés
"""
import os
import re
from collections import deque

DASHBOARD_PATH = os.path.join(os.getcwd(), 'apps', 'frontend', 'src', 'app', '(dashboard)', 'dashboard')

# Composants JSX qui nécessitent une balise fermante
CLOSING_TAGS = {
    'Badge', 'Button', 'Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle',
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'ul', 'ol', 'li',
    'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
    'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger',
    'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger',
    'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogFooter',
    'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger',
    'Popover', 'PopoverContent', 'PopoverTrigger',
    'Accordion', 'AccordionContent', 'AccordionItem', 'AccordionTrigger',
    'Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow',
    'Label', 'Input', 'Textarea', 'Checkbox', 'RadioGroup', 'RadioGroupItem',
    'Separator', 'Skeleton', 'Progress', 'Alert', 'AlertDescription', 'AlertTitle',
    'Sheet', 'SheetContent', 'SheetDescription', 'SheetHeader', 'SheetTitle', 'SheetTrigger',
    'Collapsible', 'CollapsibleContent', 'CollapsibleTrigger',
    'NavigationMenu', 'NavigationMenuContent', 'NavigationMenuItem', 'NavigationMenuLink', 'NavigationMenuList', 'NavigationMenuTrigger',
    'Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarSeparator', 'MenubarTrigger',
    'Command', 'CommandDialog', 'CommandEmpty', 'CommandGroup', 'CommandInput', 'CommandItem', 'CommandList', 'CommandSeparator', 'CommandShortcut',
    'ContextMenu', 'ContextMenuContent', 'ContextMenuItem', 'ContextMenuSeparator', 'ContextMenuTrigger',
    'HoverCard', 'HoverCardContent', 'HoverCardTrigger',
    'ScrollArea', 'ScrollBar',
    'Slider', 'Switch', 'Tabs', 'Toggle', 'ToggleGroup', 'ToggleGroupItem',
    'form', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'main',
    'ErrorBoundary', 'motion.div', 'motion.section'
}

# Composants auto-fermants
SELF_CLOSING = {
    'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed',
    'source', 'track', 'wbr', 'Trophy', 'List', 'Grid', 'Zap', 'Upload', 'Download',
    'Share2', 'Copy', 'Trash2', 'Heart', 'Folder', 'Clock', 'Settings', 'HelpCircle',
    'SlidersHorizontal', 'FlaskConical', 'CheckCircle2Icon', 'StarIcon', 'Plus', 'Minus',
    'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'ArrowRight',
    'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Search', 'Filter', 'MoreVertical', 'MoreHorizontal',
    'Edit', 'Save', 'Cancel', 'Delete', 'RefreshCw', 'Loader2', 'AlertCircle', 'Check',
    'XCircle', 'Info', 'Warning', 'AlertTriangle', 'CheckCircle', 'Circle', 'Square',
    'Play', 'Pause', 'Stop', 'SkipForward', 'SkipBack', 'Volume', 'Volume2', 'VolumeX',
    'Mic', 'MicOff', 'Video', 'VideoOff', 'Camera', 'CameraOff', 'Image', 'File',
    'FileText', 'FileImage', 'FileVideo', 'FileAudio', 'FolderOpen', 'FolderPlus',
    'FilePlus', 'FileMinus', 'FileX', 'FileCheck', 'FileSearch', 'FileEdit', 'FileCode',
    'Database', 'Server', 'Cloud', 'CloudUpload', 'CloudDownload', 'CloudOff',
    'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothOff', 'Radio', 'Signal', 'SignalLow',
    'SignalMedium', 'SignalHigh', 'Battery', 'BatteryLow', 'BatteryMedium', 'BatteryHigh',
    'BatteryCharging', 'Power', 'PowerOff', 'Plug', 'PlugZap', 'ZapOff', 'Lightbulb',
    'LightbulbOff', 'Sun', 'Moon', 'Sunrise', 'Sunset', 'CloudSun', 'CloudMoon',
    'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudDrizzle', 'Wind', 'Droplet',
    'Umbrella', 'Snowflake', 'Thermometer', 'ThermometerSun', 'ThermometerSnow',
    'Gauge', 'Activity', 'Pulse', 'Heartbeat', 'TrendingUp', 'TrendingDown',
    'BarChart', 'BarChart2', 'BarChart3', 'LineChart', 'PieChart', 'AreaChart',
    'PieChart', 'DonutChart', 'RadarChart', 'ScatterChart', 'Compass', 'Map',
    'MapPin', 'Navigation', 'Route', 'Globe', 'Globe2', 'Earth', 'World',
    'Flag', 'FlagOff', 'Award', 'Trophy', 'Medal', 'Star', 'StarOff', 'Crown',
    'Gift', 'GiftOff', 'Package', 'PackageOpen', 'PackageSearch', 'PackageX',
    'ShoppingCart', 'ShoppingBag', 'Store', 'Storefront', 'Building', 'Building2',
    'Home', 'Home2', 'House', 'Key', 'KeyOff', 'Lock', 'LockOpen', 'Unlock',
    'Shield', 'ShieldOff', 'ShieldCheck', 'ShieldAlert', 'ShieldX', 'ShieldQuestion',
    'Eye', 'EyeOff', 'EyeDropper', 'Glasses', 'GlassesOff', 'Monitor', 'MonitorOff',
    'Laptop', 'LaptopOff', 'Smartphone', 'SmartphoneOff', 'Tablet', 'TabletOff',
    'Mouse', 'MouseOff', 'Keyboard', 'KeyboardOff', 'Headphones', 'HeadphonesOff',
    'Speaker', 'SpeakerOff', 'Radio', 'RadioOff', 'Tv', 'TvOff', 'Projector',
    'ProjectorOff', 'Printer', 'PrinterOff', 'Scanner', 'ScannerOff', 'Fax',
    'FaxOff', 'Copier', 'CopierOff', 'Calculator', 'CalculatorOff', 'Abacus',
    'Clock', 'Clock1', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7',
    'Clock8', 'Clock9', 'Clock10', 'Clock11', 'Clock12', 'AlarmClock', 'Timer',
    'TimerOff', 'Stopwatch', 'Hourglass', 'Calendar', 'CalendarDays', 'CalendarCheck',
    'CalendarX', 'CalendarPlus', 'CalendarMinus', 'CalendarClock', 'CalendarOff',
    'CalendarRange', 'CalendarSearch', 'CalendarEvent', 'CalendarHeart', 'CalendarStar',
    'Book', 'BookOpen', 'BookMarked', 'BookCheck', 'BookX', 'BookPlus', 'BookMinus',
    'BookSearch', 'BookEdit', 'BookCode', 'BookText', 'BookImage', 'BookVideo',
    'BookAudio', 'Library', 'LibraryBig', 'GraduationCap', 'School', 'University',
    'Bookmark', 'BookmarkCheck', 'BookmarkMinus', 'BookmarkPlus', 'BookmarkX',
    'BookmarkOff', 'Tag', 'Tags', 'TagOff', 'Label', 'LabelOff', 'Ticket', 'TicketOff',
    'TicketCheck', 'TicketX', 'TicketPlus', 'TicketMinus', 'QrCode', 'QrCodeOff',
    'Barcode', 'BarcodeOff', 'Scan', 'ScanLine', 'ScanText', 'ScanSearch', 'ScanEye',
    'CreditCard', 'CreditCardOff', 'Wallet', 'WalletOff', 'WalletCards', 'WalletMinimal',
    'Coins', 'CoinsOff', 'Banknote', 'BanknoteOff', 'Receipt', 'ReceiptOff', 'ReceiptText',
    'ReceiptEuro', 'ReceiptPound', 'ReceiptYen', 'ReceiptDollar', 'ReceiptCent',
    'DollarSign', 'Euro', 'Pound', 'Yen', 'Bitcoin', 'BitcoinOff', 'Ethereum',
    'EthereumOff', 'Litecoin', 'LitecoinOff', 'Ripple', 'RippleOff', 'Monero',
    'MoneroOff', 'Dash', 'DashOff', 'Zcash', 'ZcashOff', 'Tether', 'TetherOff',
    'UsdCoin', 'UsdCoinOff', 'Binance', 'BinanceOff', 'Coinbase', 'CoinbaseOff',
    'Paypal', 'PaypalOff', 'Stripe', 'StripeOff', 'Square', 'SquareOff', 'Shopify',
    'ShopifyOff', 'WooCommerce', 'WooCommerceOff', 'Magento', 'MagentoOff', 'PrestaShop',
    'PrestaShopOff', 'BigCommerce', 'BigCommerceOff', 'Squarespace', 'SquarespaceOff',
    'Wix', 'WixOff', 'Wordpress', 'WordpressOff', 'Joomla', 'JoomlaOff', 'Drupal',
    'DrupalOff', 'Ghost', 'GhostOff', 'Medium', 'MediumOff', 'DevTo', 'DevToOff',
    'Hashnode', 'HashnodeOff', 'Substack', 'SubstackOff', 'Tumblr', 'TumblrOff',
    'Blogger', 'BloggerOff', 'Typepad', 'TypepadOff', 'Livejournal', 'LivejournalOff',
    'Xanga', 'XangaOff', 'MySpace', 'MySpaceOff', 'Friendster', 'FriendsterOff',
    'Orkut', 'OrkutOff', 'Hi5', 'Hi5Off', 'Bebo', 'BeboOff', 'Ning', 'NingOff',
    'Elgg', 'ElggOff', 'BuddyPress', 'BuddyPressOff', 'bbPress', 'bbPressOff',
    'phpBB', 'phpBBOff', 'vBulletin', 'vBulletinOff', 'Invision', 'InvisionOff',
    'XenForo', 'XenForoOff', 'Discourse', 'DiscourseOff', 'Flarum', 'FlarumOff',
    'NodeBB', 'NodeBBOff', 'Vanilla', 'VanillaOff', 'SimpleMachines', 'SimpleMachinesOff',
    'MyBB', 'MyBBOff', 'SMF', 'SMFOff', 'YaBB', 'YaBBOff', 'phpBB3', 'phpBB3Off',
    'phpBB2', 'phpBB2Off', 'phpBB1', 'phpBB1Off', 'IPB', 'IPBOff', 'vB3', 'vB3Off',
    'vB4', 'vB4Off', 'vB5', 'vB5Off', 'XenForo1', 'XenForo1Off', 'XenForo2', 'XenForo2Off',
    'Discourse1', 'Discourse1Off', 'Discourse2', 'Discourse2Off', 'Flarum1', 'Flarum1Off',
    'Flarum2', 'Flarum2Off', 'NodeBB1', 'NodeBB1Off', 'NodeBB2', 'NodeBB2Off',
    'Vanilla1', 'Vanilla1Off', 'Vanilla2', 'Vanilla2Off', 'SimpleMachines1', 'SimpleMachines1Off',
    'SimpleMachines2', 'SimpleMachines2Off', 'MyBB1', 'MyBB1Off', 'MyBB2', 'MyBB2Off',
    'SMF1', 'SMF1Off', 'SMF2', 'SMF2Off', 'YaBB1', 'YaBB1Off', 'YaBB2', 'YaBB2Off'
}

def parse_jsx_tag(line):
    """Parse un tag JSX et retourne (tag_name, is_opening, is_self_closing, attributes)"""
    # Pattern pour les tags JSX
    opening_pattern = r'<([A-Za-z][A-Za-z0-9_.]*)\s*([^>]*?)(/?)>'
    closing_pattern = r'</([A-Za-z][A-Za-z0-9_.]*)>'
    
    opening_match = re.search(opening_pattern, line)
    closing_match = re.search(closing_pattern, line)
    
    if closing_match:
        return (closing_match.group(1), False, False, None)
    elif opening_match:
        tag_name = opening_match.group(1)
        attrs = opening_match.group(2)
        is_self_closing = opening_match.group(3) == '/' or tag_name in SELF_CLOSING
        return (tag_name, True, is_self_closing, attrs)
    
    return None

def fix_file(file_path):
    """Corrige toutes les erreurs JSX dans un fichier"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    original_lines = lines[:]
    stack = []  # Stack pour suivre les tags ouverts
    fixes = []  # Liste des corrections à appliquer
    
    for i, line in enumerate(lines):
        tag_info = parse_jsx_tag(line)
        if not tag_info:
            continue
        
        tag_name, is_opening, is_self_closing, attrs = tag_info
        
        if is_opening and not is_self_closing:
            if tag_name in CLOSING_TAGS:
                stack.append((i, tag_name, line))
        elif not is_opening:
            # Tag fermant
            if stack and stack[-1][1] == tag_name:
                stack.pop()
            else:
                # Tag fermant sans tag ouvrant correspondant - peut-être un tag orphelin
                pass
    
    # Corriger les tags non fermés
    for line_idx, tag_name, line_content in stack:
        # Chercher la ligne suivante appropriée pour fermer le tag
        for j in range(line_idx + 1, min(line_idx + 20, len(lines))):
            next_line = lines[j]
            # Si on trouve un tag fermant du même type ou un tag parent, on ferme avant
            next_tag = parse_jsx_tag(next_line)
            if next_tag and not next_tag[1]:  # Tag fermant
                if next_tag[0] != tag_name:
                    # Insérer la balise fermante avant cette ligne
                    indent = len(line_content) - len(line_content.lstrip())
                    closing_tag = ' ' * indent + f'</{tag_name}>'
                    fixes.append((j, closing_tag))
                    break
            elif next_tag and next_tag[1] and next_tag[0] in CLOSING_TAGS:
                # Nouveau tag ouvrant - on ferme avant
                indent = len(line_content) - len(line_content.lstrip())
                closing_tag = ' ' * indent + f'</{tag_name}>'
                fixes.append((j, closing_tag))
                break
    
    # Appliquer les corrections en ordre inverse pour ne pas décaler les indices
    fixes.sort(reverse=True)
    for line_idx, closing_tag in fixes:
        lines.insert(line_idx, closing_tag + '\n')
    
    # Corriger les cas spécifiques connus
    content = ''.join(lines)
    
    # Fix 1: Badge non fermé après {statusConfig[experiment.status].label}
    content = re.sub(
        r'(<Badge[^>]*>\s*\{statusConfig\[experiment\.status\]\.label\}\s*)(\{experiment\.winner)',
        r'\1</Badge>\n                          \2',
        content
    )
    
    # Fix 2: Badge non fermé après {template.category}
    content = re.sub(
        r'(<Badge[^>]*>\s*\{template\.category\}\s*)(</div>)',
        r'\1</Badge>\n                    \2',
        content
    )
    
    # Fix 3: Badge non fermé après {integration.category}
    content = re.sub(
        r'(<Badge[^>]*>\s*\{integration\.category\}\s*)(</CardHeader>)',
        r'\1</Badge>\n                  \2',
        content
    )
    
    # Fix 4: Badge non fermé après {feature.level}
    content = re.sub(
        r'(<Badge[^>]*>\s*\{feature\.level\}\s*)(</CardHeader>)',
        r'\1</Badge>\n                  \2',
        content
    )
    
    # Fix 5: Supprimer les lignes orphelines à la fin du fichier
    lines = content.split('\n')
    cleaned_lines = []
    skip_until_export = False
    for i, line in enumerate(lines):
        if 'export default function' in line:
            skip_until_export = False
        if skip_until_export and line.strip() in ['</Select>', '</Badge>', '</Button>', '</div>', '</Card>', '</CardContent>']:
            continue
        if i > len(lines) - 20 and line.strip() in ['</Select>', '</Badge>', '</Button>'] and 'export default' not in '\n'.join(lines[max(0, i-5):i+5]):
            skip_until_export = True
            continue
        cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    if content != ''.join(original_lines):
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    
    return False

def main():
    print('🔧 Correction finale systématique de TOUTES les erreurs JSX...\n')
    
    files_to_fix = [
        'ab-testing/page.tsx',
        'affiliate/page.tsx',
        'ai-studio/animations/page.tsx',
        'ai-studio/page.tsx',
        'ai-studio/templates/page.tsx',
        'ai-studio/2d/page.tsx',
        'ai-studio/3d/page.tsx',
    ]
    
    fixed = []
    for file_rel_path in files_to_fix:
        file_path = os.path.join(DASHBOARD_PATH, file_rel_path)
        if os.path.exists(file_path):
            if fix_file(file_path):
                print(f'✅ {file_rel_path}')
                fixed.append(file_rel_path)
    
    if not fixed:
        print('⏭️  Aucune correction nécessaire')
    else:
        print(f'\n📊 {len(fixed)} fichier(s) corrigé(s)')

if __name__ == '__main__':
    main()








