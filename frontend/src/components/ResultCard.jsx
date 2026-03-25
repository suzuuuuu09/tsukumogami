import { yokaiImageMap } from '../constants/yokai'
import { formatDisplayDate } from '../utils/date'

const yokaiAppearanceEffectSrc = `/animation.mp4`

function ResultCard({ result, resultYokai }) {
  if (!result) {
    return null
  }

  return (
    <div className="result">
      <div className="smoke">妖怪と賞味期限を見抜きました</div>
      <div className="yokai-appear">
        <video
          className="yokai-appear-bg"
          src={yokaiAppearanceEffectSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="yokai-appear-content">
          <img src={`/${yokaiImageMap[resultYokai]}`} alt={resultYokai} className="yokai-display" />
          <p className="yokai-text">{resultYokai}が出現した！</p>
        </div>
      </div>
      <h2>妖怪診断結果</h2>
      <p className="product">
        ・妖怪候補
        <br />
        <small>{result.product_name}</small>
      </p>
      <p className="category">
        ・カテゴリ
        <br />
        <small>{result.category}</small>
      </p>
      <p className="expiry">
        ・賞味期限
        <br />
        <small>{formatDisplayDate(result.suggested_expiration)}</small>
      </p>
      <p className="reason">
        ・理由
        <br />
        <small>{result.reason}</small>
      </p>
      {result.product_image && <img className="item-image" src={result.product_image} alt="商品画像" />}
    </div>
  )
}

export default ResultCard
