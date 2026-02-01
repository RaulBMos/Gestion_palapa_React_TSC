/**
 * Supabase Migration Panel
 * UI component to manage data migration from localStorage to Supabase
 * and monitor connection status
 */

import { useState, useEffect } from 'react';
import { Database, Cloud, HardDrive, ArrowRight, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { USE_SUPABASE, healthCheck } from '@/config/supabase';
import {
    migrateLocalStorageToSupabase,
    backupLocalStorage
} from '@/services/storageAdapter';
import { logInfo } from '@/utils/logger';

interface MigrationStatus {
    inProgress: boolean;
    completed: boolean;
    success: boolean;
    migrated: {
        clients: number;
        reservations: number;
        transactions: number;
    };
    errors: string[];
}

export function SupabaseMigrationPanel() {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
        inProgress: false,
        completed: false,
        success: false,
        migrated: { clients: 0, reservations: 0, transactions: 0 },
        errors: [],
    });

    // Check Supabase health on mount
    useEffect(() => {
        if (USE_SUPABASE) {
            checkHealth();
        }
    }, []);

    const checkHealth = async () => {
        setIsCheckingHealth(true);
        try {
            const healthy = await healthCheck();
            setIsHealthy(healthy);
        } catch {
            setIsHealthy(false);
        } finally {
            setIsCheckingHealth(false);
        }
    };

    const handleBackup = () => {
        const backup = backupLocalStorage();
        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `casagestion-backup-${backup.timestamp}.json`;
        link.click();
        URL.revokeObjectURL(url);

        logInfo('Backup created', { timestamp: backup.timestamp });
    };

    const handleMigration = async () => {
        if (!USE_SUPABASE) {
            alert('Supabase no está habilitado. Activa VITE_USE_SUPABASE=true en .env.local');
            return;
        }

        if (!isHealthy) {
            alert('Supabase no está disponible. Verifica tu configuración.');
            return;
        }

        const confirmed = window.confirm(
            '¿Estás seguro de migrar los datos de localStorage a Supabase?\n\n' +
            'Se recomienda hacer un backup primero.'
        );

        if (!confirmed) return;

        setMigrationStatus({
            inProgress: true,
            completed: false,
            success: false,
            migrated: { clients: 0, reservations: 0, transactions: 0 },
            errors: [],
        });

        try {
            const result = await migrateLocalStorageToSupabase();

            setMigrationStatus({
                inProgress: false,
                completed: true,
                success: result.success,
                migrated: result.migrated,
                errors: result.errors,
            });

            if (result.success) {
                alert(
                    `✅ Migración completada exitosamente!\n\n` +
                    `Clientes: ${result.migrated.clients}\n` +
                    `Reservaciones: ${result.migrated.reservations}\n` +
                    `Transacciones: ${result.migrated.transactions}`
                );
            } else {
                alert(
                    `⚠️ Migración completada con errores.\n\n` +
                    `Ver detalles en el panel.`
                );
            }
        } catch (error) {
            setMigrationStatus({
                inProgress: false,
                completed: true,
                success: false,
                migrated: { clients: 0, reservations: 0, transactions: 0 },
                errors: [String(error)],
            });
        }
    };

    if (!USE_SUPABASE) {
        return (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">
                            Supabase Deshabilitado
                        </h3>
                        <p className="text-sm text-yellow-700 mb-3">
                            Para habilitar Supabase, configura las siguientes variables en tu archivo <code className="px-1 py-0.5 bg-yellow-100 rounded">.env.local</code>:
                        </p>
                        <div className="bg-yellow-100 p-3 rounded text-xs font-mono text-yellow-900 mb-3">
                            VITE_SUPABASE_URL=tu_url_aqui<br />
                            VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui<br />
                            VITE_USE_SUPABASE=true
                        </div>
                        <p className="text-sm text-yellow-700">
                            Consulta <code className="px-1 py-0.5 bg-yellow-100 rounded">SUPABASE_SETUP.md</code> para instrucciones completas.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Health Status */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Cloud className="w-6 h-6 text-sky-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Estado de Supabase
                        </h3>
                    </div>
                    <button
                        onClick={checkHealth}
                        disabled={isCheckingHealth}
                        className="px-3 py-1.5 text-sm bg-sky-50 text-sky-700 rounded-md hover:bg-sky-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                        Verificar
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {isHealthy === null ? (
                        <>
                            <AlertCircle className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-600">Verificando conexión...</span>
                        </>
                    ) : isHealthy ? (
                        <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700 font-medium">Conectado y funcionando</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700 font-medium">Sin conexión</span>
                        </>
                    )}
                </div>

                {isHealthy === false && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        ⚠️ No se pudo conectar a Supabase. Verifica:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>URL y Anon Key en .env.local</li>
                            <li>Que estés autenticado (usuario creado)</li>
                            <li>Que las tablas existan (ejecuta schema.sql)</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Migration Panel */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <Database className="w-6 h-6 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Migración de Datos
                    </h3>
                </div>

                <div className="space-y-4">
                    {/* Step 1: Backup */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                                1
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                                Crear Backup (Recomendado)
                            </h4>
                            <p className="text-sm text-gray-600">
                                Descarga tus datos actuales como archivo JSON
                            </p>
                        </div>
                        <button
                            onClick={handleBackup}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <HardDrive className="w-4 h-4" />
                            Descargar Backup
                        </button>
                    </div>

                    {/* Step 2: Migrate */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold">
                                2
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                                Migrar a Supabase
                            </h4>
                            <p className="text-sm text-gray-600">
                                Copia todos los datos de localStorage a la nube
                            </p>
                        </div>
                        <button
                            onClick={handleMigration}
                            disabled={migrationStatus.inProgress || !isHealthy}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {migrationStatus.inProgress ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Migrando...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="w-4 h-4" />
                                    Iniciar Migración
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Migration Results */}
                {migrationStatus.completed && (
                    <div className={`mt-6 p-4 rounded-lg border ${migrationStatus.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            {migrationStatus.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <h4 className={`font-semibold mb-2 ${migrationStatus.success ? 'text-green-900' : 'text-yellow-900'
                                    }`}>
                                    {migrationStatus.success ? 'Migración Completada' : 'Migración con Errores'}
                                </h4>

                                <div className="space-y-2 text-sm">
                                    <div className={migrationStatus.success ? 'text-green-700' : 'text-yellow-700'}>
                                        <strong>Registros migrados:</strong>
                                        <ul className="list-disc list-inside ml-4 mt-1">
                                            <li>Clientes: {migrationStatus.migrated.clients}</li>
                                            <li>Reservaciones: {migrationStatus.migrated.reservations}</li>
                                            <li>Transacciones: {migrationStatus.migrated.transactions}</li>
                                        </ul>
                                    </div>

                                    {migrationStatus.errors.length > 0 && (
                                        <div className="mt-3">
                                            <strong className="text-red-700">Errores ({migrationStatus.errors.length}):</strong>
                                            <div className="mt-2 p-3 bg-white rounded border border-red-200 max-h-40 overflow-y-auto">
                                                {migrationStatus.errors.map((error, index) => (
                                                    <div key={index} className="text-xs text-red-600 mb-1 font-mono">
                                                        {error}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Panel */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Información Importante:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>La migración NO elimina tus datos de localStorage</li>
                            <li>Puedes ejecutar la migración múltiples veces (creará duplicados)</li>
                            <li>Después de migrar, cambia a Supabase editando .env.local</li>
                            <li>Consulta SUPABASE_SETUP.md para más detalles</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
