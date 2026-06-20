namespace CicekGo.Application.Common;

/// <summary>HTTP status koduyla eşlenen uygulama hatası. Global handler bunu ApiResponse.Fail'e çevirir.</summary>
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message = "kayıt bulunamadı") : base(message, 404) { }
}

public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "yetkisiz") : base(message, 401) { }
}

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message = "erişim engellendi") : base(message, 403) { }
}

public sealed class ConflictException : AppException
{
    public ConflictException(string message) : base(message, 409) { }
}
