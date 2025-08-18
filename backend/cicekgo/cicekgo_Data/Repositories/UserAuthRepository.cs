using System;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Cryptography;
using Microsoft.Data.SqlClient;
using Dapper;
using cicekgo_Core.Dto;
using cicekgo_Core.Requests;

namespace cicekgo_Data.Repositories
{
    public class UserAuthRepository : IUserAuthRepository
    {
        private readonly string _cs;
        public UserAuthRepository(string connectionString)
        {
            _cs = connectionString;
        }

        public async Task<LoginResultDto> LoginAsync(LoginRequest req)
        {
            var result = new LoginResultDto { Success = false, Message = "Geçersiz kullanıcı adı veya şifre." };

            using (var conn = new SqlConnection(_cs))
            {
                await conn.OpenAsync();

                const string sql = @"
SELECT TOP 1 Id, UserName, PasswordHash, PasswordSalt, IsActive
FROM dbo.AppUser
WHERE UserName = @UserName;";

                var row = await conn.QuerySingleOrDefaultAsync<dynamic>(sql, new { UserName = req.UserName });

                if (row == null) return result;
                if (row.IsActive == false) { result.Message = "Hesap pasif."; return result; }

                // DB: PasswordHash VARBINARY(32) (SHA2_256), PasswordSalt VARBINARY(16)
                byte[] salt = (byte[])row.PasswordSalt;
                byte[] storedHash = (byte[])row.PasswordHash;

                // .NET tarafında NVARCHAR → UTF-16LE (Encoding.Unicode) ile aynı şekilde hashle
                byte[] pwdBytes = Encoding.Unicode.GetBytes(req.Password ?? string.Empty);
                byte[] combined = new byte[salt.Length + pwdBytes.Length];
                Buffer.BlockCopy(salt, 0, combined, 0, salt.Length);
                Buffer.BlockCopy(pwdBytes, 0, combined, salt.Length, pwdBytes.Length);

                byte[] computed;
                using (var sha = SHA256.Create())
                {
                    computed = sha.ComputeHash(combined);
                }

                if (!storedHash.SequenceEqual(computed))
                    return result;

                // Başarılı giriş → LastLoginAt güncelle
                await conn.ExecuteAsync(
                    "UPDATE dbo.AppUser SET LastLoginAt = GETDATE() WHERE Id = @Id",
                    new { Id = (int)row.Id });

                result.Success = true;
                result.Message = "OK";
                result.UserId = (int)row.Id;
                result.UserName = (string)row.UserName;
                return result;
            }
        }
    }
}
