using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Data.Common
{
    public class ApiResponse<T>
    {
        public T? Data { get; set; }
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int StatusCode { get; set; }

        public static ApiResponse<T> Ok(T data, string? message = null, int statusCode = 200) =>
            new() { Data = data, Success = true, Message = message, StatusCode = statusCode };

        public static ApiResponse<T> Fail(string message, int statusCode = 400) =>
            new() { Data = default, Success = false, Message = message, StatusCode = statusCode };
    }
}
