#!/bin/bash
LOG_FILE="logs/health-checks.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Début des health checks automatiques" >> $LOG_FILE

# Exécution des health checks
./advanced-health-checks.sh >> $LOG_FILE 2>&1
./service-health-checks.sh >> $LOG_FILE 2>&1

# Vérification du score de santé
SCORE=$(./advanced-health-checks.sh 2>/dev/null | grep "Score total:" | awk '{print $4}' | cut -d'/' -f1)

if [ "$SCORE" -lt 70 ]; then
    echo "[$TIMESTAMP] ALERTE: Score de santé critique ($SCORE/100)" >> $LOG_FILE
    # Ici on pourrait ajouter une notification (email, Slack, etc.)
fi

echo "[$TIMESTAMP] Health checks automatiques terminés" >> $LOG_FILE
