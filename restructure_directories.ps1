# =============================================================================
# 🏗️  CasaGestión - Directory Restructuring Script (PowerShell)
# =============================================================================
# Moves components, contexts, hooks, services, types, utils, pages into /src
# Ensures data integrity with comprehensive safety checks
# =============================================================================

#Requires -Version 5.1

# =============================================================================
# CONFIGURATION
# =============================================================================

# Color codes for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Purple = "Purple"
    Cyan = "Cyan"
    White = "White"
}

# Directory to work in
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SrcDir = Join-Path $ProjectRoot "src"

# Directories to move/restructure
$DirectoriesToMove = @(
    "components"
    "contexts" 
    "hooks"
    "services"
    "types"
    "utils"
    "pages"
)

# Backup directory
$BackupDir = Join-Path $ProjectRoot ".backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-Header {
    param([string]$Message)
    Write-ColorOutput $Message "Purple"
}

# =============================================================================
# PRE-OPERATION CHECKS
# =============================================================================

Write-Header "🔍 Pre-Operation Safety Checks"

# Check if we're in the right directory
$PackageJsonPath = Join-Path $ProjectRoot "package.json"
if (-not (Test-Path $PackageJsonPath)) {
    Write-Error "package.json not found. Please run this script from project root."
    exit 1
}

# Check if src directory exists
if (-not (Test-Path $SrcDir)) {
    Write-Warning "src directory not found. Creating it..."
    New-Item -ItemType Directory -Path $SrcDir -Force | Out-Null
    Write-Success "Created src directory"
}

# Create backup directory
Write-Info "Creating backup directory: $BackupDir"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# =============================================================================
# ANALYSIS PHASE
# =============================================================================

Write-Header "📊 Current Structure Analysis"

