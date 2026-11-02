export default function TaskFilters({ filters, categories, onChange }) {
  const update = (field) => (event) => {
    onChange({ ...filters, [field]: event.target.value });
  };

  const clearAll = () => {
    onChange({ q: "", completed: "", priority: "", categoryId: "" });
  };

  return (
    <section aria-label="Фильтры">
      <h2>Фильтры</h2>

      <div>
        <label htmlFor="filter-q">Поиск</label>
        <input
          id="filter-q"
          type="search"
          value={filters.q}
          maxLength={100}
          onChange={update("q")}
        />
      </div>

      <div>
        <label htmlFor="filter-completed">Статус</label>
        <select
          id="filter-completed"
          value={filters.completed}
          onChange={update("completed")}
        >
          <option value="">Все</option>
          <option value="false">В работе</option>
          <option value="true">Выполненные</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-priority">Приоритет</label>
        <select
          id="filter-priority"
          value={filters.priority}
          onChange={update("priority")}
        >
          <option value="">Все</option>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-category">Категория</label>
        <select
          id="filter-category"
          value={filters.categoryId}
          onChange={update("categoryId")}
        >
          <option value="">Все</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="actions">
        <button type="button" onClick={clearAll}>
          Сбросить фильтры
        </button>
      </div>
    </section>
  );
}
