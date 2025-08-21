import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BreakpointPersistence } from './breakpointPersistence';

/**
 * 断点位置信息
 */
export interface BreakpointLocation {
    id: string;
    filePath: string;
    line: number;
    column?: number;
    condition?: string;
    hitCount?: number;
    enabled: boolean;
    methodSignature?: string; // 方法签名，用于重定位
    className?: string; // 类名，用于重定位
    methodName?: string; // 方法名，用于重定位
    lastModified: number; // 最后修改时间
}

/**
 * 代码变更信息
 */
export interface CodeChangeInfo {
    filePath: string;
    changeType: 'modified' | 'added' | 'deleted';
    timestamp: number;
    methodSignatures?: string[]; // 变更的方法签名
}

/**
 * 断点映射管理器
 */
export class BreakpointMapper {
    private breakpoints: Map<string, BreakpointLocation> = new Map();
    private fileWatchers: Map<string, vscode.FileSystemWatcher> = new Map();
    private changeCallbacks: ((change: CodeChangeInfo) => void)[] = [];
    private persistence: BreakpointPersistence;

    constructor(workspacePath?: string) {
        this.persistence = new BreakpointPersistence(workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '');
        this.initializeFileWatchers();
        this.loadBreakpoints();
    }

    /**
     * 添加断点
     */
    public addBreakpoint(location: Omit<BreakpointLocation, 'id' | 'lastModified'>): string {
        const id = this.generateBreakpointId(location);
        const breakpoint: BreakpointLocation = {
            ...location,
            id,
            lastModified: Date.now()
        };

        this.breakpoints.set(id, breakpoint);
        this.saveBreakpoints();
        return id;
    }

    /**
     * 移除断点
     */
    public removeBreakpoint(id: string): boolean {
        const removed = this.breakpoints.delete(id);
        if (removed) {
            this.saveBreakpoints();
        }
        return removed;
    }

    /**
     * 获取断点
     */
    public getBreakpoint(id: string): BreakpointLocation | undefined {
        return this.breakpoints.get(id);
    }

    /**
     * 获取文件的所有断点
     */
    public getBreakpointsForFile(filePath: string): BreakpointLocation[] {
        return Array.from(this.breakpoints.values())
            .filter(bp => bp.filePath === filePath);
    }

    /**
     * 获取所有断点
     */
    public getAllBreakpoints(): BreakpointLocation[] {
        return Array.from(this.breakpoints.values());
    }

    /**
     * 更新断点位置（用于热更新后的重定位）
     */
    public updateBreakpointLocation(id: string, newLocation: Partial<BreakpointLocation>): boolean {
        const breakpoint = this.breakpoints.get(id);
        if (!breakpoint) {
            return false;
        }

        Object.assign(breakpoint, newLocation, { lastModified: Date.now() });
        this.saveBreakpoints();
        return true;
    }

    /**
     * 生成断点ID
     */
    private generateBreakpointId(location: Omit<BreakpointLocation, 'id' | 'lastModified'>): string {
        const hash = `${location.filePath}:${location.line}:${location.column || 0}`;
        return `bp_${this.hashCode(hash)}_${Date.now()}`;
    }

