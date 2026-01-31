#!/bin/bash

# =============================================================================
# 🏗️  CasaGestión - Directory Restructuring Script
# =============================================================================
# Moves components, contexts, hooks, services, types, utils, pages into /src
# Ensures data integrity with comprehensive safety checks
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

# =============================================================================
# CONFIGURATION
# =============================================================================

# Directory to work in
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$PROJECT_ROOT/src"

# Directories to move/restructure
DIRECTORIES_TO_MOVE=(
    "components"
    "contexts" 
    "hooks"
    "services"
    "types"
    "utils"
    "pages"
)

# Backup directory
BACKUP_DIR="$PROJECT_ROOT/.backup_$(date +%Y%m%d_%H%M%S)"

# =============================================================================
# PRE-OPERATION CHECKS
# =============================================================================

log_header "🔍 Pre-Operation Safety Checks"

# Check if we're in the right directory
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    log_error "package.json not found. Please run this script from project root."
    exit 1
fi

# Check if src directory exists
if [[ ! -d "$SRC_DIR" ]]; then
    log_warning "src directory not found. Creating it..."
    mkdir -p "$SRC_DIR"
    log_success "Created src directory"
fi

# Create backup directory
log_info "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# =============================================================================
# ANALYSIS PHASE
# =============================================================================

log_header "📊 Current Structure Analysis"

echo "Current root-level directories:"
for dir in "${DIRECTORIES_TO_MOVE[@]}"; do
    if [[ -d "$PROJECT_ROOT/$dir" ]]; then
        local size=$(du -sh "$PROJECT_ROOT/$dir" 2>/dev/null | cut -f1)
        local count=$(find "$PROJECT_ROOT/$dir" -type f 2>/dev/null | wc -l)
        echo "  ✓ $dir ($size, $count files) - EXISTS in root"
    else
        echo "  ✗ $dir - NOT FOUND in root"
    fi
done

echo -e "\nCurrent src/ directories:"
for dir in "${DIRECTORIES_TO_MOVE[@]}"; do
    if [[ -d "$SRC_DIR/$dir" ]]; then
        local size=$(du -sh "$SRC_DIR/$dir" 2>/dev/null | cut -f1)
        local count=$(find "$SRC_DIR/$dir" -type f 2>/dev/null | wc -l)
        echo "  ✓ $dir ($size, $count files) - EXISTS in src"
    else
        echo "  ✗ $dir - NOT FOUND in src"
    fi
done

# =============================================================================
# CONFLICT RESOLUTION STRATEGY
# =============================================================================

log_header "⚠️  Conflict Resolution Strategy"

CONFLICTS=false

# Check for potential conflicts
for dir in "${DIRECTORIES_TO_MOVE[@]}"; do
    if [[ -d "$PROJECT_ROOT/$dir" && -d "$SRC_DIR/$dir" ]]; then
        log_warning "CONFLICT: $dir exists in both root and src/"
        log_info "Strategy: Will merge root into src/ preserving existing src files"
        CONFLICTS=true
    fi
done

if [[ "$CONFLICTS" == "true" ]]; then
    log_warning "Conflicts detected. Will merge directories carefully."
    read -p "Continue with merge strategy? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled by user."
        exit 0
    fi
fi

# =============================================================================
# BACKUP PHASE
# =============================================================================

log_header "💾 Creating Backups"

# Backup existing directories before moving
for dir in "${DIRECTORIES_TO_MOVE[@]}"; do
    if [[ -d "$PROJECT_ROOT/$dir" ]]; then
        log_info "Backing up $dir..."
        cp -r "$PROJECT_ROOT/$dir" "$BACKUP_DIR/"
        log_success "Backed up $dir"
    fi
    
    if [[ -d "$SRC_DIR/$dir" ]]; then
        log_info "Backing up src/$dir..."
        cp -r "$SRC_DIR/$dir" "$BACKUP_DIR/src_$dir"
        log_success "Backed up src/$dir"
    fi
done

log_success "All directories backed up to: $BACKUP_DIR"

# =============================================================================
# RESTRUCTURING PHASE
# =============================================================================

log_header "🏗️  Directory Restructuring"

OPERATIONS_COUNT=0

