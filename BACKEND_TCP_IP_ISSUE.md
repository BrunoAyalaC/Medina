# Backend Testing - TCP/IP Connectivity Issue

## Status: 🔴 BLOCKED

The backend testing suite is currently blocked by SQL Server TCP/IP connectivity issues.

## Issue Details

### Problem
- **Symptom**: `mssql` driver cannot connect to `localhost:1433` or `127.0.0.1:1433`
- **Error Message**: `Failed to connect to localhost:1433 - Could not connect (sequence)`
- **Impact**: 28 backend smoke tests + 5 backend journey tests cannot execute

### Root Cause Analysis

1. **TCP/IP Port Not Listening**: SQL Server is installed but TCP/IP protocol appears to not be properly enabled/listening on port 1433

2. **Evidence**:
   - ✅ `sqlcmd` works fine with local connections (`sqlcmd -Q "SELECT @@VERSION"`)
   - ✅ `sqlcmd` works with user `testuser` (`sqlcmd -S localhost -U testuser -P "TestPass123!" -Q "SELECT @@VERSION"`)
   - ❌ Node.js `mssql` driver fails to connect to the same server
   - ❌ Multiple connection attempts failed:
     - `server: 'localhost'` → FAILED
     - `server: '127.0.0.1'` → FAILED
     - `server: 'DESKTOP-UDAM3NC\MSSQLSERVER'` → FAILED (DNS resolution issue)

3. **SQL Server Configuration**:
   - Instance: MSSQLSERVER (default)
   - Version: SQL Server 2008 R2 Express (SP2)
   - Database: MinimarketDB_Test (✅ created)
   - User: testuser (✅ created with db_owner role)

### Prerequisites Completed ✅

- [x] SQL Server 2008 R2 installed
- [x] MinimarketDB_Test database created
- [x] Database schema deployed (12 tables, 15 indexes)
- [x] testuser SQL Server login created
- [x] testuser database user created with db_owner role
- [x] .env.test configured with credentials
- [x] database.js configuration updated

### Prerequisites NOT Met ❌

- [ ] TCP/IP protocol enabled and listening on port 1433
- [ ] Network connectivity verified for Node.js processes

## Solutions to Try (In Order)

### Option 1: Enable TCP/IP Protocol (RECOMMENDED)

**Windows/GUI Method:**
1. Open SQL Server Configuration Manager
2. Navigate to `SQL Server Network Configuration` → `Protocols for MSSQLSERVER`
3. Right-click `TCP/IP` → `Enable`
4. Right-click `TCP/IP` → `Properties`
5. Check that "Listen All" = Yes, Port = 1433
6. Restart SQL Server service

**PowerShell Method:**
```powershell
# Enable TCP/IP (requires elevated privileges)
$reg = [Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, $null)
$key = $reg.OpenSubKey("SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL10.MSSQLSERVER\MSSQLServer\SuperSocketNetLib\Tcp", $true)
$key.SetValue("Enabled", 1)
$key.Close()
$reg.Close()

# Restart SQL Server
Restart-Service -Name "MSSQLSERVER"
```

### Option 2: Use Docker SQL Server

```bash
# Run SQL Server in Docker (clean, isolated)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=TestPass123!" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2019-latest

# Wait 30 seconds for startup
sleep 30

# Create test database
sqlcmd -S localhost -U sa -P "TestPass123!" -Q "CREATE DATABASE MinimarketDB_Test"

# Run tests
npm run test:smoke
```

### Option 3: Use Named Pipes Connection String

If TCP/IP cannot be enabled, try Named Pipes:
```
server: '\\.\pipe\MSSQL$MSSQLSERVER\sql\query'
```

## Current Test Status

### Frontend Tests: ✅ 100% SUCCESS
- **Files**: 2 test files
- **Tests**: 64/64 PASSED
- **Duration**: 1.72 seconds
- **Coverage**:
  - Component smoke tests: 5/5 ✅
  - User journey tests: 59/59 ✅

### Backend Tests: ❌ BLOCKED
- **Smoke Tests**: 28 tests (CANNOT RUN)
- **Journey Tests**: 5 tests (CANNOT RUN)
- **Blocker**: TCP/IP connectivity to SQL Server

## Next Steps

1. **Enable TCP/IP** in SQL Server using Configuration Manager or PowerShell
2. **Verify connectivity**: `sqlcmd -S localhost -Q "SELECT @@VERSION"`
3. **Test Node.js connection**: Run the connectivity test script
4. **Execute backend tests**: `npm run test:smoke`
5. **Capture results**: Document all test execution results
6. **Generate final report**: Combine frontend + backend results

## Notes

- All backend test code is ready and correctly configured
- Database schema is deployed and accessible
- Test credentials are created and working
- Only missing piece: TCP/IP network protocol enablement

## Estimated Time to Resolution

- **Enable TCP/IP**: 5-10 minutes
- **Run backend tests**: 2-3 minutes  
- **Total**: 10-15 minutes once TCP/IP is enabled

---

**Created**: 2026-02-18  
**Status**: INVESTIGATING  
**Owner**: OpenCode Agent  
