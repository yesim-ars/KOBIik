
import os
import re
from datetime import datetime, timedelta, timezone

import jwt
import pyodbc
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
from pwdlib import PasswordHash

load_dotenv()

app = FastAPI(
    title="KOBİ İşe Alım Karar Destek Sistemi",
    description="İşe alım süreçlerini destekleyen API",
    version="0.2.0",
)

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
TOKEN_MINUTES = 30


def get_connection():
    server = os.getenv("DB_SERVER")
    database = os.getenv("DB_NAME")
    driver = os.getenv("DB_DRIVER")

    if not all([server, database, driver]):
        raise RuntimeError("Veritabanı ayarları .env dosyasında eksik.")

    connection_string = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(connection_string, timeout=5)


def create_access_token(user_id: int, role: str) -> str:
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY .env dosyasında tanımlanmamış.")

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Giriş yapmalısınız.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not JWT_SECRET_KEY:
        raise HTTPException(status_code=500, detail="JWT ayarı eksik.")

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload["sub"])
        role = payload["role"]
    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")

    return {"id": user_id, "role": role}


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=10, max_length=128)
    role: str
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    company_name: str | None = Field(default=None, max_length=200)
    sector: str | None = Field(default=None, max_length=100)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class JobCreateRequest(BaseModel):
    company_id: int | None = Field(default=None, gt=0)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    location: str = Field(min_length=1, max_length=200)
    work_type: str = Field(min_length=1, max_length=30)
    status: str = Field(default="published", pattern="^(draft|published)$")

    @field_validator("title", "description", "location", "work_type")
    @classmethod
    def strip_and_reject_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Bu alan boş olamaz.")
        return value


class ApplicationStatusRequest(BaseModel):
    status: str = Field(pattern="^(reviewing|interview|offer|hired|rejected)$")


@app.get("/")
def home():
    return {"message": "KOBİ Karar Destek Sistemi API çalışıyor."}


@app.get("/health/db")
def check_database():
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT DB_NAME()")
            database_name = cursor.fetchone()[0]

        return {"status": "connected", "database": database_name}

    except (pyodbc.Error, RuntimeError) as error:
        raise HTTPException(status_code=503, detail=f"Veritabanı bağlantısı başarısız: {error}")


@app.get("/jobs")
def get_jobs():
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT j.id, j.title, j.description, j.location,
                       j.work_type, j.status, c.name AS company_name
                FROM dbo.job_postings AS j
                INNER JOIN dbo.companies AS c ON c.id = j.company_id
                WHERE j.status = N'published'
                ORDER BY j.created_at DESC
            """)
            columns = [column[0] for column in cursor.description]
            jobs = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return {"count": len(jobs), "jobs": jobs}

    except (pyodbc.Error, RuntimeError) as error:
        raise HTTPException(status_code=503, detail=f"İlanlar alınamadı: {error}")


@app.post("/jobs", status_code=201)
def create_job(
    data: JobCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca işveren hesaplarına açıktır.")

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            company_filter = " AND em.company_id = ?" if data.company_id is not None else ""
            membership_params = (current_user["id"],)
            if data.company_id is not None:
                membership_params += (data.company_id,)

            cursor.execute(f"""
                SELECT TOP 1 em.company_id
                FROM dbo.employer_memberships AS em
                INNER JOIN dbo.users AS u ON u.id = em.user_id
                WHERE em.user_id = ?{company_filter}
                  AND u.is_active = 1 AND u.role = N'employer'
                ORDER BY em.company_id
            """, membership_params)

            membership = cursor.fetchone()
            if membership is None:
                raise HTTPException(status_code=403, detail="Bu işletme için ilan oluşturma yetkiniz yok.")
            company_id = membership.company_id

            cursor.execute("""
                INSERT INTO dbo.job_postings
                    (company_id, title, description, location, work_type, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                company_id,
                data.title,
                data.description,
                data.location,
                data.work_type,
                data.status,
            ))
            job_id = cursor.fetchone()[0]
            connection.commit()

        return {
            "message": "İlan oluşturuldu.",
            "job": {
                "id": job_id,
                "company_id": company_id,
                "title": data.title,
                "description": data.description,
                "location": data.location,
                "work_type": data.work_type,
                "status": data.status,
            },
        }

    except HTTPException:
        raise
    except (pyodbc.Error, RuntimeError):
        raise HTTPException(status_code=503, detail="İlan oluşturulamadı; veritabanına erişilemedi.")


