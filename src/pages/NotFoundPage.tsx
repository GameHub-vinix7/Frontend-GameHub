import { Link } from 'react-router'
import styles from './NotFoundPage.module.css'

function NotFoundPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <p className={styles.code} aria-hidden="true">404</p>
        <h1>Halaman tidak ditemukan</h1>
        <p>Alamat yang kamu buka tidak tersedia. Periksa kembali tautannya atau kembali ke beranda.</p>
        <Link className={styles.backLink} to="/">← Kembali ke Beranda</Link>
      </div>
    </main>
  )
}

export default NotFoundPage
