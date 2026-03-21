import { yokaiImageMap } from '../constants/yokai'
import { formatDisplayDate } from '../utils/date'

function ResultCard({ result, resultYokai }) {
  if (!result) {
    return null
  }

  return (
    <div className="result">
      <div className="smoke">物品情報と交換期限を記録しました</div>
      <div className="yokai-appear">
        <img src={`/${yokaiImageMap[resultYokai]}`} alt={resultYokai} className="yokai-display" />
        <p className="yokai-text">{resultYokai}が出現した！</p>
      </div>
      <h2>物品情報</h2>
      <p className="product"> ・物品名<br/> <small>{result.product_name}</small></p>
      <p className="category"> ・種別 <br/><small>{result.category}</small></p>
      <p className="expiry"> ・交換期限 <br/><small>{formatDisplayDate(result.suggested_expiration)}</small></p>
      <p className="reason"> ・理由 <br/><small>{result.reason}</small></p>
      {result.product_image && <img className="item-image" src={result.product_image} alt="商品" />}
    </div>
  )
}

export default ResultCard
