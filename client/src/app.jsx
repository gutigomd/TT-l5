import React from "react";
import { request } from "./api.js";

function calcCalendarDays(startStr, endStr) {
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  return Math.round((end - start) / 86400000) + 1;
}

class LeaveRequestItem extends React.Component {
  render() {
    const { item, onRemove, disabled } = this.props;
    const days = calcCalendarDays(item.startDate, item.endDate);
    return (
      <tr>
        <td><strong>{item.requestCode}</strong></td>
        <td>{item.employeeName}</td>
        <td>{item.department}</td>
        <td>{item.startDate}</td>
        <td>{item.endDate}</td>
        <td>{days}</td>
        <td><span className={`badge badge-${item.leaveType}`}>{item.leaveType}</span></td>
        <td>
          <button type="button" className="danger" disabled={disabled} onClick={() => onRemove(item)}>
            Видалити
          </button>
        </td>
      </tr>
    );
  }
}

class LeaveRequestForm extends React.Component {
  state = { requestCode: "", employeeName: "", department: "", startDate: "", endDate: "", leaveType: "щорічна", error: "" };

  onSubmit = async (event) => {
    event.preventDefault();
    if (this.props.disabled) return;
    const requestCode = this.state.requestCode.trim();
    const employeeName = this.state.employeeName.trim();
    const department = this.state.department.trim();
    const { startDate, endDate, leaveType } = this.state;

    if (requestCode.length < 2 || requestCode.length > 30) {
      this.setState({ error: "Код заявки повинен містити від 2 до 30 символів." }); return;
    }
    if (employeeName.length < 2 || employeeName.length > 100) {
      this.setState({ error: "ПІБ працівника повинно містити від 2 до 100 символів." }); return;
    }
    if (department.length < 2 || department.length > 100) {
      this.setState({ error: "Назва підрозділу повинна містити від 2 до 100 символів." }); return;
    }
    if (!startDate || !endDate) {
      this.setState({ error: "Вкажіть початкову та кінцеву дати відпустки." }); return;
    }
    if (endDate < startDate) {
      this.setState({ error: "Кінцева дата не може бути раніше початкової." }); return;
    }
    const days = calcCalendarDays(startDate, endDate);
    if (leaveType === "навчальна" && (days < 1 || days > 60)) {
      this.setState({ error: `Тривалість навчальної відпустки: від 1 до 60 днів (вказано: ${days}).` }); return;
    }

    this.setState({ error: "" });
    const saved = await this.props.onRequestSubmit({ requestCode, employeeName, department, startDate, endDate, leaveType });
    if (saved) {
      this.setState({ requestCode: "", employeeName: "", department: "", startDate: "", endDate: "", leaveType: "щорічна", error: "" });
    }
  };

  render() {
    return (
      <form onSubmit={this.onSubmit} noValidate>
        <fieldset disabled={this.props.disabled}>
          <legend>Нова заявка на відпустку</legend>
          <div className="field"><label htmlFor="requestCode">Код заявки</label><input id="requestCode" type="text" placeholder="Напр. LR-1009" value={this.state.requestCode} onChange={(e) => this.setState({ requestCode: e.target.value })} /></div>
          <div className="field"><label htmlFor="employeeName">ПІБ працівника</label><input id="employeeName" type="text" placeholder="Вигадане ПІБ" value={this.state.employeeName} onChange={(e) => this.setState({ employeeName: e.target.value })} /></div>
          <div className="field"><label htmlFor="department">Підрозділ</label><input id="department" type="text" placeholder="Напр. Відділ розробки" value={this.state.department} onChange={(e) => this.setState({ department: e.target.value })} /></div>
          <div className="field"><label htmlFor="startDate">Початкова дата</label><input id="startDate" type="date" value={this.state.startDate} onChange={(e) => this.setState({ startDate: e.target.value })} /></div>
          <div className="field"><label htmlFor="endDate">Кінцева дата</label><input id="endDate" type="date" value={this.state.endDate} onChange={(e) => this.setState({ endDate: e.target.value })} /></div>
          <div className="field"><label htmlFor="leaveType">Тип відпустки</label>
            <select id="leaveType" value={this.state.leaveType} onChange={(e) => this.setState({ leaveType: e.target.value })}>
              <option value="щорічна">щорічна</option>
              <option value="навчальна">навчальна</option>
              <option value="інша">інша</option>
            </select>
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}><button type="submit">Зберегти</button></div>
        </fieldset>
        {this.state.error && <p role="alert">{this.state.error}</p>}
      </form>
    );
  }
}

