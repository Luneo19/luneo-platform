# 🔐 **SSO ENTERPRISE - CONFIGURATION SUPABASE**

---

## 🎯 **SUPABASE SUPPORTE SSO NATIVEMENT !**

Supabase Auth prend en charge **SAML 2.0** pour les clients enterprise.

---

## 📋 **CONFIGURATION (30 min)**

### **1. Activer SSO dans Supabase**

1. Va sur : https://supabase.com/dashboard/project/obrijgptqztacolemsbk
2. Clique sur **Authentication** → **Providers**
3. Scroll jusqu'à **Enterprise** section
4. Active **SAML 2.0**

---

### **2. Providers SSO supportés**

Supabase supporte automatiquement :
- ✅ **Azure AD** (Microsoft)
- ✅ **Okta**
- ✅ **Google Workspace**
- ✅ **OneLogin**
- ✅ **Auth0**
- ✅ **Keycloak**
- ✅ **ADFS**
- ✅ **Ping Identity**

---

### **3. Configuration exemple (Azure AD)**

#### **Dans Azure AD** :
1. Crée une **Enterprise Application**
2. Configure SAML SSO
3. Note les valeurs :
   - Metadata URL
   - Entity ID
   - ACS URL

#### **Dans Supabase** :
1. Colle les valeurs Azure dans Supabase SSO settings
2. Active le provider
3. Note l'**ACS URL** Supabase : `https://obrijgptqztacolemsbk.supabase.co/auth/v1/sso/saml/acs`

#### **Retour dans Azure AD** :
1. Configure l'ACS URL Supabase
2. Ajoute les users/groups autorisés
3. ✅ **C'EST FAIT !**

---

### **4. Test SSO**

```typescript
// Dans le frontend
const { data, error } = await supabase.auth.signInWithSSO({
  domain: 'company.com', // Domain de l'entreprise
});

// Redirige vers le provider SSO
// Après auth, retour sur app.luneo.app
```

---

## 💡 **INTÉGRATION DANS LUNEO**

### **API Route SSO**

Créer `/api/auth/sso/route.ts` :

```typescript
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { domain } = await request.json();
  
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithSSO({
    domain,
  });
  
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  
  // Rediriger vers le SSO provider
  return NextResponse.redirect(data.url);
}
```

---

### **Page de login SSO**

Ajouter dans `/login/page.tsx` :

```tsx
const handleSSOLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const response = await fetch('/api/auth/sso', {
    method: 'POST',
    body: JSON.stringify({ domain: companyDomain }),
  });
  const data = await response.json();
  window.location.href = data.url;
};
```

---

## 🏢 **CLIENTS ENTERPRISE SUPPORTÉS**

Avec SSO, tu peux accueillir :
- Microsoft (Azure AD) ✅
- Google Workspace ✅
- Okta ✅
- Salesforce ✅
- **Toutes les grandes entreprises** ✅

---

## ✅ **RÉSULTAT**

Une fois configuré :
- ✅ Login enterprise en 1 clic
- ✅ Gestion centralisée des accès
- ✅ Audit trail complet
- ✅ MFA/2FA supporté (via le provider)
- ✅ Provisioning/Deprovisioning auto

---

**🌟 SSO ENTERPRISE READY ! 🌟**

**Note** : Nécessite un plan Supabase Pro ($25/mois) pour SSO SAML.

