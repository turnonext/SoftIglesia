# Docker: error `lookup registry-1.docker.io: no such host`

Docker Desktop no puede resolver el DNS de Docker Hub. No es un fallo del proyecto LMS.

## Soluciones (Windows)

### 1. DNS en Docker Desktop

1. Abre **Docker Desktop** → **Settings** → **Docker Engine**
2. Añade o fusiona:

```json
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
```

3. **Apply & Restart**

### 2. DNS de Windows

```powershell
ipconfig /flushdns
```

Reinicia Docker Desktop.

### 3. VPN / firewall / antivirus

Desactiva temporalmente VPN o proxy que bloquee `registry-1.docker.io`.

### 4. Modo DNS de Docker Desktop

**Settings** → **Network** → prueba desactivar *Use kernel networking* o configurar proxy corporativo si aplica.

### 5. Probar conectividad

```powershell
nslookup registry-1.docker.io
ping registry-1.docker.io
```

Si `nslookup` falla, el problema es red/DNS del PC, no Laravel.

---

## Alternativa: levantar sin Docker

Con XAMPP (ya instalado):

```powershell
cd C:\xampp\htdocs\cursos
.\scripts\levantar-xampp.ps1
```

- Backend: `http://127.0.0.1:8000`
- Base de datos: **SQLite** (archivo `backend/database/database.sqlite`)
- Sin build de imágenes PHP

Cuando Docker vuelva a resolver DNS:

```powershell
.\scripts\levantar.ps1
```
