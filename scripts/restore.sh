#!/bin/bash
# MongoDB Restore Script

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <path_to_backup.gz>"
  exit 1
fi

BACKUP_FILE=$1
MONGO_URI=${MONGODB_URI:-"mongodb://localhost:27017/laps"}

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File $BACKUP_FILE not found!"
  exit 1
fi

echo "Starting restore from: $BACKUP_FILE"
mongorestore --uri="$MONGO_URI" --archive="$BACKUP_FILE" --gzip --drop

if [ $? -eq 0 ]; then
  echo "Restore successfully completed."
else
  echo "Restore failed!"
  exit 1
fi
