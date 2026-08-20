// See https://aka.ms/new-console-template for more information

using DataMigration.Services;
using DataMigration.Framework;

var builder = FluentConsoleApp.CreateBuilder(args);
var app = builder.Build();

var result = await app.Run<EtlService>();
if (result.IsFailed)
{
    Environment.ExitCode = 1;
}