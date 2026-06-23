# ÇiçekGo .NET 9 API — çok aşamalı build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore katmanı için önce proje dosyaları (cache verimliliği)
COPY CicekGo.sln ./
COPY CicekGo.Api/CicekGo.Api.csproj CicekGo.Api/
COPY CicekGo.Application/CicekGo.Application.csproj CicekGo.Application/
COPY CicekGo.Infrastructure/CicekGo.Infrastructure.csproj CicekGo.Infrastructure/
COPY CicekGo.Domain/CicekGo.Domain.csproj CicekGo.Domain/
RUN dotnet restore CicekGo.Api/CicekGo.Api.csproj

COPY . .
RUN dotnet publish CicekGo.Api/CicekGo.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:5080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 5080
ENTRYPOINT ["dotnet", "CicekGo.Api.dll"]
