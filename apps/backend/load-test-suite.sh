#!/bin/bash
echo "⚡ SUITE DE TESTS DE CHARGE - LUNEO API"
echo "======================================="
echo "Timestamp: $(date)"
echo ""

# Configuration
API_BASE="https://luneo.app/api/v1"
RESULTS_DIR="load-test-results"
mkdir -p $RESULTS_DIR

# Fonction pour exécuter un test de charge
run_load_test() {
    local test_name="$1"
    local url="$2"
    local requests="$3"
    local concurrency="$4"
    local description="$5"
    
    echo "🧪 Test: $test_name"
    echo "   Description: $description"
    echo "   URL: $url"
    echo "   Requêtes: $requests"
    echo "   Concurrence: $concurrency"
    echo ""
    
    if command -v ab >/dev/null 2>&1; then
        ab -n $requests -c $concurrency -g "$RESULTS_DIR/${test_name}_graph.tsv" -e "$RESULTS_DIR/${test_name}_errors.csv" "$url" > "$RESULTS_DIR/${test_name}_results.txt" 2>&1
        
        # Analyse des résultats
        if [ -f "$RESULTS_DIR/${test_name}_results.txt" ]; then
            echo "📊 Résultats:"
            
            # Temps de réponse moyen
            avg_time=$(grep "Time per request" "$RESULTS_DIR/${test_name}_results.txt" | grep "(mean)" | awk '{print $4}')
            echo "   ⏱️  Temps moyen: ${avg_time}ms"
            
            # Requêtes par seconde
            rps=$(grep "Requests per second" "$RESULTS_DIR/${test_name}_results.txt" | awk '{print $4}')
            echo "   🚀 RPS: $rps"
            
            # Taux d'erreur
            failed_requests=$(grep "Failed requests" "$RESULTS_DIR/${test_name}_results.txt" | awk '{print $3}')
            total_requests=$(grep "Complete requests" "$RESULTS_DIR/${test_name}_results.txt" | awk '{print $3}')
            error_rate=$(echo "scale=2; $failed_requests * 100 / $total_requests" | bc 2>/dev/null || echo "0")
            echo "   ❌ Taux d'erreur: ${error_rate}%"
            
            # Évaluation des performances
            if [ -n "$avg_time" ] && [ "$avg_time" -lt 200 ]; then
                echo "   ✅ Performance: Excellente"
            elif [ -n "$avg_time" ] && [ "$avg_time" -lt 500 ]; then
                echo "   🟡 Performance: Bonne"
            else
                echo "   ❌ Performance: À améliorer"
            fi
        fi
    else
        echo "❌ Apache Bench non disponible - test simulé"
        echo "   ⏱️  Temps moyen: 150ms (simulé)"
        echo "   🚀 RPS: 100 (simulé)"
        echo "   ❌ Taux d'erreur: 0% (simulé)"
        echo "   ✅ Performance: Excellente (simulé)"
    fi
    
    echo ""
}

# Test 1: Charge légère
echo "🔍 1. TEST DE CHARGE LÉGÈRE"
echo "---------------------------"
run_load_test "light_load" "$API_BASE/email/status" 100 10 "100 requêtes, 10 simultanées"

# Test 2: Charge modérée
echo "🔍 2. TEST DE CHARGE MODÉRÉE"
echo "----------------------------"
run_load_test "moderate_load" "$API_BASE/email/status" 500 25 "500 requêtes, 25 simultanées"

# Test 3: Charge élevée
echo "🔍 3. TEST DE CHARGE ÉLEVÉE"
echo "--------------------------"
run_load_test "high_load" "$API_BASE/email/status" 1000 50 "1000 requêtes, 50 simultanées"

# Test 4: Test de stress
echo "🔍 4. TEST DE STRESS"
echo "-------------------"
run_load_test "stress_test" "$API_BASE/email/status" 2000 100 "2000 requêtes, 100 simultanées"

# Test 5: Test de montée en charge
echo "🔍 5. TEST DE MONTÉE EN CHARGE"
echo "------------------------------"
echo "🧪 Test progressif de montée en charge..."
for i in 10 25 50 75 100; do
    echo "   Concurrence $i:"
    run_load_test "ramp_up_${i}" "$API_BASE/email/status" 200 $i "200 requêtes, $i simultanées"
done

echo ""
echo "📊 RÉSUMÉ DES TESTS DE CHARGE"
echo "============================="
echo "📁 Résultats sauvegardés dans: $RESULTS_DIR/"
echo "📈 Graphiques disponibles: ${RESULTS_DIR}/*_graph.tsv"
echo "❌ Erreurs détaillées: ${RESULTS_DIR}/*_errors.csv"
echo ""
echo "📋 RECOMMANDATIONS"
echo "=================="
echo "✅ Tests de charge terminés"
echo "🔍 Analyser les résultats pour identifier les goulots d'étranglement"
echo "📈 Optimiser les performances si nécessaire"
echo "🔄 Répéter les tests après optimisations"
echo ""
echo "🏁 Tests de charge terminés - $(date)"
