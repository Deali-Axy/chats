namespace DataMigration.Etl;

public static class RepoPaths
{
    public static string FindRoot()
    {
        foreach (string start in new[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory() })
        {
            DirectoryInfo? dir = new(start);
            while (dir is not null)
            {
                if (File.Exists(Path.Combine(dir.FullName, "Chats.slnx")))
                {
                    return dir.FullName;
                }

                dir = dir.Parent;
            }
        }

        throw new InvalidOperationException("Cannot locate repo root (Chats.slnx).");
    }

    public static string Resolve(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new ArgumentException("Path is empty.", nameof(path));
        }

        if (Path.IsPathRooted(path))
        {
            return Path.GetFullPath(path);
        }

        return Path.GetFullPath(Path.Combine(FindRoot(), path));
    }
}
