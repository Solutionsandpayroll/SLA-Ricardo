from graph_client import GraphClient
from gemini_client import GeminiClient
from config import EMAIL_COUNT
import csv
import os
from datetime import datetime

def main():
    print("="*60)
    print("PRUEBA 1 - CLASIFICACIÓN BINARIA")
    print("="*60)

    client = GraphClient()
    
    print("\n[1/4] Autenticando...")
    client.authenticate()

    print(f"\n[2/4] Leyendo {EMAIL_COUNT} correos...")
    emails = client.get_emails(count=EMAIL_COUNT)
    print(f"✓ {len(emails)} correos leídos")

    gemini = GeminiClient()
    results = []

    print(f"\n[3/4] Clasificando con Gemini...")
    for i, email in enumerate(emails, 1):
        if i % 10 == 0:
            print(f"  Procesando {i}/{len(emails)}...")
        
        result = gemini.classify_email(
            subject=email["subject"],
            body=email["body"],
            sender=email["from"]
        )
        
        results.append({
            "subject": email["subject"],
            "from": email["from"],
            "date": email["date"],
            "classification": result["classification"],
            "raw_response": result["raw_response"],
            "tokens_input": result["tokens_input"],
            "tokens_output": result["tokens_output"],
            "latency_ms": result["latency_ms"]
        })

    print(f"\n[4/4] Generando reporte...")
    
    # Estadísticas
    solicitudes = sum(1 for r in results if r["classification"] == "SOLICITUD")
    no_solicitudes = len(results) - solicitudes
    avg_latency = sum(r["latency_ms"] for r in results) / len(results)
    cost = gemini.get_cost_estimate()

    print("\n" + "="*60)
    print("RESULTADOS")
    print("="*60)
    print(f"Total correos clasificados: {len(results)}")
    print(f"\nClasificación:")
    print(f"  Solicitudes: {solicitudes} ({(solicitudes/len(results))*100:.1f}%)")
    print(f"  No solicitudes: {no_solicitudes} ({(no_solicitudes/len(results))*100:.1f}%)")
    print(f"\nRendimiento:")
    print(f"  Latencia promedio: {avg_latency:.2f} ms")
    print(f"\nTokens usados:")
    print(f"  Input: {cost['input_tokens']:,}")
    print(f"  Output: {cost['output_tokens']:,}")
    print(f"\nCosto real:")
    print(f"  Input: ${cost['input_cost_usd']:.6f}")
    print(f"  Output: ${cost['output_cost_usd']:.6f}")
    print(f"  Total: ${cost['total_cost_usd']:.6f}")
    print(f"  Costo por correo: ${cost['total_cost_usd']/len(results):.6f}")

    # Guardar resultados
    os.makedirs("output", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_path = f"output/clasificacion_{timestamp}.csv"
    
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

    print(f"\n✓ Resultados guardados en: {csv_path}")
    print("="*60)

if __name__ == "__main__":
    main()