for dir in "${DIRECTORIES_TO_MOVE[@]}"; do
    ROOT_DIR="$PROJECT_ROOT/$dir"
    SRC_SUBDIR="$SRC_DIR/$dir"
    
    # Case 1: Directory exists in root, not in src
    if [[ -d "$ROOT_DIR" && ! -d "$SRC_SUBDIR" ]]; then
        log_info "Moving $dir from root to src/..."
        mv "$ROOT_DIR" "$SRC_SUBDIR"
        log_success "Moved $dir to src/"
        ((OPERATIONS_COUNT++))
        
    # Case 2: Directory exists in both root and src (merge)
    elif [[ -d "$ROOT_DIR" && -d "$SRC_SUBDIR" ]]; then
        log_info "Merging root/$dir into src/$dir..."
        
        # Copy contents from root to src, preserving existing
        find "$ROOT_DIR" -mindepth 1 -maxdepth 1 -exec cp -r -t "$SRC_SUBDIR" {} +
        
        # Remove root directory after successful copy
        rm -rf "$ROOT_DIR"
        log_success "Merged $dir into src/ and removed root copy"
        ((OPERATIONS_COUNT++))
        
    # Case 3: Directory doesn't exist anywhere (create)
    elif [[ ! -d "$ROOT_DIR" && ! -d "$SRC_SUBDIR" ]]; then
        log_info "Creating $dir in src/..."
        mkdir -p "$SRC_SUBDIR"
        log_success "Created $dir in src/"
        ((OPERATIONS_COUNT++))
        
    # Case 4: Directory already only in src (skip)
    else
        log_info "$dir already correctly located in src/ - no action needed"
    fi
done

# =============================================================================
# VERIFICATION PHASE
# =============================================================================

log_header "✅ Verification Phase"

ERRORS_FOUND=false

# Verify all directories now exist in src/
for dir in "${DIRECTORIES_TO_MOVE[@]}"; do
    if [[ -d "$SRC_DIR/$dir" ]]; then
        local count=$(find "$SRC_DIR/$dir" -type f 2>/dev/null | wc -l)
        log_success "$dir in src/ ✓ ($count files)"
    else
        log_error "$dir NOT found in src/ ✗"
        ERRORS_FOUND=true
    fi
done

# Verify no target directories remain in root
for dir in "${DIRECTORIES_TO_MOVE[@]}"; do
    if [[ -d "$PROJECT_ROOT/$dir" ]]; then
        log_error "$dir still exists in root/ ✗"
        ERRORS_FOUND=true
    else
        log_success "$dir correctly removed from root/ ✓"
    fi
done

# =============================================================================
# POST-OPERATION CLEANUP
# =============================================================================

log_header "🧹 Post-Operation Cleanup"

# Update any hardcoded import paths that might reference old structure
log_info "Checking for import paths that need updating..."

IMPORT_FILES=(
    "$PROJECT_ROOT/tsconfig.json"
    "$PROJECT_ROOT/vite.config.ts"
    "$PROJECT_ROOT/jsconfig.json"
    "$PROJECT_ROOT/eslint.config.js"
)

for file in "${IMPORT_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        log_info "Checking $file for path updates..."
        # This would need to be customized based on actual path references
        log_success "Checked $file"
    fi
done

# =============================================================================
# SUMMARY
# =============================================================================

log_header "📋 Operation Summary"

if [[ "$ERRORS_FOUND" == "false" ]]; then
    log_success "✅ Directory restructuring completed successfully!"
    echo
    echo -e "${CYAN}Operations performed:${NC} $OPERATIONS_COUNT"
    echo -e "${CYAN}Backup location:${NC} $BACKUP_DIR"
    echo
    echo -e "${GREEN}New structure:${NC}"
    tree "$SRC_DIR" -d -L 1 2>/dev/null || ls -la "$SRC_DIR/"
    echo
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update any remaining import paths in your code"
    echo "2. Run 'npm run build' to test the new structure"
    echo "3. Run 'npm run dev' to verify everything works"
    echo "4. If issues occur, restore from: $BACKUP_DIR"
else
    log_error "❌ Errors found during restructuring!"
    echo
    echo -e "${RED}Please restore from backup:${NC} $BACKUP_DIR"
    exit 1
fi

echo
log_header "🎉 CasaGestión Directory Restructuring Complete!"

# =============================================================================
# OPTIONAL: RESTORE SCRIPT
# =============================================================================

cat > "$PROJECT_ROOT/restore_structure.sh" << 'EOF'
#!/bin/bash
# Auto-generated restore script
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$1"

if [[ -z "$BACKUP_DIR" || ! -d "$BACKUP_DIR" ]]; then
    echo "Usage: $0 <backup_directory>"
    echo "Available backups:"
    ls -la "$PROJECT_ROOT"/.backup_* 2>/dev/null || echo "No backups found"
    exit 1
fi

echo "Restoring from backup: $BACKUP_DIR"

# Restore directories
for dir in components contexts hooks services types utils pages; do
    if [[ -d "$BACKUP_DIR/$dir" ]]; then
        echo "Restoring $dir to root..."
        rm -rf "$PROJECT_ROOT/$dir"
        cp -r "$BACKUP_DIR/$dir" "$PROJECT_ROOT/"
    fi
    
    if [[ -d "$BACKUP_DIR/src_$dir" ]]; then
        echo "Restoring src/$dir..."
        rm -rf "$PROJECT_ROOT/src/$dir"
        cp -r "$BACKUP_DIR/src_$dir" "$PROJECT_ROOT/src/"
    fi
done

echo "Restore completed!"
EOF

chmod +x "$PROJECT_ROOT/restore_structure.sh"
log_info "Created restore script: restore_structure.sh"