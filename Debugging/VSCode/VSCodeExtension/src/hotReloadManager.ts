import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BreakpointMapper, CodeChangeInfo } from './breakpointMapper';
import { ILRuntimeIntegration, PatchGenerationResult, PatchApplicationResult } from './ilruntimeIntegration';

/**
 * 热更新配置
 */
export interface HotReloadConfig {
    dllPath: string; // 热更新DLL路径
    patchPath: string; // 补丁文件路径
    autoReload: boolean; // 是否自动重载
    watchPattern: string; // 监控文件模式
    sourceAssembly: string; // 源程序集路径
    targetAssembly: string; // 目标程序集路径
}

/**
 * 热更新状态
 */
export enum HotReloadStatus {
    Idle = 'idle',
    Watching = 'watching',
    Reloading = 'reloading',
    Error = 'error'
}

/**
 * 热更新事件
 */
export interface HotReloadEvent {
    type: 'started' | 'completed' | 'failed' | 'breakpoints-updated';
    timestamp: number;
    message?: string;
    error?: string;
    affectedFiles?: string[];
}

/**
 * 热更新管理器
 */
export class HotReloadManager {
    private config: HotReloadConfig;
    private status: HotReloadStatus = HotReloadStatus.Idle;
    private breakpointMapper: BreakpointMapper;
    private ilruntimeIntegration: ILRuntimeIntegration;
    private fileWatcher?: vscode.FileSystemWatcher;
    private statusBarItem?: vscode.StatusBarItem;
    private eventCallbacks: ((event: HotReloadEvent) => void)[] = [];

    constructor(breakpointMapper: BreakpointMapper, config: HotReloadConfig) {
        this.breakpointMapper = breakpointMapper;
        this.config = config;
        this.ilruntimeIntegration = new ILRuntimeIntegration(config.dllPath || '');
        this.initializeStatusBar();
        this.setupFileWatcher();
        this.setupCodeChangeHandler();
    }

    /**
     * 初始化状态栏
     */
    private initializeStatusBar(): void {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'extension.ilruntime-debug.hotReloadStatus';
        this.updateStatusBar();
    }

    /**
     * 设置文件监控
     */
    private setupFileWatcher(): void {
        if (this.config.autoReload) {
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(this.config.watchPattern);
            this.fileWatcher.onDidChange(this.handleFileChange.bind(this));
            this.status = HotReloadStatus.Watching;
            this.updateStatusBar();
        }
    }

    /**
     * 设置代码变更处理器
     */
    private setupCodeChangeHandler(): void {
        this.breakpointMapper.onCodeChange(this.handleCodeChange.bind(this));
    }

    /**
     * 处理文件变更
     */
    private async handleFileChange(uri: vscode.Uri): Promise<void> {
        const filePath = uri.fsPath;
        
        // 检查是否是热更新相关的文件
        if (this.isHotReloadFile(filePath)) {
            await this.performHotReload([filePath]);
        }
    }

    /**
     * 处理代码变更
     */
    private async handleCodeChange(change: CodeChangeInfo): Promise<void> {
        if (change.changeType === 'modified' && this.isHotReloadFile(change.filePath)) {
            // 延迟执行热更新，避免频繁触发
            setTimeout(() => {
                this.performHotReload([change.filePath]);
            }, 1000);
        }
    }

    /**
     * 检查是否是热更新相关文件
     */
    private isHotReloadFile(filePath: string): boolean {
        const fileName = path.basename(filePath);
        return fileName.endsWith('.cs') || 
               fileName.endsWith('.dll') || 
               fileName.endsWith('.patch');
    }

    /**
     * 执行热更新
     */
    public async performHotReload(affectedFiles?: string[]): Promise<void> {
        try {
            this.status = HotReloadStatus.Reloading;
            this.updateStatusBar();
            this.notifyEvent({
                type: 'started',
                timestamp: Date.now(),
                message: '开始热更新...',
                affectedFiles
            });

            // 1. 生成补丁文件
            const patchResult = await this.generatePatch(affectedFiles);
            if (!patchResult.success) {
                throw new Error(`Patch generation failed: ${patchResult.error}`);
            }

            // 2. 应用补丁到ILRuntime
            const applyResult = await this.applyPatch(patchResult.patchPath!);
            if (!applyResult.success) {
                throw new Error(`Patch application failed: ${applyResult.error}`);
            }

            // 3. 更新断点位置
            await this.updateBreakpoints(affectedFiles);

            this.status = HotReloadStatus.Watching;
            this.updateStatusBar();
            this.notifyEvent({
                type: 'completed',
                timestamp: Date.now(),
                message: '热更新完成',
                affectedFiles
            });

        } catch (error) {
            this.status = HotReloadStatus.Error;
            this.updateStatusBar();
            this.notifyEvent({
                type: 'failed',
                timestamp: Date.now(),
                message: '热更新失败',
                error: error instanceof Error ? error.message : String(error),
                affectedFiles
            });
        }
    }

