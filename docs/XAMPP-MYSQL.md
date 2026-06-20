# Levantar con XAMPP + MySQL

## 1. Iniciar MySQL en XAMPP

1. Abre **XAMPP Control Panel**
2. Pulsa **Start** en **MySQL** (debe quedar en verde)
3. Opcional: **Start** en Apache si quieres phpMyAdmin

## 2. Contraseña de root

Por defecto XAMPP usa `root` **sin contraseña** (`DB_PASSWORD` vacío en `.env.xampp`).

Si configuraste clave en MySQL:

```powershell
.\scripts\levantar-xampp.ps1 -DbPassword "tu_clave"
```

## 3. Levantar todo

```powershell
cd C:\xampp\htdocs\cursos
.\scripts\levantar-xampp.ps1
```

Crea la base `lms_saas`, migra tablas, seed demo y abre API + frontend.

## 4. URLs

| Servicio | URL |
|----------|-----|
| API | http://127.0.0.1:8000/api/health |
| phpMyAdmin | http://localhost/phpmyadmin |
| Frontend | http://localhost:3000/login |

## 5. Crear la BD a mano (opcional)

En phpMyAdmin o consola:

```sql
CREATE DATABASE lms_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "source C:/xampp/htdocs/cursos/scripts/crear-db-mysql.sql"
```

## 6. Variables en `backend/.env`

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lms_saas
DB_USERNAME=root
DB_PASSWORD=
```
