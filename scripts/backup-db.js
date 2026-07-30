const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BACKUP_DIR = path.join(__dirname, "../backups");
const RETENTION_DAYS = 30;

// Assicurati che la cartella backups esista
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Genera nome file
const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
const backupFileName = `backup_${dateStr}.sql`;
const backupFilePath = path.join(BACKUP_DIR, backupFileName);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("ERRORE: DATABASE_URL non trovato in .env");
  process.exit(1);
}

console.log(`[${new Date().toISOString()}] Avvio backup del database...`);

// Esegui pg_dump
// Nota: su Windows richiede che la cartella bin di PostgreSQL sia nelle variabili d'ambiente PATH
const dumpCmd = `pg_dump "${databaseUrl}" -f "${backupFilePath}"`;

exec(dumpCmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`ERRORE durante il backup: ${error.message}`);
    return;
  }
  if (stderr) {
    // pg_dump spesso scrive log in stderr anche quando non è un errore bloccante, ma lo stampiamo
    console.log(`Log pg_dump: ${stderr}`);
  }
  
  console.log(`[${new Date().toISOString()}] Backup salvato con successo: ${backupFileName}`);

  // Pulizia vecchi backup (Retention)
  cleanOldBackups();
});

function cleanOldBackups() {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      console.error(`Errore nella lettura della cartella di backup: ${err.message}`);
      return;
    }

    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;

        const isOlderThanRetention = (now - stats.mtime.getTime()) > retentionMs;
        if (isOlderThanRetention && file.endsWith(".sql")) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Errore durante l'eliminazione del vecchio backup ${file}:`, err);
            } else {
              console.log(`Vecchio backup rimosso per retention (${RETENTION_DAYS} giorni): ${file}`);
            }
          });
        }
      });
    });
  });
}
