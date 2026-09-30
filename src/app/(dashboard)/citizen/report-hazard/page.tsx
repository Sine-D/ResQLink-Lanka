import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HazardForm from "@/components/hazard/HazardForm";
import styles from "./ReportHazardPage.module.css";

export default function Page() {
  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <Link
          href="/citizen/alerts"
          className={styles.backButton}
          aria-label="Back to citizen alerts"
        >
          <ArrowLeft aria-hidden="true" />
        </Link>
        <h1>Report Hazard</h1>
        <span className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <main className={styles.content}>
        <p className={styles.introduction}>
          Submit hazard intelligence directly to emergency management dispatch.
          Provide accurate visual data and description.
        </p>
        <HazardForm />
      </main>
    </section>
  );
}
