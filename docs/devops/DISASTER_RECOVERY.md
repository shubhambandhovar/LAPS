# Disaster Recovery Plan

This document outlines the procedures to recover the Little Angels School ERP from a critical failure, such as data corruption or server hardware failure.

## 1. Routine Backups
The database is backed up daily via the `scripts/backup.sh` script, which compresses the data into `.gz` archives stored in `/var/backups/mongodb`. These backups must be regularly synced to an offsite secure storage bucket.

## 2. Recovery Procedure

### Scenario A: Accidental Data Deletion / Corruption
If the server is still operational but data is corrupted, you can restore from the latest local backup archive.
1. Identify the latest healthy backup in `/var/backups/mongodb/`.
2. Run the restore script:
   ```bash
   cd /path/to/LAPS/scripts
   ./restore.sh /var/backups/mongodb/laps_backup_YYYY-MM-DD_HH:MM:SS.gz
   ```
3. The script will drop the existing corrupted collections and restore the clean data.

### Scenario B: Complete Server Failure
If the VPS or host machine is completely destroyed:
1. **Provision a new server**: Create a new Ubuntu instance and secure it.
2. **Clone the Repository**:
   ```bash
   git clone https://github.com/shubhambandhovar/LAPS.git
   ```
3. **Restore Environment Variables**: Securely retrieve and populate the `.env` file on the new server. It is critical that the exact same `JWT_SECRET` and `ENCRYPTION_KEY` are used to maintain session and data integrity.
4. **Boot Containers**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
5. **Download Offsite Backup**: Retrieve the latest `.gz` archive from AWS S3 or your secure offsite storage.
6. **Restore Data**:
   Transfer the archive to the new server and execute `scripts/restore.sh` pointing to the downloaded file.
7. **Update DNS**: Point the domain's A-record to the new server's IP address. Wait for propagation.

## 3. Post-Recovery Verification
- Login to the Admin Dashboard to verify credential integrity.
- Check the `ReportExecutionLog` to ensure background workers resume processing.
- Verify Nginx SSL certificates are correctly terminating traffic.