export class LeaveRequestsList extends React.Component {
  state = { items: [], loading: true, busy: false, error: "", searchEmployee: "", filterDepartment: "all", sortOrder: "asc" };
  pending = false;
  componentDidMount() { this.loadData(); }

  loadData = async () => {
    if (this.pending) return;
    this.pending = true;
    this.setState({ loading: true, error: "" });
    try {
      const items = await request("GET", this.props.apiUrl);
      this.setState({ items });
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.pending = false;
      this.setState({ loading: false });
    }
  };

  onAddRequest = async (input) => {
    if (this.pending) return false;
    this.pending = true;
    this.setState({ busy: true, error: "" });
    try {
      const created = await request("POST", this.props.apiUrl, input);
      this.setState((s) => ({ items: [...s.items, created] }));
      return true;
    } catch (error) {
      this.setState({ error: error.message });
      return false;
    } finally {
      this.pending = false;
      this.setState({ busy: false });
    }
  };

  onRemoveRequest = async (item) => {
    if (this.pending || !window.confirm(`Видалити заявку ${item.requestCode} (${item.employeeName})?`)) return;
    this.pending = true;
    this.setState({ busy: true, error: "" });
    try {
      await request("DELETE", `${this.props.apiUrl}/${encodeURIComponent(item.id)}`);
      this.setState((s) => ({ items: s.items.filter((r) => r.id !== item.id) }));
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.pending = false;
      this.setState({ busy: false });
    }
  };

  render() {
    const { items, loading, busy, error, searchEmployee, filterDepartment, sortOrder } = this.state;
    const disabled = loading || busy;
    const departments = Array.from(new Set(items.map((i) => i.department))).sort((a, b) => a.localeCompare(b, "uk"));
    const query = searchEmployee.trim().toLowerCase();

    const visibleItems = items
      .filter((item) => !query || item.employeeName.toLowerCase().includes(query))
      .filter((item) => filterDepartment === "all" || item.department === filterDepartment)
      .sort((a, b) => sortOrder === "asc" ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate));

    const totalDays = visibleItems.reduce((sum, item) => sum + calcCalendarDays(item.startDate, item.endDate), 0);

    return (
      <main>
        <h1>Журнал заявок на відпустку (Персонал)</h1>
        <LeaveRequestForm disabled={disabled} onRequestSubmit={this.onAddRequest} />
        <div className="toolbar">
          <div className="field"><label htmlFor="searchEmployee">Пошук за працівником</label><input id="searchEmployee" type="text" placeholder="Введіть ПІБ..." value={searchEmployee} onChange={(e) => this.setState({ searchEmployee: e.target.value })} /></div>
          <div className="field"><label htmlFor="filterDepartment">Фільтр за підрозділом</label>
            <select id="filterDepartment" value={filterDepartment} onChange={(e) => this.setState({ filterDepartment: e.target.value })}>
              <option value="all">Усі підрозділи</option>
              {departments.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="sortOrder">Сортування за початковою датою</label>
            <select id="sortOrder" value={sortOrder} onChange={(e) => this.setState({ sortOrder: e.target.value })}>
              <option value="asc">За зростанням</option>
              <option value="desc">За спаданням</option>
            </select>
          </div>
          <button type="button" className="secondary" onClick={() => this.setState({ searchEmployee: "", filterDepartment: "all", sortOrder: "asc" })}>Скинути фільтри</button>
          <button type="button" onClick={this.loadData} disabled={disabled}>Оновити список</button>
        </div>
        <div className="status-row">
          <span role="status" aria-live="polite">{loading ? "Завантаження…" : `Показано заявок: ${visibleItems.length} із ${items.length}`}</span>
          {busy && <span role="status">Виконується запит…</span>}
        </div>
        {error && <p role="alert">{error}</p>}
        {!loading && !error && visibleItems.length === 0 ? <p>Список порожній.</p> : (
          <table>
            <thead>
              <tr><th>Код заявки</th><th>Працівник</th><th>Підрозділ</th><th>Початкова дата</th><th>Кінцева дата</th><th>Календарних днів</th><th>Тип відпустки</th><th>Дія</th></tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => <LeaveRequestItem key={item.id} item={item} disabled={disabled} onRemove={this.onRemoveRequest} />)}
            </tbody>
          </table>
        )}
        <div className="summary-box">Підсумки видимої вибірки: кількість заявок = {visibleItems.length} | сума календарних днів = {totalDays}</div>
      </main>
    );
  }
}
