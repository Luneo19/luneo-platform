#!/bin/bash
echo "⚡ TEST DE PERFORMANCE SIMPLE - LUNEO API"
echo "========================================="

API_URL="https://luneo.app/api/v1/email/status"
TEST_REQUESTS=50

echo "🎯 Test de performance avec $TEST_REQUESTS requêtes..."
echo ""

# Test de performance simple
total_time=0
successful_requests=0
failed_requests=0
response_times=()

for i in $(seq 1 $TEST_REQUESTS); do
    start_time=$(date +%s%N)
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null)
    
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$response_code" = "401" ] || [ "$response_code" = "200" ]; then
        successful_requests=$((successful_requests + 1))
        response_times+=($response_time)
    else
        failed_requests=$((failed_requests + 1))
    fi
    
    total_time=$((total_time + response_time))
    
    # Afficher le progrès
    if [ $((i % 10)) -eq 0 ]; then
        echo "   Progression: $i/$TEST_REQUESTS requêtes..."
    fi
done

# Calcul des statistiques
avg_response_time=$((total_time / TEST_REQUESTS))
success_rate=$((successful_requests * 100 / TEST_REQUESTS))

# Calcul du temps de réponse médian
sorted_times=($(printf '%s\n' "${response_times[@]}" | sort -n))
median_index=$((successful_requests / 2))
median_response_time=${sorted_times[$median_index]}

# Calcul du 95ème percentile
p95_index=$((successful_requests * 95 / 100))
p95_response_time=${sorted_times[$p95_index]}

echo ""
echo "📊 RÉSULTATS DU TEST DE PERFORMANCE"
echo "==================================="
echo "🎯 Requêtes totales: $TEST_REQUESTS"
echo "✅ Requêtes réussies: $successful_requests"
echo "❌ Requêtes échouées: $failed_requests"
echo "📈 Taux de succès: $success_rate%"
echo ""
echo "⏱️  Temps de réponse moyen: ${avg_response_time}ms"
echo "📊 Temps de réponse médian: ${median_response_time}ms"
echo "📈 95ème percentile: ${p95_response_time}ms"
echo ""

# Évaluation des performances
echo "🎯 ÉVALUATION DES PERFORMANCES"
echo "=============================="
if [ $avg_response_time -lt 100 ]; then
    echo "🟢 Performance: EXCELLENTE (< 100ms)"
elif [ $avg_response_time -lt 200 ]; then
    echo "🟡 Performance: BONNE (100-200ms)"
elif [ $avg_response_time -lt 500 ]; then
    echo "🟠 Performance: ACCEPTABLE (200-500ms)"
else
    echo "🔴 Performance: LENTE (> 500ms)"
fi

if [ $success_rate -ge 95 ]; then
    echo "✅ Fiabilité: EXCELLENTE ($success_rate%)"
elif [ $success_rate -ge 90 ]; then
    echo "🟡 Fiabilité: BONNE ($success_rate%)"
else
    echo "❌ Fiabilité: PROBLÉMATIQUE ($success_rate%)"
fi

echo ""
echo "🏁 Test de performance terminé - $(date)"
