# 🌐 **CUSTOM DOMAINS - CONFIGURATION**

---

## 🎯 **CONFIGURATION (10 min)**

### **1. Dans Vercel Dashboard**

1. Va sur : https://vercel.com/luneos-projects/frontend
2. Clique sur **Settings** → **Domains**
3. Ajoute ces domains :

```
app.luneo.app (primary)
www.luneo.app (redirect → app.luneo.app)
api.luneo.app (API)
```

---

### **2. Dans ton registrar DNS (Cloudflare/Namecheap/etc.)**

Ajoute ces **enregistrements DNS** :

```dns
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: Auto

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto

Type: CNAME
Name: api
Value: cname.vercel-dns.com
TTL: Auto
```

---

### **3. Vérification (Vercel)**

Retourne sur Vercel → Domains  
Clique **Verify** pour chaque domain  
Attends 1-5 minutes (propagation DNS)

✅ **SSL automatique** (Vercel génère les certificats)

---

### **4. Variables d'environnement**

Mets à jour sur Vercel :

```env
NEXT_PUBLIC_APP_URL=https://app.luneo.app
NEXTAUTH_URL=https://app.luneo.app
```

Redéploie avec `npx vercel --prod`

---

## ✅ **C'EST TERMINÉ !**

Tes URLs seront :
- `https://app.luneo.app` (frontend)
- `https://app.luneo.app/api/*` (API)
- `https://www.luneo.app` (redirect → app)

**SSL : ✅ Automatique**  
**Temps : 10 minutes**

---

**🌟 CUSTOM DOMAINS CONFIGURÉS ! 🌟**

