using System.Security.Cryptography;

namespace Chats.BE.Services.Sessions;

public class JwtKeyManager(IConfiguration configuration, IHostEnvironment environment)
{
    private readonly Lazy<string> _persistedKey = new(() => LoadOrCreateKey(environment.ContentRootPath));

    public string GetOrCreateSecretKey()
    {
        string? secretKey = configuration["JwtSecretKey"];
        return !string.IsNullOrEmpty(secretKey) ? secretKey : _persistedKey.Value;
    }

    private static string LoadOrCreateKey(string contentRootPath)
    {
        string directory = Path.Combine(contentRootPath, "AppData");
        string keyPath = Path.Combine(directory, "jwt-secret.key");
        Directory.CreateDirectory(directory);

        if (!File.Exists(keyPath))
        {
            // Publish a complete file atomically, including when multiple instances start together.
            string temporaryPath = Path.Combine(directory, $"jwt-secret-{Guid.NewGuid():N}.tmp");
            try
            {
                FileStreamOptions options = new() { Mode = FileMode.CreateNew, Access = FileAccess.Write };
                if (!OperatingSystem.IsWindows())
                {
                    options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
                }
                using (FileStream stream = new(temporaryPath, options))
                using (StreamWriter writer = new(stream))
                {
                    writer.Write(Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)));
                }

                try
                {
                    File.Move(temporaryPath, keyPath);
                }
                catch (IOException) when (File.Exists(keyPath))
                {
                    // Another instance published its key first; use that same key.
                }
            }
            finally
            {
                File.Delete(temporaryPath);
            }
        }

        string key = File.ReadAllText(keyPath).Trim();
        if (string.IsNullOrEmpty(key))
        {
            throw new InvalidOperationException($"JWT signing key file is empty: {keyPath}");
        }
        return key;
    }
}