@app.get("/employer/jobs")
def get_employer_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca işveren hesaplarına açıktır.")

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT j.id, j.company_id, j.title, j.description, j.location,
                       j.work_type, j.status, c.name AS company_name
                FROM dbo.job_postings AS j
                INNER JOIN dbo.companies AS c ON c.id = j.company_id
                INNER JOIN dbo.employer_memberships AS em ON em.company_id = j.company_id
                INNER JOIN dbo.users AS u ON u.id = em.user_id
                WHERE em.user_id = ? AND u.is_active = 1 AND u.role = N'employer'
                ORDER BY j.created_at DESC
            """, (current_user["id"],))
            columns = [column[0] for column in cursor.description]
            jobs = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return {"count": len(jobs), "jobs": jobs}

    except (pyodbc.Error, RuntimeError):
        raise HTTPException(status_code=503, detail="İşveren ilanları alınamadı; veritabanına erişilemedi.")


@app.get("/candidate/profile")
def get_candidate_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca aday hesaplarına açıktır.")

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT cp.id, cp.first_name, cp.last_name, cp.phone,
                       cp.location, cp.summary, cp.created_at
                FROM dbo.candidate_profiles AS cp
                INNER JOIN dbo.users AS u ON u.id = cp.user_id
                WHERE cp.user_id = ? AND u.is_active = 1 AND u.role = N'candidate'
            """, (current_user["id"],))
            profile = cursor.fetchone()

        if profile is None:
            raise HTTPException(status_code=404, detail="Aday profili bulunamadı.")

        columns = [column[0] for column in cursor.description]
        return dict(zip(columns, profile))

    except HTTPException:
        raise
    except (pyodbc.Error, RuntimeError):
        raise HTTPException(status_code=503, detail="Aday profili alınamadı; veritabanına erişilemedi.")


@app.post("/jobs/{job_id}/apply", status_code=201)
def apply_to_job(job_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="İlana yalnızca aday hesabıyla başvurabilirsiniz.")

    if job_id <= 0:
        raise HTTPException(status_code=422, detail="İlan numarası pozitif olmalıdır.")

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT cp.id
                FROM dbo.candidate_profiles AS cp
                INNER JOIN dbo.users AS u ON u.id = cp.user_id
                WHERE cp.user_id = ? AND u.is_active = 1 AND u.role = N'candidate'
            """, (current_user["id"],))
            profile = cursor.fetchone()
            if profile is None:
                raise HTTPException(status_code=404, detail="Aktif aday profili bulunamadı.")
            candidate_id = profile[0]

            cursor.execute("""
                SELECT id
                FROM dbo.job_postings
                WHERE id = ? AND status = N'published'
                  AND (closes_at IS NULL OR closes_at >= SYSDATETIME())
            """, (job_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Yayında ve başvuruya açık ilan bulunamadı.")

            cursor.execute("""
                SELECT id FROM dbo.applications
                WHERE job_id = ? AND candidate_id = ?
            """, (job_id, candidate_id))
            if cursor.fetchone() is not None:
                raise HTTPException(status_code=409, detail="Bu ilana zaten başvurdunuz.")

            cursor.execute("""
                INSERT INTO dbo.applications (job_id, candidate_id, source, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, N'candidate_applied', N'new')
            """, (job_id, candidate_id))
            application_id = cursor.fetchone()[0]
            connection.commit()

        return {
            "message": "Başvurunuz alındı.",
            "application": {
                "id": application_id,
                "job_id": job_id,
                "candidate_id": candidate_id,
                "status": "new",
            },
        }

    except HTTPException:
        raise
    except pyodbc.IntegrityError:
        raise HTTPException(status_code=409, detail="Bu ilana zaten başvurdunuz.")
    except (pyodbc.Error, RuntimeError):
        raise HTTPException(status_code=503, detail="Başvuru kaydedilemedi; veritabanına erişilemedi.")


@app.get("/candidate/applications")
def get_candidate_applications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca aday hesaplarına açıktır.")

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT a.id, a.job_id, j.title, c.name AS company_name,
                       a.status, a.source, a.created_at, a.updated_at
                FROM dbo.applications AS a
                INNER JOIN dbo.candidate_profiles AS cp ON cp.id = a.candidate_id
                INNER JOIN dbo.users AS u ON u.id = cp.user_id
                INNER JOIN dbo.job_postings AS j ON j.id = a.job_id
                INNER JOIN dbo.companies AS c ON c.id = j.company_id
                WHERE cp.user_id = ? AND u.is_active = 1 AND u.role = N'candidate'
                ORDER BY a.created_at DESC
            """, (current_user["id"],))
            columns = [column[0] for column in cursor.description]
            applications = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return {"count": len(applications), "applications": applications}

    except (pyodbc.Error, RuntimeError):
        raise HTTPException(status_code=503, detail="Başvurular alınamadı; veritabanına erişilemedi.")


