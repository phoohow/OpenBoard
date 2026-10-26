/** 投票面板：开关投票与票数排行。 */

export const VotePanel = (props: {
  active: boolean
  results: { id: string; name: string; votes: number }[]
  onToggle: () => void
  onReset: () => void
}) => (
  <section>
    <h4>便签投票</h4>
    <button type="button" className={props.active ? 'chip wide active' : 'chip wide'} onClick={props.onToggle}>
      {props.active ? '投票进行中：点击便签即投票' : '开启投票'}
    </button>
    {props.active && (
      <span className="preset-note">投票中：每次点击便签或卡片加一票，画布上角标显示实时票数。</span>
    )}
    {!!props.results.length && (
      <ul className="vote-list">
        {props.results.map((r, i) => (
          <li key={r.id}>
            <span className="vote-rank">{i + 1}</span>
            <span className="vote-name">{r.name}</span>
            <span className="vote-count">{r.votes} 票</span>
          </li>
        ))}
      </ul>
    )}
    {!!props.results.length && (
      <button type="button" className="chip wide" onClick={props.onReset}>
        清零票数
      </button>
    )}
  </section>
)
