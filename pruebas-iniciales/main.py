from graph_client import GraphClient
from analyzer import EmailAnalyzer
from config import EMAIL_COUNT

def main():
    print("="*60)
    print("PRUEBA 0 - ANÁLISIS DE VOLUMEN DE CORREOS")
    print("="*60)

    client = GraphClient()

    print("\n[1/3] Autenticando...")
    client.authenticate()

    print(f"\n[2/3] Leyendo {EMAIL_COUNT} correos...")
    emails = client.get_emails(count=EMAIL_COUNT)
    print(f"✓ {len(emails)} correos leídos")

    print("\n[3/3] Analizando métricas...")
    analyzer = EmailAnalyzer(emails)
    metrics = analyzer.analyze()

    print("\n" + "="*60)
    print("RESULTADOS")
    print("="*60)
    print(f"Total de correos analizados: {metrics['total_emails']}")
    print(f"\nAsunto:")
    print(f"  Promedio: {metrics['subject']['avg_length']} caracteres")
    print(f"  Rango: {metrics['subject']['min_length']} - {metrics['subject']['max_length']} caracteres")
    print(f"\nCuerpo:")
    print(f"  Promedio: {metrics['body']['avg_length']} caracteres")
    print(f"  Rango: {metrics['body']['min_length']} - {metrics['body']['max_length']} caracteres")
    print(f"\nTotal por correo:")
    print(f"  Promedio: {metrics['total']['avg_chars_per_email']} caracteres")
    print(f"  Rango: {metrics['total']['min_chars']} - {metrics['total']['max_chars']} caracteres")
    print(f"  Total caracteres: {metrics['total']['total_chars']:,}")
    print(f"  Tokens estimados: {metrics['total']['estimated_tokens']:,.2f}")

    print(f"\nDistribución de tamaños:")
    for bucket, count in metrics['distribution'].items():
        pct = (count / metrics['total_emails']) * 100
        print(f"  {bucket}: {count} correos ({pct:.1f}%)")

    if "error" not in metrics['daily_volume']:
        print(f"\nVolumen estimado:")
        print(f"  Rango de fechas: {metrics['daily_volume']['date_range']['from'][:10]} a {metrics['daily_volume']['date_range']['to'][:10]}")
        print(f"  Diario: {metrics['daily_volume']['estimated_daily_volume']} correos/día")
        print(f"  Mensual: {metrics['daily_volume']['estimated_monthly_volume']} correos/mes")

    json_path, csv_path = analyzer.save_report(metrics)
    print(f"\n✓ Reporte guardado:")
    print(f"  Métricas: {json_path}")
    print(f"  Datos: {csv_path}")
    print("="*60)

if __name__ == "__main__":
    main()
