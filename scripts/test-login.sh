#!/bin/bash
# ============================================
# DIAGNÓSTICO DE LOGIN - NEXSTORE
# ============================================
# Este script prueba el login directamente sin frontend
# para determinar si el error está en frontend o backend

echo "============================================"
echo "DIAGNÓSTICO DE LOGIN - NEXSTORE"
echo "============================================"
echo ""

# Configuración
BACKEND_URL="${BACKEND_URL:-http://localhost:5007}"
EMAIL="${1:-admin@nexstore.local}"
PASSWORD="${2:-admin123}"

echo "Backend URL: $BACKEND_URL"
echo "Email: $EMAIL"
echo ""

# Prueba 1: Verificar que el backend responde
echo "============================================"
echo "PRUEBA 1: Health check del backend"
echo "============================================"
curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" 2>/dev/null || echo "No health endpoint"
echo ""

# Prueba 2: Intentar login directo
echo ""
echo "============================================"
echo "PRUEBA 2: Login directo al backend"
echo "============================================"
echo "Request:"
echo "  URL: $BACKEND_URL/api/auth/login"
echo "  Method: POST"
echo "  Body: {\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}"
echo ""
echo "Response:"

curl -v -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  2>&1 | tee /tmp/login_response.log

echo ""
echo "============================================"
echo "ANÁLISIS DE RESPUESTA"
echo "============================================"

# Verificar si hay error de conexión
if grep -q "Connection refused" /tmp/login_response.log; then
    echo "❌ ERROR: El backend no está corriendo en $BACKEND_URL"
    echo "   Verifica que el servicio backend esté iniciado"
fi

if grep -q "Could not resolve host" /tmp/login_response.log; then
    echo "❌ ERROR: No se puede resolver el hostname"
fi

# Verificar código de respuesta HTTP
HTTP_CODE=$(grep "< HTTP" /tmp/login_response.log | head -1 | awk '{print $3}')
if [ -n "$HTTP_CODE" ]; then
    echo "Código HTTP: $HTTP_CODE"
    if [ "$HTTP_CODE" = "500" ]; then
        echo "❌ ERROR 500: Error interno del servidor"
        echo "   Revisa los logs del backend para ver el stack trace"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "⚠️  401 Unauthorized: Credenciales inválidas"
    elif [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Login exitoso"
    fi
fi

echo ""
echo "============================================"
echo "LOGS COMPLETOS GUARDADOS EN: /tmp/login_response.log"
echo "============================================"