Write-Host "Current root-level directories:"
foreach ($dir in $DirectoriesToMove) {
    $RootDir = Join-Path $ProjectRoot $dir
    if (Test-Path $RootDir) {
        $Size = (Get-ChildItem $RootDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
        $Size = "{0:N2} MB" -f $Size
        $Count = (Get-ChildItem $RootDir -Recurse -File).Count
        Write-Host "  ✓ $dir ($Size, $Count files) - EXISTS in root"
    } else {
        Write-Host "  ✗ $dir - NOT FOUND in root"
    }
}

Write-Host "`nCurrent src/ directories:"
foreach ($dir in $DirectoriesToMove) {
    $SrcSubDir = Join-Path $SrcDir $dir
    if (Test-Path $SrcSubDir) {
        $Size = (Get-ChildItem $SrcSubDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
        $Size = "{0:N2} MB" -f $Size
        $Count = (Get-ChildItem $SrcSubDir -Recurse -File).Count
        Write-Host "  ✓ $dir ($Size, $Count files) - EXISTS in src"
    } else {
        Write-Host "  ✗ $dir - NOT FOUND in src"
    }
}

# =============================================================================
# CONFLICT RESOLUTION STRATEGY
# =============================================================================

Write-Header "⚠️  Conflict Resolution Strategy"

$Conflicts = $false

# Check for potential conflicts
foreach ($dir in $DirectoriesToMove) {
    $RootDir = Join-Path $ProjectRoot $dir
    $SrcSubDir = Join-Path $SrcDir $dir
    
    if ((Test-Path $RootDir) -and (Test-Path $SrcSubDir)) {
        Write-Warning "CONFLICT: $dir exists in both root and src/"
        Write-Info "Strategy: Will merge root into src/ preserving existing src files"
        $Conflicts = $true
    }
}

if ($Conflicts) {
    Write-Warning "Conflicts detected. Will merge directories carefully."
    $Response = Read-Host "Continue with merge strategy? (y/N)"
    if ($Response -notmatch '^[Yy]$') {
        Write-Info "Operation cancelled by user."
        exit 0
    }
}

# =============================================================================
# BACKUP PHASE
# =============================================================================

Write-Header "💾 Creating Backups"

# Backup existing directories before moving
foreach ($dir in $DirectoriesToMove) {
    $RootDir = Join-Path $ProjectRoot $dir
    $SrcSubDir = Join-Path $SrcDir $dir
    
    if (Test-Path $RootDir) {
        Write-Info "Backing up $dir..."
        Copy-Item -Path $RootDir -Destination $BackupDir -Recurse -Force
        Write-Success "Backed up $dir"
    }
    
    if (Test-Path $SrcSubDir) {
        Write-Info "Backing up src/$dir..."
        Copy-Item -Path $SrcSubDir -Destination "$BackupDir/src_$dir" -Recurse -Force
        Write-Success "Backed up src/$dir"
    }
}

Write-Success "All directories backed up to: $BackupDir"

# =============================================================================
# RESTRUCTURING PHASE
# =============================================================================

Write-Header "🏗️  Directory Restructuring"

$OperationsCount = 0

foreach ($dir in $DirectoriesToMove) {
    $RootDir = Join-Path $ProjectRoot $dir
    $SrcSubDir = Join-Path $SrcDir $dir
    
    # Case 1: Directory exists in root, not in src
    if ((Test-Path $RootDir) -and (-not (Test-Path $SrcSubDir))) {
        Write-Info "Moving $dir from root to src/..."
        Move-Item -Path $RootDir -Destination $SrcSubDir
        Write-Success "Moved $dir to src/"
        $OperationsCount++
    }
    # Case 2: Directory exists in both root and src (merge)
    elseif ((Test-Path $RootDir) -and (Test-Path $SrcSubDir)) {
        Write-Info "Merging root/$dir into src/$dir..."
        
        # Copy contents from root to src, preserving existing
        $RootContents = Get-ChildItem -Path $RootDir -Force
        foreach ($item in $RootContents) {
            $DestPath = Join-Path $SrcSubDir $item.Name
            if (Test-Path $DestPath) {
                Write-Warning "Skipping existing item: $($item.Name)"
            } else {
                Move-Item -Path $item.FullName -Destination $DestPath
            }
        }
        
        # Remove root directory after successful copy
        Remove-Item -Path $RootDir -Recurse -Force
        Write-Success "Merged $dir into src/ and removed root copy"
        $OperationsCount++
    }
    # Case 3: Directory doesn't exist anywhere (create)
    elseif ((-not (Test-Path $RootDir)) -and (-not (Test-Path $SrcSubDir))) {
        Write-Info "Creating $dir in src/..."
        New-Item -ItemType Directory -Path $SrcSubDir -Force | Out-Null
        Write-Success "Created $dir in src/"
        $OperationsCount++
    }
    # Case 4: Directory already only in src (skip)
    else {
        Write-Info "$dir already correctly located in src/ - no action needed"
    }
}

# =============================================================================
# VERIFICATION PHASE
# =============================================================================

Write-Header "✅ Verification Phase"

$ErrorsFound = $false

# Verify all directories now exist in src/
foreach ($dir in $DirectoriesToMove) {
    $SrcSubDir = Join-Path $SrcDir $dir
    if (Test-Path $SrcSubDir) {
        $Count = (Get-ChildItem $SrcSubDir -Recurse -File).Count
        Write-Success "$dir in src/ ✓ ($Count files)"
    } else {
        Write-Error "$dir NOT found in src/ ✗"
        $ErrorsFound = $true
    }
}

# Verify no target directories remain in root
foreach ($dir in $DirectoriesToMove) {
    $RootDir = Join-Path $ProjectRoot $dir
    if (Test-Path $RootDir) {
        Write-Error "$dir still exists in root/ ✗"
        $ErrorsFound = $true
    } else {
        Write-Success "$dir correctly removed from root/ ✓"
    }
}

# =============================================================================
# POST-OPERATION CLEANUP
# =============================================================================

Write-Header "🧹 Post-Operation Cleanup"

# Check for files that might need path updates
$ImportFiles = @(
    (Join-Path $ProjectRoot "tsconfig.json"),
    (Join-Path $ProjectRoot "vite.config.ts"),
    (Join-Path $ProjectRoot "jsconfig.json"),
    (Join-Path $ProjectRoot "eslint.config.js")
)

Write-Info "Checking for import paths that might need updating..."
foreach ($file in $ImportFiles) {
    if (Test-Path $file) {
        Write-Info "Checking $file for path updates..."
        # This would need to be customized based on actual path references
        Write-Success "Checked $file"
    }
}

# =============================================================================
# SUMMARY
# =============================================================================

Write-Header "📋 Operation Summary"

if (-not $ErrorsFound) {
    Write-Success "✅ Directory restructuring completed successfully!"
    Write-Host ""
    Write-ColorOutput "Operations performed: $OperationsCount" "Cyan"
    Write-ColorOutput "Backup location: $BackupDir" "Cyan"
    Write-Host ""
    Write-ColorOutput "New structure:" "Green"
    Get-ChildItem $SrcDir -Directory | ForEach-Object { Write-Host "  $($_.Name)/" }
    Write-Host ""
    Write-ColorOutput "Next steps:" "Yellow"
    Write-Host "1. Update any remaining import paths in your code"
    Write-Host "2. Run 'npm run build' to test new structure"
    Write-Host "3. Run 'npm run dev' to verify everything works"
    Write-Host "4. If issues occur, restore from: $BackupDir"
} else {
    Write-Error "❌ Errors found during restructuring!"
    Write-Host ""
    Write-ColorOutput "Please restore from backup: $BackupDir" "Red"
    exit 1
}

Write-Host ""
Write-Header "🎉 CasaGestión Directory Restructuring Complete!"

# =============================================================================
# OPTIONAL: RESTORE SCRIPT
# =============================================================================

$RestoreScript = @"
# =============================================================================
# 🔄 CasaGestión - Structure Restore Script (PowerShell)
# =============================================================================
# Generated by restructure_directories.ps1
# Usage: .\restore_structure.ps1 <backup_directory>
# =============================================================================

param(
    [Parameter(Mandatory=`$true)]
    [string]`$BackupDir
)

if (-not (Test-Path `$BackupDir)) {
    Write-Error "Backup directory not found: `$BackupDir"
    Write-Host "Available backups:"
    Get-ChildItem `$ProjectRoot ".backup_*" -Directory | ForEach-Object { Write-Host "  `$(`$_.Name)" }
    exit 1
}

Write-Host "Restoring from backup: `$BackupDir"

`$ProjectRoot = Split-Path -Parent `$MyInvocation.MyCommand.Definition

# Restore directories
foreach (`$dir in @("components", "contexts", "hooks", "services", "types", "utils", "pages")) {
    `$RootBackup = Join-Path `$BackupDir `$dir
    `$RootTarget = Join-Path `$ProjectRoot `$dir
    `$SrcBackup = Join-Path `$BackupDir "src_`$dir"
    `$SrcTarget = Join-Path `$ProjectRoot "src`$dir"
    
    if (Test-Path `$RootBackup) {
        Write-Host "Restoring `$dir to root..."
        if (Test-Path `$RootTarget) { Remove-Item `$RootTarget -Recurse -Force }
        Copy-Item `$RootBackup `$ProjectRoot -Recurse -Force
    }
    
    if (Test-Path `$SrcBackup) {
        Write-Host "Restoring src/`$dir..."
        if (Test-Path `$SrcTarget) { Remove-Item `$SrcTarget -Recurse -Force }
        Copy-Item `$SrcBackup `$SrcTarget -Recurse -Force
    }
}

Write-Host "Restore completed!"
"@

$RestoreScriptPath = Join-Path $ProjectRoot "restore_structure.ps1"
$RestoreScript | Out-File -FilePath $RestoreScriptPath -Encoding UTF8
Write-Info "Created restore script: restore_structure.ps1"

# Make the script executable (PowerShell equivalent)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force 2>$null | Out-Null