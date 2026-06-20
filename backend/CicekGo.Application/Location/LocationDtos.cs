namespace CicekGo.Application.Location;

public class ProvinceDto
{
    public int Id { get; set; }
    public int PlateCode { get; set; }
    public string Name { get; set; } = default!;
}

public class DistrictDto
{
    public int Id { get; set; }
    public int ProvinceId { get; set; }
    public string Name { get; set; } = default!;
}
