import { APP_VERSION } from '../config/appVersion'

const links = [
  { href: '/terms.html', label: '利用規約' },
  { href: '/privacy.html', label: 'プライバシーポリシー' },
  { href: '/contact.html', label: 'お問い合わせ' },
]

export default function AppFooter() {
  return (
    <footer className="service-footer" aria-label="サービス情報">
      <nav aria-label="サービス情報リンク">
        {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
      </nav>
      <p>DROPTRIP {APP_VERSION}</p>
    </footer>
  )
}
