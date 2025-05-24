# Finance Bot WhatsApp

A simple WhatsApp bot for managing finance, todo, and one-time scheduled tasks (tasker) using local JSON storage. No database or webserver required.

## Fitur Utama

- **/finance**: Catat pemasukan/pengeluaran dan cek saldo.
- **/todo**: Manajemen todo sederhana (tambah, list, edit, hapus, check/uncheck).
- **/task**: Tasker satu kali (sekali kirim, tidak berulang) dengan pengingat otomatis ke WhatsApp.

## Cara Menjalankan

1. **Install dependencies**
   ```powershell
   npm install
   ```
2. **Jalankan bot**
   ```powershell
   node index.js
   ```
3. **Scan QR code** di terminal untuk login WhatsApp.

## Perintah WhatsApp

### Finance

- `/finance tambah pemasukan <jumlah> <deskripsi>`
- `/finance tambah pengeluaran <jumlah> <deskripsi>`
- `/finance saldo`
- `/finance help`

### Todo

- `/todo tambah <judul> | <kategori>`
- `/todo list`
- `/todo edit <id> <judul baru>`
- `/todo check <id>`
- `/todo uncheck <id>`
- `/todo hapus <id>`
- `/todo help`

### Tasker (Task Sekali Kirim)

- `/task add <YYYY-MM-DD> <HH:MM> <title> | <description>`
- `/task list`
- `/task done <id>`
- `/task delete <id>`
- `/task edit <id> <title> | <description>`
- `/task help`

## Struktur Data

- Semua data disimpan di folder `data/` dalam format JSON.
- Tidak perlu database.

## Testing

- Jalankan unit test dengan:
  ```powershell
  npm test
  ```

## Catatan

- Tasker hanya mengirim task satu kali pada waktu yang ditentukan.
- Semua perintah dapat dikirim dari chat WhatsApp ke bot.

---

MIT License
