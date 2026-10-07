import Link from "next/link";
import { ArrowLeft, Camera, ClipboardClock, MapPin, ShieldCheck, TriangleAlert } from "lucide-react";
import HazardForm from "@/components/hazard/HazardForm";
import styles from "./ReportHazardPage.module.css";

export default function Page() {
  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/citizen/alerts" className={styles.backButton}>
            <ArrowLeft aria-hidden="true" />
            <span>Alerts</span>
          </Link>
          <Link href="/citizen/alerts" className={styles.brand} aria-label="ResQLink citizen portal">
            <span className={styles.brandMark}><ShieldCheck aria-hidden="true" /></span>
            <span>ResQLink<small>Citizen portal</small></span>
          </Link>
          <Link href="/citizen/hazard-reports" className={styles.historyLink}>
            <ClipboardClock aria-hidden="true" />
            <span>My reports</span>
          </Link>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.pageIntro}>
          <p className={styles.eyebrow}><span aria-hidden="true" /> Citizen safety report</p>
          <h1>Report a hazard</h1>
          <p className={styles.introduction}>
            Share what you have observed. Your report will be reviewed by the Disaster Management Centre.
          </p>
        </div>

        <div className={styles.reportLayout}>
          <div className={styles.formPanel}>
            <HazardForm />
          </div>

          <aside className={styles.safetyPanel} aria-label="Reporting guidance">
            <div className={styles.safetyHeading}>
              <span><ShieldCheck aria-hidden="true" /></span>
              <div>
                <p>Safety comes first</p>
                <h2>Report from a safe place</h2>
              </div>
            </div>
            <p className={styles.safetyIntro}>
              Never approach a hazard or delay getting to safety to complete this report.
            </p>
            <ul className={styles.guidanceList}>
              <li>
                <MapPin aria-hidden="true" />
                <span><strong>Pinpoint the area</strong>Use GPS or describe a nearby landmark.</span>
              </li>
              <li>
                <TriangleAlert aria-hidden="true" />
                <span><strong>Describe what you see</strong>Include changes, access issues, or people at risk.</span>
              </li>
              <li>
                <Camera aria-hidden="true" />
                <span><strong>Photo evidence is optional</strong>Only attach one if it is safe to do so.</span>
              </li>
            </ul>
            <div className={styles.reviewNote}>
              <span className={styles.reviewDot} aria-hidden="true" />
              <p><strong>What happens next</strong>A DMC officer reviews the details and may contact you for more information.</p>
            </div>
          </aside>
        </div>
      </main>
    </section>
  );
}
