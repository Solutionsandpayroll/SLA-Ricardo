import csv
import os
import json
from datetime import datetime
from config import OUTPUT_DIR

class EmailAnalyzer:
    def __init__(self, emails):
        self.emails = emails

    def analyze(self):
        if not self.emails:
            return {"error": "No hay correos para analizar"}

        subjects = [e["subject"] for e in self.emails]
        bodies = [e["body"] for e in self.emails]

        subject_lengths = [len(s) for s in subjects]
        body_lengths = [len(b) for b in bodies]
        total_lengths = [len(s) + len(b) for s, b in zip(subjects, bodies)]

        total_chars = sum(total_lengths)
        avg_chars = total_chars / len(self.emails)
        estimated_tokens = total_chars / 4

        date_analysis = self._analyze_dates()

        metrics = {
            "total_emails": len(self.emails),
            "subject": {
                "avg_length": round(sum(subject_lengths) / len(subject_lengths), 2),
                "min_length": min(subject_lengths),
                "max_length": max(subject_lengths)
            },
            "body": {
                "avg_length": round(sum(body_lengths) / len(body_lengths), 2),
                "min_length": min(body_lengths),
                "max_length": max(body_lengths)
            },
            "total": {
                "avg_chars_per_email": round(avg_chars, 2),
                "min_chars": min(total_lengths),
                "max_chars": max(total_lengths),
                "total_chars": total_chars,
                "estimated_tokens": round(estimated_tokens, 2)
            },
            "distribution": self._get_distribution(total_lengths),
            "daily_volume": date_analysis
        }

        return metrics

    def _analyze_dates(self):
        dates = []
        for e in self.emails:
            if e["date"]:
                try:
                    dt = datetime.fromisoformat(e["date"].replace("Z", "+00:00"))
                    dates.append(dt)
                except:
                    pass

        if not dates:
            return {"error": "No se pudieron analizar las fechas"}

        dates.sort()
        days_span = (dates[-1] - dates[0]).days or 1
        emails_per_day = len(dates) / days_span

        return {
            "date_range": {
                "from": dates[0].isoformat(),
                "to": dates[-1].isoformat(),
                "days_span": days_span
            },
            "estimated_daily_volume": round(emails_per_day, 2),
            "estimated_monthly_volume": round(emails_per_day * 30, 2)
        }

    def _get_distribution(self, lengths):
        buckets = {
            "0-500 chars": 0,
            "501-2000 chars": 0,
            "2001-5000 chars": 0,
            "5001-10000 chars": 0,
            "10000+ chars": 0
        }

        for l in lengths:
            if l <= 500:
                buckets["0-500 chars"] += 1
            elif l <= 2000:
                buckets["501-2000 chars"] += 1
            elif l <= 5000:
                buckets["2001-5000 chars"] += 1
            elif l <= 10000:
                buckets["5001-10000 chars"] += 1
            else:
                buckets["10000+ chars"] += 1

        return buckets

    def save_report(self, metrics):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_path = os.path.join(OUTPUT_DIR, f"reporte_{timestamp}.json")
        csv_path = os.path.join(OUTPUT_DIR, f"correos_{timestamp}.csv")

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2, ensure_ascii=False)

        with open(csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["subject", "body", "from", "date", "body_type"])
            writer.writeheader()
            writer.writerows(self.emails)

        return json_path, csv_path
