const messages = {
  ai: 'AI生成内容には誤りが含まれる可能性があります。営業時間、料金、予約、交通情報は公式情報を確認してください。',
  route: '移動時間は目安です。天候や混雑、運行状況により変動するため、出発前に公式情報を確認してください。',
}

export default function ServiceNotice({ kind }) {
  const message = messages[kind]
  if (!message) return null

  return (
    <aside className={`service-notice service-notice-${kind}`} aria-label="ご利用上の注意">
      <p>{message} <a href="/terms.html">詳しくは利用規約へ</a></p>
    </aside>
  )
}
