using CicekGo.Application.Common;
using Scriban;
using Scriban.Runtime;

namespace CicekGo.Infrastructure.Services;

/// <summary>Scriban tabanlı güvenli şablon render'ı (sandbox; IO yok).</summary>
public static class EmailRenderer
{
    public static string Render(string text, ScriptObject model, bool throwOnError = false)
    {
        if (string.IsNullOrEmpty(text)) return text ?? "";
        var template = Template.Parse(text);
        if (template.HasErrors)
        {
            if (throwOnError) throw new AppException("Şablon hatası: " + string.Join("; ", template.Messages));
            return text; // bozuk şablon → ham metin
        }
        var ctx = new TemplateContext { MemberRenamer = m => m.Name };
        ctx.PushGlobal(model);
        try { return template.Render(ctx); }
        catch { return text; }
    }
}