@app.get("/employer/jobs/{job_id}/applications")
def get_job_applications(job_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca işveren hesaplarına açıktır.")
    if job_id <= 0:
        raise HTTPException(status_code=422, detail="İlan numarası pozitif olmalıdır.")

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT a.id AS application_id, a.job_id, a.candidate_id,
                       cp.first_name, cp.last_name, cp.phone, cp.location,
                       cp.summary, a.source, a.status, a.created_at, a.updated_at
                FROM dbo.applications AS a
                INNER JOIN dbo.job_postings AS j ON j.id = a.job_id
                INNER JOIN dbo.employer_memberships AS em ON em.company_id = j.company_id
                INNER JOIN dbo.users AS u ON u.id = em.user_id
                INNER JOIN dbo.candidate_profiles AS cp ON cp.id = a.candidate_id
                WHERE j.id = ? AND em.user_id = ?
                  AND u.is_active = 1 AND u.role = N'employer'
                ORDER BY a.created_at DESC
            """, (job_id, current_user["id"]))
            columns = [column[0] for column in cursor.description]
            applications = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return {"count": len(applications), "applications": applications}

    except (pyodbc.Error, RuntimeError):
        raise HTTPException(status_code=503, detail="İlan başvuruları alınamadı; veritabanına erişilemedi.")


@app.patch("/employer/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    data: ApplicationStatusRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca işveren hesaplarına açıktır.")
    if application_id <= 0:
        raise HTTPException(status_code=422, detail="Başvuru numarası pozitif olmalıdır.")

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                UPDATE a
                SET status = ?, updated_at = SYSDATETIME()
                OUTPUT INSERTED.id, INSERTED.job_id, INSERTED.status, INSERTED.updated_at
                FROM dbo.applications AS a
                INNER JOIN dbo.job_postings AS j ON j.id = a.job_id
                INNER JOIN dbo.employer_memberships AS em ON em.company_id = j.company_id
                INNER JOIN dbo.users AS u ON u.id = em.user_id
                WHERE a.id = ? AND em.user_id = ?
                  AND u.is_active = 1 AND u.role = N'employer'
            """, (data.status, application_id, current_user["id"]))
            updated = cursor.fetchone()

            if updated is None:
                raise HTTPException(status_code=404, detail="Başvuru bulunamadı veya bu başvuruyu güncelleme yetkiniz yok.")

            connection.commit()

        return {
            "message": "Başvuru durumu güncellendi.",
            "application": {
                "id": updated.id,
                "job_id": updated.job_id,
                "status": updated.status,
                "updated_at": updated.updated_at,
            },
        }

    except HTTPException:
        raise
    except (pyodbc.Error, RuntimeError):
        raise HTTPException(status_code=503, detail="Başvuru durumu güncellenemedi; veritabanına erişilemedi.")


