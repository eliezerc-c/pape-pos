@echo off
set "NODE_BIN="
set "POSTGRES_BIN="

for /f "delims=" %%p in ('where node 2^>nul') do (
    if not defined NODE_BIN (
        for %%b in ("%%p") do set "NODE_BIN=%%~dpb"
    )
)
if not defined NODE_BIN (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_BIN=C:\Program Files\nodejs"
    ) else (
        for /f "delims=" %%p in ('where npm 2^>nul') do (
            if not defined NODE_BIN (
                for %%b in ("%%p") do set "NODE_BIN=%%~dpb"
            )
        )
    )
)

for /f "delims=" %%p in ('where psql 2^>nul') do (
    if not defined POSTGRES_BIN (
        for %%b in ("%%p") do set "POSTGRES_BIN=%%~dpb"
    )
)
if not defined POSTGRES_BIN (
    if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
        set "POSTGRES_BIN=C:\Program Files\PostgreSQL\18\bin"
    ) else (
        if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
            set "POSTGRES_BIN=C:\Program Files\PostgreSQL\17\bin"
        ) else (
            if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
                set "POSTGRES_BIN=C:\Program Files\PostgreSQL\16\bin"
            )
        )
    )
)

if defined NODE_BIN (
    set "PATH=%PATH%;%NODE_BIN%"
)
if defined POSTGRES_BIN (
    set "PATH=%PATH%;%POSTGRES_BIN%"
)
