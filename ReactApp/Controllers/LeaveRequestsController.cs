using Microsoft.AspNetCore.Mvc;
using ReactApp.Models;

namespace ReactApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class LeaveRequestsController : ControllerBase
{
    private static readonly object Gate = new();
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.Ordinal)
    {
        "щорічна", "навчальна", "інша"
    };

    private static readonly List<LeaveRequest> Data = new()
    {
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1001", EmployeeName = "Коваленко Ірина Петрівна", Department = "Відділ розробки", StartDate = new DateOnly(2026, 10, 5), EndDate = new DateOnly(2026, 10, 18), LeaveType = "щорічна" },
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1002", EmployeeName = "Мельник Тарас Олегович", Department = "Відділ тестування", StartDate = new DateOnly(2026, 10, 12), EndDate = new DateOnly(2026, 10, 26), LeaveType = "навчальна" },
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1003", EmployeeName = "Бондаренко Олена Сергіївна", Department = "Бухгалтерія", StartDate = new DateOnly(2026, 10, 15), EndDate = new DateOnly(2026, 10, 15), LeaveType = "інша" },
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1004", EmployeeName = "Ткаченко Андрій Миколайович", Department = "Відділ розробки", StartDate = new DateOnly(2026, 11, 1), EndDate = new DateOnly(2026, 11, 30), LeaveType = "навчальна" },
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1005", EmployeeName = "Шевчук Марія Іванівна", Department = "Відділ кадрів", StartDate = new DateOnly(2026, 10, 20), EndDate = new DateOnly(2026, 10, 24), LeaveType = "щорічна" },
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1006", EmployeeName = "Кравченко Дмитро Вікторович", Department = "Відділ маркетингу", StartDate = new DateOnly(2026, 11, 10), EndDate = new DateOnly(2026, 11, 19), LeaveType = "щорічна" },
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1007", EmployeeName = "Савченко Наталія Юріївна", Department = "Відділ тестування", StartDate = new DateOnly(2026, 9, 25), EndDate = new DateOnly(2026, 9, 27), LeaveType = "інша" },
        new() { Id = Guid.NewGuid().ToString(), RequestCode = "LR-1008", EmployeeName = "Поліщук Максим Андрійович", Department = "Відділ розробки", StartDate = new DateOnly(2026, 12, 1), EndDate = new DateOnly(2026, 12, 14), LeaveType = "щорічна" }
    };

    [HttpGet]
    public ActionResult<LeaveRequest[]> Get()
    {
        lock (Gate) { return Ok(Data.ToArray()); }
    }

    [HttpPost]
    public ActionResult<LeaveRequest> Post([FromBody] LeaveRequestInput input)
    {
        string code = input.RequestCode.Trim();
        string employee = input.EmployeeName.Trim();
        string department = input.Department.Trim();
        string leaveType = input.LeaveType.Trim();

        if (code.Length < 2 || code.Length > 30)
            return BadRequest(new { detail = "Код заявки після обрізання пробілів: 2–30 символів." });
        if (employee.Length < 2 || employee.Length > 100)
            return BadRequest(new { detail = "ПІБ працівника після обрізання пробілів: 2–100 символів." });
        if (department.Length < 2 || department.Length > 100)
            return BadRequest(new { detail = "Підрозділ після обрізання пробілів: 2–100 символів." });
        if (!AllowedTypes.Contains(leaveType))
            return BadRequest(new { detail = "Неприпустимий тип відпустки. Дозволено: щорічна, навчальна, інша." });
        if (input.StartDate is null || input.EndDate is null)
            return BadRequest(new { detail = "Початкова та кінцева дати обов'язкові." });

        var start = input.StartDate.Value;
        var end = input.EndDate.Value;
        if (end < start)
            return BadRequest(new { detail = "Кінцева дата не може бути раніше початкової." });

        int days = end.DayNumber - start.DayNumber + 1;
        if (leaveType == "навчальна" && (days < 1 || days > 60))
            return BadRequest(new { detail = $"Навчальна відпустка повинна тривати від 1 до 60 календарних днів (зараз: {days})." });

        lock (Gate)
        {
            if (Data.Any(r => string.Equals(r.RequestCode, code, StringComparison.OrdinalIgnoreCase)))
                return Conflict(new { detail = $"Заявка з кодом «{code}» вже існує." });

            var item = new LeaveRequest
            {
                Id = Guid.NewGuid().ToString(),
                RequestCode = code,
                EmployeeName = employee,
                Department = department,
                StartDate = start,
                EndDate = end,
                LeaveType = leaveType
            };
            Data.Add(item);
            return Ok(item);
        }
    }

    [HttpDelete("{id}")]
    public ActionResult<LeaveRequest> Delete(string id)
    {
        lock (Gate)
        {
            var item = Data.FirstOrDefault(r => r.Id == id);
            if (item is null) return NotFound(new { detail = "Запис заявки не знайдено." });
            Data.Remove(item);
            return Ok(item);
        }
    }
}
