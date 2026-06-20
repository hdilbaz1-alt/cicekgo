using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Products;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IProductService _service;
    public ProductController(IProductService service) => _service = service;

    [HttpGet("list")]
    [HasPermission(Permissions.ProductsView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductDto>>>> List([FromQuery] string? search, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ProductDto>>.Ok(await _service.GetAllAsync(search, ct)));

    [HttpGet("{id:int}")]
    [HasPermission(Permissions.ProductsView)]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Get(int id, CancellationToken ct)
    {
        var p = await _service.GetByIdAsync(id, ct) ?? throw new NotFoundException("ürün bulunamadı");
        return Ok(ApiResponse<ProductDto>.Ok(p));
    }

    [HttpPost]
    [HasPermission(Permissions.ProductsManage)]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] ProductCreateDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateAsync(dto, ct), "Ürün oluşturuldu.", 201));

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.ProductsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] ProductUpdateDto dto, CancellationToken ct)
    {
        await _service.UpdateAsync(id, dto, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Ürün güncellendi."));
    }

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.ProductsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Ürün silindi."));
    }

    // ---- Kategoriler ----
    [HttpGet("categories")]
    [HasPermission(Permissions.ProductsView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductCategoryDto>>>> Categories(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ProductCategoryDto>>.Ok(await _service.GetCategoriesAsync(ct)));

    [HttpPost("categories")]
    [HasPermission(Permissions.ProductsManage)]
    public async Task<ActionResult<ApiResponse<int>>> CreateCategory([FromBody] ProductCategoryRequest dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateCategoryAsync(dto, ct), "Kategori oluşturuldu.", 201));

    [HttpPut("categories/{id:int}")]
    [HasPermission(Permissions.ProductsManage)]
    public async Task<ActionResult<ApiResponse<string>>> UpdateCategory(int id, [FromBody] ProductCategoryRequest dto, CancellationToken ct)
    {
        await _service.UpdateCategoryAsync(id, dto, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Kategori güncellendi."));
    }

    [HttpDelete("categories/{id:int}")]
    [HasPermission(Permissions.ProductsManage)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteCategory(int id, CancellationToken ct)
    {
        await _service.DeleteCategoryAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Kategori silindi."));
    }
}
