using Chats.BE.Services.Sessions;
using Chats.BE.Services.UrlEncryption;
using Chats.DB;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using File = System.IO.File;

namespace Chats.BE.UnitTest.Services.Sessions;

public sealed class JwtKeyManagerTests : IDisposable
{
    private readonly string _directory = Path.Combine(Path.GetTempPath(), $"chats-jwt-{Guid.NewGuid():N}");
    private string KeyPath => Path.Combine(_directory, "AppData", "jwt-secret.key");

    [Fact]
    public async Task Session_RemainsValidAfterRestart()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();
        SessionManager beforeRestart = CreateSessionManager(configuration);
        var login = await beforeRestart.GenerateSessionForUser(new User
        {
            Id = 42,
            DisplayName = "test user",
            Role = "-",
        }, default);

        SessionManager afterRestart = CreateSessionManager(configuration);
        SessionEntry user = await afterRestart.GetUserInfoByJwt(login.SessionId);

        Assert.Equal(42, user.UserId);
        Assert.Equal("test user", user.UserName);
        Assert.True(File.Exists(KeyPath));
        if (!OperatingSystem.IsWindows())
        {
            Assert.Equal(UnixFileMode.UserRead | UnixFileMode.UserWrite, File.GetUnixFileMode(KeyPath));
        }
    }

    [Fact]
    public async Task ConcurrentInstances_ShareTheSamePersistedKey()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();
        string[] keys = await Task.WhenAll(Enumerable.Range(0, 16).Select(_ =>
            Task.Run(() => new JwtKeyManager(configuration, CreateEnvironment()).GetOrCreateSecretKey())));

        Assert.Single(keys.Distinct());
        Assert.Equal(File.ReadAllText(KeyPath), keys[0]);
        Assert.Single(Directory.GetFiles(Path.GetDirectoryName(KeyPath)!));
    }

    [Fact]
    public void ConfiguredKey_TakesPrecedenceWithoutWritingFiles()
    {
        IConfiguration configuration = Configure("JwtSecretKey", "configured-key");
        JwtKeyManager manager = new(configuration, CreateEnvironment());

        Assert.Equal("configured-key", manager.GetOrCreateSecretKey());
        Assert.False(Directory.Exists(_directory));
    }

    [Fact]
    public async Task ExpiredSession_IsStillRejected()
    {
        SessionManager sessions = CreateSessionManager(Configure("JwtValidPeriod", "00:00:01"));
        // A negative lifetime creates an already expired token without waiting for a clock boundary.
        IConfiguration expiredConfiguration = Configure("JwtValidPeriod", "-00:01:00");
        var login = await CreateSessionManager(expiredConfiguration).GenerateSessionForUser(new User
        {
            Id = 42,
            DisplayName = "test user",
            Role = "-",
        }, default);

        await Assert.ThrowsAsync<SecurityTokenExpiredException>(() => sessions.GetUserInfoByJwt(login.SessionId));
    }

    [Fact]
    public void EmptyPersistedKey_FailsWithoutReplacingIt()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(KeyPath)!);
        File.WriteAllText(KeyPath, " ");
        JwtKeyManager manager = new(new ConfigurationBuilder().Build(), CreateEnvironment());

        Assert.Throws<InvalidOperationException>(() => manager.GetOrCreateSecretKey());
        Assert.Equal(" ", File.ReadAllText(KeyPath));
    }

    private SessionManager CreateSessionManager(IConfiguration configuration) =>
        new(new JwtKeyManager(configuration, CreateEnvironment()), configuration, new NoOpUrlEncryptionService());

    private IHostEnvironment CreateEnvironment() => new TestEnvironment { ContentRootPath = _directory };

    private static IConfiguration Configure(string key, string value) => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { [key] = value }).Build();

    public void Dispose()
    {
        if (Directory.Exists(_directory)) Directory.Delete(_directory, recursive: true);
    }

    private sealed class TestEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Chats.BE.UnitTest";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
