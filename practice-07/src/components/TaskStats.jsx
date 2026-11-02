export default function TaskStats({ stats }) {
  return (
    <section aria-label="Статистика">
      <h2>Статистика</h2>
      <p>
        Всего: <strong>{stats.total}</strong>
      </p>
      <p>
        Выполнено: <strong>{stats.completed}</strong>
      </p>
      <p>
        В работе: <strong>{stats.active}</strong>
      </p>
    </section>
  );
}
