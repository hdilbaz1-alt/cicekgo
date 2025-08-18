using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Core.Dto
{
    public class LoginResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }

        public int? UserId { get; set; }
        public string UserName { get; set; }
    }
}
