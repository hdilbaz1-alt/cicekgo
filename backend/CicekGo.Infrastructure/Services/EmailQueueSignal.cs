namespace CicekGo.Infrastructure.Services;

/// <summary>Worker'ı "iş var" diye uyandırmak için hafif sinyal (singleton).</summary>
public class EmailQueueSignal
{
    private readonly SemaphoreSlim _s = new(0, 1);
    public void Signal() { if (_s.CurrentCount == 0) { try { _s.Release(); } catch { /* yoksay */ } } }
    public Task WaitAsync(TimeSpan timeout, CancellationToken ct) => _s.WaitAsync(timeout, ct);
}
