#!/bin/bash
# Fix Auth pages responsive - Corrections manuelles ciblées

echo "🔧 CORRECTIONS AUTH RESPONSIVE..."
echo ""

# Login page
echo "1. Login page..."
sed -i '' 's/className="min-h-screen/className="min-h-screen px-4 sm:px-6/g' apps/frontend/src/app/\(auth\)/login/page.tsx
sed -i '' 's/className="w-full max-w-md/className="w-full max-w-sm sm:max-w-md/g' apps/frontend/src/app/\(auth\)/login/page.tsx
sed -i '' 's/className="space-y-6"/className="space-y-4 sm:space-y-6"/g' apps/frontend/src/app/\(auth\)/login/page.tsx
sed -i '' 's/className="p-8"/className="p-4 sm:p-6 md:p-8"/g' apps/frontend/src/app/\(auth\)/login/page.tsx

# Register page
echo "2. Register page..."
sed -i '' 's/className="min-h-screen/className="min-h-screen px-4 sm:px-6/g' apps/frontend/src/app/\(auth\)/register/page.tsx
sed -i '' 's/className="w-full max-w-md/className="w-full max-w-sm sm:max-w-md/g' apps/frontend/src/app/\(auth\)/register/page.tsx
sed -i '' 's/className="space-y-6"/className="space-y-4 sm:space-y-6"/g' apps/frontend/src/app/\(auth\)/register/page.tsx
sed -i '' 's/className="p-8"/className="p-4 sm:p-6 md:p-8"/g' apps/frontend/src/app/\(auth\)/register/page.tsx

# Reset password page  
echo "3. Reset password page..."
sed -i '' 's/className="min-h-screen/className="min-h-screen px-4 sm:px-6/g' apps/frontend/src/app/\(auth\)/reset-password/page.tsx
sed -i '' 's/className="w-full max-w-md/className="w-full max-w-sm sm:max-w-md/g' apps/frontend/src/app/\(auth\)/reset-password/page.tsx
sed -i '' 's/className="space-y-6"/className="space-y-4 sm:space-y-6"/g' apps/frontend/src/app/\(auth\)/reset-password/page.tsx
sed -i '' 's/className="p-8"/className="p-4 sm:p-6 md:p-8"/g' apps/frontend/src/app/\(auth\)/reset-password/page.tsx

echo ""
echo "✅ Auth pages corrigées !"
echo "   • Padding responsive"
echo "   • Max-width responsive"
echo "   • Spacing responsive"

