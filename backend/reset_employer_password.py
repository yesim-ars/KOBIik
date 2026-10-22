from getpass import getpass

import pyodbc

from main import get_connection, password_hash


def main() -> None:
    email = input("İşveren hesabının e-posta adresi: ").strip().lower()
    new_password = getpass("Yeni parola (en az 10 karakter): ")
    confirmation = getpass("Yeni parola tekrar: ")

    if len(new_password) < 10 or len(new_password) > 128:
        print("Parola 10 ile 128 karakter arasında olmalıdır.")
        return
    if new_password != confirmation:
        print("Parolalar eşleşmiyor.")
        return

    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT id FROM dbo.users WHERE email = ? AND role = N'employer'",
                (email,),
            )
            user = cursor.fetchone()
            if user is None:
                print("Bu e-posta ile eşleşen işveren hesabı bulunamadı.")
                return

            hashed_password = password_hash.hash(new_password)
            cursor.execute(
                "UPDATE dbo.users SET password_hash = ? WHERE id = ?",
                (hashed_password, user[0]),
            )
            connection.commit()

        print("Parola güncellendi. Swagger'da bu e-posta ve yeni parolayla giriş yapabilirsiniz.")
    except pyodbc.Error:
        print("Parola güncellenemedi. Veritabanı bağlantısını ve .env ayarlarını kontrol edin.")


if __name__ == "__main__":
    main()