@app.post("/auth/register", status_code=201)
def register(data: RegisterRequest):
    email = data.email.strip().lower()

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=422, detail="Geçerli bir e-posta adresi girin.")

    if data.role not in ("candidate", "employer"):
        raise HTTPException(
            status_code=422,
            detail="Rol candidate veya employer olmalıdır.",
        )

    if data.role == "candidate":
        if not data.first_name or not data.first_name.strip():
            raise HTTPException(status_code=422, detail="Ad alanı zorunludur.")
        if not data.last_name or not data.last_name.strip():
            raise HTTPException(status_code=422, detail="Soyad alanı zorunludur.")

    if data.role == "employer":
        if not data.company_name or not data.company_name.strip():
            raise HTTPException(status_code=422, detail="İşletme adı zorunludur.")

    if not JWT_SECRET_KEY:
        raise HTTPException(status_code=500, detail="JWT_SECRET_KEY ayarlanmamış.")

    hashed_password = password_hash.hash(data.password)

    try:
        with get_connection() as connection:
            cursor = connection.cursor()

            cursor.execute(
                "SELECT id FROM dbo.users WHERE email = ?",
                (email,),
            )
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="Bu e-posta zaten kayıtlı.")

            cursor.execute("""
                INSERT INTO dbo.users (email, password_hash, role)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?)
            """, (email, hashed_password, data.role))
            user_id = cursor.fetchone()[0]

            if data.role == "candidate":
                cursor.execute("""
                    INSERT INTO dbo.candidate_profiles
                        (user_id, first_name, last_name)
                    VALUES (?, ?, ?)
                """, (
                    user_id,
                    data.first_name.strip(),
                    data.last_name.strip(),
                ))
            else:
                cursor.execute("""
                    INSERT INTO dbo.companies (name, sector)
                    OUTPUT INSERTED.id
                    VALUES (?, ?)
                """, (data.company_name.strip(), data.sector))
                company_id = cursor.fetchone()[0]

                cursor.execute("""
                    INSERT INTO dbo.employer_memberships
                        (company_id, user_id, membership_role)
                    VALUES (?, ?, 'owner')
                """, (company_id, user_id))

            connection.commit()

        token = create_access_token(user_id, data.role)
        return {
            "message": "Kayıt başarılı.",
            "user": {"id": user_id, "email": email, "role": data.role},
            "access_token": token,
            "token_type": "bearer",
        }

    except HTTPException:
        raise
    except pyodbc.Error:
        raise HTTPException(
            status_code=500,
            detail="Kayıt sırasında veritabanı işlemi başarısız oldu.",
        )


@app.post("/auth/login")
def login(data: LoginRequest):
    email = data.email.strip().lower()

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT id, email, password_hash, role, is_active
                FROM dbo.users
                WHERE email = ?
            """, (email,))
            user = cursor.fetchone()

        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="E-posta veya parola hatalı.")

        try:
            password_valid = password_hash.verify(data.password, user.password_hash)
        except (ValueError, TypeError):
            password_valid = False

        if not password_valid:
            raise HTTPException(status_code=401, detail="E-posta veya parola hatalı.")

        token = create_access_token(user.id, user.role)
        return {
            "message": "Giriş başarılı.",
            "user": {"id": user.id, "email": user.email, "role": user.role},
            "access_token": token,
            "token_type": "bearer",
        }

    except HTTPException:
        raise
    except pyodbc.Error:
        raise HTTPException(status_code=503, detail="Veritabanına erişilemedi.")


@app.get("/auth/me")
def get_my_account(current_user: dict = Depends(get_current_user)):
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT id, email, role, is_active, created_at
                FROM dbo.users
                WHERE id = ?
            """, (current_user["id"],))
            user = cursor.fetchone()

        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Hesap bulunamadı veya pasif.")

        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
        }

    except HTTPException:
        raise
    except pyodbc.Error:
        raise HTTPException(status_code=503, detail="Veritabanına erişilemedi.")