    /**
     * 生成补丁文件
     */
    private async generatePatch(affectedFiles?: string[]): Promise<PatchGenerationResult> {
        if (!affectedFiles || affectedFiles.length === 0) {
            return {
                success: false,
                error: 'No files to patch'
            };
        }

        try {
            return await this.ilruntimeIntegration.generatePatch(
                this.config.sourceAssembly,
                affectedFiles,
                this.config.patchPath
            );
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 应用补丁到ILRuntime
     */
    private async applyPatch(patchPath: string): Promise<PatchApplicationResult> {
        try {
            return await this.ilruntimeIntegration.applyPatch(
                patchPath,
                this.config.targetAssembly
            );
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 更新断点位置
     */
    private async updateBreakpoints(affectedFiles?: string[]): Promise<void> {
        if (!affectedFiles) {
            return;
        }

        for (const filePath of affectedFiles) {
            const breakpoints = this.breakpointMapper.getBreakpointsForFile(filePath);
            
            for (const breakpoint of breakpoints) {
                try {
                    // 重新定位断点
                    const newLocation = await this.findNewBreakpointLocation(breakpoint);
                    if (newLocation) {
                        this.breakpointMapper.updateBreakpointLocation(breakpoint.id, newLocation);
                    } else {
                        // 如果找不到新位置，禁用断点
                        this.breakpointMapper.updateBreakpointLocation(breakpoint.id, { enabled: false });
                    }
                } catch (error) {
                    console.error(`Failed to update breakpoint ${breakpoint.id}:`, error);
                }
            }
        }

        this.notifyEvent({
            type: 'breakpoints-updated',
            timestamp: Date.now(),
            message: '断点位置已更新',
            affectedFiles
        });
    }

    /**
     * 查找断点的新位置
     */
    private async findNewBreakpointLocation(breakpoint: any): Promise<any> {
        // 这里应该实现更复杂的断点重定位算法
        // 暂时返回原位置
        return {
            line: breakpoint.line,
            column: breakpoint.column || 0
        };
    }

    /**
     * 获取ILRuntime集成状态
     */
    public async getILRuntimeStatus() {
        return await this.ilruntimeIntegration.getILRuntimeStatus();
    }

    /**
     * 获取补丁工具状态
     */
    public async getPatchToolStatus() {
        return await this.ilruntimeIntegration.getPatchToolStatus();
    }

    /**
     * 获取补丁历史
     */
    public async getPatchHistory() {
        return await this.ilruntimeIntegration.getPatchHistory();
    }

    /**
     * 清理补丁文件
     */
    public async cleanupPatchFiles(olderThanDays: number = 7) {
        await this.ilruntimeIntegration.cleanupPatchFiles(olderThanDays);
    }

    /**
     * 更新状态栏
     */
    private updateStatusBar(): void {
        if (!this.statusBarItem) {
            return;
        }

        const statusText = this.getStatusText();
        const statusIcon = this.getStatusIcon();
        
        this.statusBarItem.text = `${statusIcon} ${statusText}`;
        this.statusBarItem.tooltip = this.getStatusTooltip();
        this.statusBarItem.show();
    }

    /**
     * 获取状态文本
     */
    private getStatusText(): string {
        switch (this.status) {
            case HotReloadStatus.Idle:
                return '热更新: 空闲';
            case HotReloadStatus.Watching:
                return '热更新: 监控中';
            case HotReloadStatus.Reloading:
                return '热更新: 重载中';
            case HotReloadStatus.Error:
                return '热更新: 错误';
            default:
                return '热更新: 未知';
        }
    }

    /**
     * 获取状态图标
     */
    private getStatusIcon(): string {
        switch (this.status) {
            case HotReloadStatus.Idle:
                return '$(circle)';
            case HotReloadStatus.Watching:
                return '$(eye)';
            case HotReloadStatus.Reloading:
                return '$(sync~spin)';
            case HotReloadStatus.Error:
                return '$(error)';
            default:
                return '$(question)';
        }
    }

    /**
     * 获取状态提示
     */
    private getStatusTooltip(): string {
        switch (this.status) {
            case HotReloadStatus.Idle:
                return '热更新功能已停止';
            case HotReloadStatus.Watching:
                return '正在监控文件变更，自动热更新';
            case HotReloadStatus.Reloading:
                return '正在执行热更新...';
            case HotReloadStatus.Error:
                return '热更新过程中发生错误';
            default:
                return '热更新状态未知';
        }
    }

    /**
     * 注册事件回调
     */
    public onEvent(callback: (event: HotReloadEvent) => void): void {
        this.eventCallbacks.push(callback);
    }

    /**
     * 通知事件
     */
    private notifyEvent(event: HotReloadEvent): void {
        for (const callback of this.eventCallbacks) {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in event callback:', error);
            }
        }
    }

    /**
     * 获取当前状态
     */
    public getStatus(): HotReloadStatus {
        return this.status;
    }

    /**
     * 获取配置
     */
    public getConfig(): HotReloadConfig {
        return this.config;
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<HotReloadConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        // 重新设置文件监控
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        this.setupFileWatcher();
    }

    /**
     * 手动触发热更新
     */
    public async manualHotReload(): Promise<void> {
        await this.performHotReload();
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
        }
        this.eventCallbacks = [];
    }
}
