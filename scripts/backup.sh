#!/bin/bash
# MongoDB Backup Script

# Set variables
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%F_%T")
BACKUP_NAME="laps_backup_$TIMESTAMP"
MONGO_URI=${MONGODB_URI:-"mongodb://localhost:27017/laps"}
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Execute mongodump
echo "Starting backup: $BACKUP_NAME"
mongodump --uri="$MONGO_URI" --archive="$BACKUP_DIR/$BACKUP_NAME.gz" --gzip

if [ $? -eq 0 ]; then
  echo "Backup successfully created at $BACKUP_DIR/$BACKUP_NAME.gz"
else
  echo "Backup failed!"
  exit 1
fi

# Cleanup old backups
echo "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -exec rm {} \;

echo "Backup process completed."
