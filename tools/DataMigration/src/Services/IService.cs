using FluentResults;

namespace DataMigration.Services;

public interface IService
{
    Task<Result> Run();
}