using System.ComponentModel.DataAnnotations;

namespace ReactApp.Models;

public sealed class LeaveRequestInput
{
    [Required(ErrorMessage = "Вкажіть код заявки.")]
    [StringLength(30, MinimumLength = 2, ErrorMessage = "Код заявки: від 2 до 30 символів.")]
    public string RequestCode { get; set; } = "";

    [Required(ErrorMessage = "Вкажіть ПІБ працівника.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "ПІБ працівника: від 2 до 100 символів.")]
    public string EmployeeName { get; set; } = "";

    [Required(ErrorMessage = "Вкажіть підрозділ.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Підрозділ: від 2 до 100 символів.")]
    public string Department { get; set; } = "";

    [Required(ErrorMessage = "Вкажіть початкову дату.")]
    public DateOnly? StartDate { get; set; }

    [Required(ErrorMessage = "Вкажіть кінцеву дату.")]
    public DateOnly? EndDate { get; set; }

    [Required(ErrorMessage = "Оберіть тип відпустки.")]
    public string LeaveType { get; set; } = "";
}
