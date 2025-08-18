using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Core.Requests
{
    public class LoginRequest
    {
        public string UserName { get; set; }   // zorunlu
        public string Password { get; set; }   // zorunlu (plain, HTTPS üzerinden)
    }
}