    /**
     * 简单的哈希函数
     */
    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash);
    }

    /**
     * 初始化文件监控
     */
    private initializeFileWatchers(): void {
        // 监控工作区中的C#文件
        const pattern = '**/*.cs';
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        watcher.onDidChange(this.handleFileChange.bind(this));
        watcher.onDidCreate(this.handleFileCreate.bind(this));
        watcher.onDidDelete(this.handleFileDelete.bind(this));
    }

    /**
     * 处理文件变更
     */
    private handleFileChange(uri: vscode.Uri): void {
        const filePath = uri.fsPath;
        const changeInfo: CodeChangeInfo = {
            filePath,
            changeType: 'modified',
            timestamp: Date.now()
        };

        this.notifyChangeCallbacks(changeInfo);
        this.relocateBreakpoints(filePath);
    }

    /**
     * 处理文件创建
     */
    private handleFileCreate(uri: vscode.Uri): void {
        const filePath = uri.fsPath;
        const changeInfo: CodeChangeInfo = {
            filePath,
            changeType: 'added',
            timestamp: Date.now()
        };

        this.notifyChangeCallbacks(changeInfo);
    }

    /**
     * 处理文件删除
     */
    private handleFileDelete(uri: vscode.Uri): void {
        const filePath = uri.fsPath;
        const changeInfo: CodeChangeInfo = {
            filePath,
            changeType: 'deleted',
            timestamp: Date.now()
        };

        this.notifyChangeCallbacks(changeInfo);
        this.removeBreakpointsForFile(filePath);
    }

    /**
     * 重定位文件的断点
     */
    private async relocateBreakpoints(filePath: string): Promise<void> {
        const breakpoints = this.getBreakpointsForFile(filePath);
        
        for (const breakpoint of breakpoints) {
            try {
                const newLocation = await this.findNewLocation(breakpoint);
                if (newLocation) {
                    this.updateBreakpointLocation(breakpoint.id, newLocation);
                } else {
                    // 如果找不到新位置，禁用断点
                    this.updateBreakpointLocation(breakpoint.id, { enabled: false });
                }
            } catch (error) {
                console.error(`Failed to relocate breakpoint ${breakpoint.id}:`, error);
            }
        }
    }

    /**
     * 查找断点的新位置
     */
    private async findNewLocation(breakpoint: BreakpointLocation): Promise<Partial<BreakpointLocation> | null> {
        try {
            const content = await fs.promises.readFile(breakpoint.filePath, 'utf8');
            const lines = content.split('\n');
            
            // 简单的行号匹配（可以扩展为更复杂的算法）
            if (breakpoint.line <= lines.length) {
                const lineContent = lines[breakpoint.line - 1];
                
                // 检查是否是有效的位置（不是空行或注释）
                if (lineContent.trim() && !lineContent.trim().startsWith('//')) {
                    return {
                        line: breakpoint.line,
                        column: breakpoint.column || 0
                    };
                }
            }
            
            // 尝试在附近查找合适的位置
            return this.findNearestValidLocation(lines, breakpoint.line);
        } catch (error) {
            console.error(`Error reading file ${breakpoint.filePath}:`, error);
            return null;
        }
    }

    /**
     * 在附近查找有效位置
     */
    private findNearestValidLocation(lines: string[], originalLine: number): Partial<BreakpointLocation> | null {
        const searchRange = 10; // 搜索范围：前后10行
        
        for (let offset = 1; offset <= searchRange; offset++) {
            // 向上搜索
            const upLine = originalLine - offset;
            if (upLine > 0 && this.isValidBreakpointLine(lines[upLine - 1])) {
                return { line: upLine, column: 0 };
            }
            
            // 向下搜索
            const downLine = originalLine + offset;
            if (downLine <= lines.length && this.isValidBreakpointLine(lines[downLine - 1])) {
                return { line: downLine, column: 0 };
            }
        }
        
        return null;
    }

    /**
     * 检查是否是有效的断点行
     */
    private isValidBreakpointLine(lineContent: string): boolean {
        const trimmed = lineContent.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('//') && 
               !trimmed.startsWith('/*') && 
               !trimmed.startsWith('*') && 
               !trimmed.startsWith('*/');
    }

    /**
     * 移除文件的所有断点
     */
    private removeBreakpointsForFile(filePath: string): void {
        const breakpoints = this.getBreakpointsForFile(filePath);
        for (const breakpoint of breakpoints) {
            this.breakpoints.delete(breakpoint.id);
        }
        this.saveBreakpoints();
    }

    /**
     * 注册变更回调
     */
    public onCodeChange(callback: (change: CodeChangeInfo) => void): void {
        this.changeCallbacks.push(callback);
    }

    /**
     * 通知变更回调
     */
    private notifyChangeCallbacks(change: CodeChangeInfo): void {
        for (const callback of this.changeCallbacks) {
            try {
                callback(change);
            } catch (error) {
                console.error('Error in change callback:', error);
            }
        }
    }

    /**
     * 保存断点到本地存储
     */
    private async saveBreakpoints(): Promise<void> {
        const breakpointsData = Array.from(this.breakpoints.values());
        await this.persistence.saveBreakpoints(breakpointsData);
    }

    /**
     * 从本地存储加载断点
     */
    public async loadBreakpoints(): Promise<void> {
        try {
            const breakpoints = await this.persistence.loadBreakpoints();
            this.breakpoints.clear();
            
            for (const breakpoint of breakpoints) {
                this.breakpoints.set(breakpoint.id, breakpoint);
            }
            
            console.log(`Loaded ${breakpoints.length} breakpoints from persistence`);
        } catch (error) {
            console.error('Failed to load breakpoints:', error);
        }
    }

    /**
     * 导出断点配置
     */
    public async exportBreakpoints(exportPath: string): Promise<boolean> {
        const breakpointsData = Array.from(this.breakpoints.values());
        return await this.persistence.exportBreakpoints(breakpointsData, exportPath);
    }

    /**
     * 导入断点配置
     */
    public async importBreakpoints(importPath: string): Promise<boolean> {
        try {
            const breakpoints = await this.persistence.importBreakpoints(importPath);
            this.breakpoints.clear();
            
            for (const breakpoint of breakpoints) {
                this.breakpoints.set(breakpoint.id, breakpoint);
            }
            
            await this.saveBreakpoints();
            console.log(`Imported ${breakpoints.length} breakpoints`);
            return true;
        } catch (error) {
            console.error('Failed to import breakpoints:', error);
            return false;
        }
    }

    /**
     * 备份断点配置
     */
    public async backupBreakpoints(): Promise<string | null> {
        const breakpointsData = Array.from(this.breakpoints.values());
        return await this.persistence.backupBreakpoints(breakpointsData);
    }

    /**
     * 获取配置信息
     */
    public async getConfigInfo() {
        return await this.persistence.getConfigInfo();
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        for (const watcher of this.fileWatchers.values()) {
            watcher.dispose();
        }
        this.fileWatchers.clear();
        this.breakpoints.clear();
        this.changeCallbacks = [];
    }
}
