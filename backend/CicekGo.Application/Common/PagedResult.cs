namespace CicekGo.Application.Common;

/// <summary>Sayfalı liste sonucu (frontend "items" + "total"/"totalCount" bekler).</summary>
public class PagedResult<T>
{
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
}
