import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BreakpointLocation } from './breakpointMapper';

/**
 * 断点配置版本信息
 */
export interface BreakpointConfigVersion {
    version: string;
    timestamp: number;
    description: string;
}

/**
 * 断点配置数据
 */
export interface BreakpointConfig {
    version: BreakpointConfigVersion;
    breakpoints: BreakpointLocation[];
    workspacePath: string;
    lastModified: number;
}

/**
 * 断点持久化管理器
 */
export class BreakpointPersistence {
    private readonly configFileName = '.ilruntime-breakpoints.json';
    private readonly configVersion = '1.0.0';
    private workspacePath: string;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
    }

    /**
     * 保存断点配置
     */
    public async saveBreakpoints(breakpoints: BreakpointLocation[]): Promise<boolean> {
        try {
            const config: BreakpointConfig = {
                version: {
                    version: this.configVersion,
                    timestamp: Date.now(),
                    description: 'ILRuntime Hot Reload Breakpoint Configuration'
                },
                breakpoints: breakpoints.map(bp => this.sanitizeBreakpoint(bp)),
                workspacePath: this.workspacePath,
                lastModified: Date.now()
            };

            const configPath = this.getConfigFilePath();
            const configDir = path.dirname(configPath);

            // 确保目录存在
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            // 写入配置文件
            await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
            
            console.log(`Breakpoints saved to: ${configPath}`);
            return true;
        } catch (error) {
            console.error('Failed to save breakpoints:', error);
            return false;
        }
    }

    /**
     * 加载断点配置
     */
    public async loadBreakpoints(): Promise<BreakpointLocation[]> {
        try {
            const configPath = this.getConfigFilePath();
            
            if (!fs.existsSync(configPath)) {
                console.log('No breakpoint configuration file found');
                return [];
            }

            const configData = await fs.promises.readFile(configPath, 'utf8');
            const config: BreakpointConfig = JSON.parse(configData);

            // 验证配置版本
            if (!this.validateConfigVersion(config.version)) {
                console.warn('Breakpoint configuration version mismatch, migrating...');
                return await this.migrateConfig(config);
            }

            // 验证工作区路径
            if (config.workspacePath !== this.workspacePath) {
                console.warn('Workspace path changed, filtering breakpoints...');
                return this.filterBreakpointsForWorkspace(config.breakpoints);
            }

            console.log(`Loaded ${config.breakpoints.length} breakpoints from: ${configPath}`);
            return config.breakpoints;
        } catch (error) {
            console.error('Failed to load breakpoints:', error);
            return [];
        }
    }

    /**
     * 导出断点配置
     */
    public async exportBreakpoints(breakpoints: BreakpointLocation[], exportPath: string): Promise<boolean> {
        try {
            const config: BreakpointConfig = {
                version: {
                    version: this.configVersion,
                    timestamp: Date.now(),
                    description: 'ILRuntime Hot Reload Breakpoint Configuration (Exported)'
                },
                breakpoints: breakpoints.map(bp => this.sanitizeBreakpoint(bp)),
                workspacePath: this.workspacePath,
                lastModified: Date.now()
            };

            const exportDir = path.dirname(exportPath);
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            await fs.promises.writeFile(exportPath, JSON.stringify(config, null, 2), 'utf8');
            
            console.log(`Breakpoints exported to: ${exportPath}`);
            return true;
        } catch (error) {
            console.error('Failed to export breakpoints:', error);
            return false;
        }
    }

    /**
     * 导入断点配置
     */
    public async importBreakpoints(importPath: string): Promise<BreakpointLocation[]> {
        try {
            if (!fs.existsSync(importPath)) {
                throw new Error(`Import file not found: ${importPath}`);
            }

            const configData = await fs.promises.readFile(importPath, 'utf8');
            const config: BreakpointConfig = JSON.parse(configData);

            // 验证配置版本
            if (!this.validateConfigVersion(config.version)) {
                console.warn('Import configuration version mismatch, migrating...');
                return await this.migrateConfig(config);
            }

            // 调整断点路径以匹配当前工作区
            const adjustedBreakpoints = this.adjustBreakpointPaths(config.breakpoints, config.workspacePath);

            console.log(`Imported ${adjustedBreakpoints.length} breakpoints from: ${importPath}`);
            return adjustedBreakpoints;
        } catch (error) {
            console.error('Failed to import breakpoints:', error);
            return [];
        }
    }

    /**
     * 备份断点配置
     */
    public async backupBreakpoints(breakpoints: BreakpointLocation[]): Promise<string | null> {
        try {
            const backupDir = path.join(this.workspacePath, '.ilruntime-backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `breakpoints-${timestamp}.json`);

            await this.exportBreakpoints(breakpoints, backupPath);
            return backupPath;
        } catch (error) {
            console.error('Failed to backup breakpoints:', error);
            return null;
        }
    }

    /**
     * 清理旧的备份文件
     */
    public async cleanupOldBackups(maxBackups: number = 10): Promise<void> {
        try {
            const backupDir = path.join(this.workspacePath, '.ilruntime-backups');
            if (!fs.existsSync(backupDir)) {
                return;
            }

            const files = await fs.promises.readdir(backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('breakpoints-') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    stats: fs.statSync(path.join(backupDir, file))
                }))
                .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

            // 删除多余的备份文件
            for (let i = maxBackups; i < backupFiles.length; i++) {
                await fs.promises.unlink(backupFiles[i].path);
                console.log(`Deleted old backup: ${backupFiles[i].name}`);
            }
        } catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }

    /**
     * 获取配置文件路径
     */
    private getConfigFilePath(): string {
        return path.join(this.workspacePath, '.vscode', this.configFileName);
    }

    /**
     * 清理断点数据（移除敏感信息）
     */
    private sanitizeBreakpoint(breakpoint: BreakpointLocation): BreakpointLocation {
        return {
            id: breakpoint.id,
            filePath: breakpoint.filePath,
            line: breakpoint.line,
            column: breakpoint.column,
            condition: breakpoint.condition,
            hitCount: breakpoint.hitCount,
            enabled: breakpoint.enabled,
            methodSignature: breakpoint.methodSignature,
            className: breakpoint.className,
            methodName: breakpoint.methodName,
            lastModified: breakpoint.lastModified
        };
    }

    /**
     * 验证配置版本
     */
    private validateConfigVersion(version: BreakpointConfigVersion): boolean {
        return version.version === this.configVersion;
    }

    /**
     * 迁移配置（处理版本不匹配）
     */
    private async migrateConfig(config: BreakpointConfig): Promise<BreakpointLocation[]> {
        // 这里可以实现配置版本迁移逻辑
        // 暂时返回原始断点数据
        console.log('Config migration not implemented, using original data');
        return config.breakpoints;
    }

    /**
     * 过滤工作区断点
     */
    private filterBreakpointsForWorkspace(breakpoints: BreakpointLocation[]): BreakpointLocation[] {
        return breakpoints.filter(bp => {
            try {
                const relativePath = path.relative(this.workspacePath, bp.filePath);
                return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
            } catch {
                return false;
            }
        });
    }

    /**
     * 调整断点路径以匹配当前工作区
     */
    private adjustBreakpointPaths(breakpoints: BreakpointLocation[], originalWorkspacePath: string): BreakpointLocation[] {
        return breakpoints.map(bp => {
            try {
                const relativePath = path.relative(originalWorkspacePath, bp.filePath);
                const newPath = path.join(this.workspacePath, relativePath);
                return { ...bp, filePath: newPath };
            } catch {
                return bp;
            }
        });
    }

    /**
     * 获取配置信息
     */
    public async getConfigInfo(): Promise<{
        exists: boolean;
        path: string;
        lastModified?: number;
        breakpointCount?: number;
    }> {
        const configPath = this.getConfigFilePath();
        const exists = fs.existsSync(configPath);

        if (!exists) {
            return { exists, path: configPath };
        }

        try {
            const stats = fs.statSync(configPath);
            const configData = await fs.promises.readFile(configPath, 'utf8');
            const config: BreakpointConfig = JSON.parse(configData);

            return {
                exists,
                path: configPath,
                lastModified: stats.mtime.getTime(),
                breakpointCount: config.breakpoints.length
            };
        } catch (error) {
            return { exists, path: configPath };
        }
    }

    /**
     * 删除配置文件
     */
    public async deleteConfig(): Promise<boolean> {
        try {
            const configPath = this.getConfigFilePath();
            if (fs.existsSync(configPath)) {
                await fs.promises.unlink(configPath);
                console.log(`Deleted breakpoint configuration: ${configPath}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete breakpoint configuration:', error);
            return false;
        }
    }
}
