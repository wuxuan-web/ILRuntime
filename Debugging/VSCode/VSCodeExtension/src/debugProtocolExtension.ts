import * as vscode from 'vscode';
import { BreakpointMapper, BreakpointLocation } from './breakpointMapper';
import { HotReloadManager, HotReloadEvent } from './hotReloadManager';

/**
 * 热更新调试命令
 */
export interface HotReloadDebugCommand {
    type: 'hotReload' | 'syncBreakpoints' | 'getBreakpointStatus' | 'updateBreakpoint';
    data?: any;
}

/**
 * 热更新调试响应
 */
export interface HotReloadDebugResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * 断点状态信息
 */
export interface BreakpointStatus {
    id: string;
    filePath: string;
    line: number;
    column?: number;
    enabled: boolean;
    valid: boolean;
    lastModified: number;
    methodSignature?: string;
}

/**
 * 调试协议扩展管理器
 */
export class DebugProtocolExtension {
    private breakpointMapper: BreakpointMapper;
    private hotReloadManager: HotReloadManager;
    private customRequestHandlers: Map<string, (args: any) => Promise<any>> = new Map();

    constructor(breakpointMapper: BreakpointMapper, hotReloadManager: HotReloadManager) {
        this.breakpointMapper = breakpointMapper;
        this.hotReloadManager = hotReloadManager;
        this.initializeCustomRequests();
    }

    /**
     * 初始化自定义请求处理器
     */
    private initializeCustomRequests(): void {
        // 热更新命令
        this.customRequestHandlers.set('hotReload', this.handleHotReload.bind(this));
        
        // 同步断点命令
        this.customRequestHandlers.set('syncBreakpoints', this.handleSyncBreakpoints.bind(this));
        
        // 获取断点状态命令
        this.customRequestHandlers.set('getBreakpointStatus', this.handleGetBreakpointStatus.bind(this));
        
        // 更新断点命令
        this.customRequestHandlers.set('updateBreakpoint', this.handleUpdateBreakpoint.bind(this));
        
        // 获取热更新状态命令
        this.customRequestHandlers.set('getHotReloadStatus', this.handleGetHotReloadStatus.bind(this));
        
        // 获取断点列表命令
        this.customRequestHandlers.set('getBreakpoints', this.handleGetBreakpoints.bind(this));
    }

    /**
     * 处理自定义请求
     */
    public async handleCustomRequest(command: string, args: any): Promise<any> {
        const handler = this.customRequestHandlers.get(command);
        if (handler) {
            try {
                return await handler(args);
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        } else {
            return {
                success: false,
                error: `Unknown command: ${command}`
            };
        }
    }

    /**
     * 处理热更新命令
     */
    private async handleHotReload(args: any): Promise<HotReloadDebugResponse> {
        try {
            const affectedFiles = args.affectedFiles || [];
            await this.hotReloadManager.performHotReload(affectedFiles);
            
            return {
                success: true,
                data: {
                    message: 'Hot reload completed successfully',
                    affectedFiles
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 处理同步断点命令
     */
    private async handleSyncBreakpoints(args: any): Promise<HotReloadDebugResponse> {
        try {
            const breakpoints = this.breakpointMapper.getAllBreakpoints();
            const updatedBreakpoints: BreakpointStatus[] = [];

            for (const breakpoint of breakpoints) {
                try {
                    // 重新验证断点位置
                    const isValid = await this.validateBreakpointLocation(breakpoint);
                    if (!isValid) {
                        // 尝试重定位断点
                        const newLocation = await this.relocateBreakpoint(breakpoint);
                        if (newLocation) {
                            this.breakpointMapper.updateBreakpointLocation(breakpoint.id, newLocation);
                        } else {
                            this.breakpointMapper.updateBreakpointLocation(breakpoint.id, { enabled: false });
                        }
                    }

                    updatedBreakpoints.push(this.createBreakpointStatus(breakpoint));
                } catch (error) {
                    console.error(`Failed to sync breakpoint ${breakpoint.id}:`, error);
                }
            }

            return {
                success: true,
                data: {
                    message: 'Breakpoints synchronized successfully',
                    breakpoints: updatedBreakpoints
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 处理获取断点状态命令
     */
    private async handleGetBreakpointStatus(args: any): Promise<HotReloadDebugResponse> {
        try {
            const breakpointId = args.breakpointId;
            if (!breakpointId) {
                return {
                    success: false,
                    error: 'Breakpoint ID is required'
                };
            }

            const breakpoint = this.breakpointMapper.getBreakpoint(breakpointId);
            if (!breakpoint) {
                return {
                    success: false,
                    error: 'Breakpoint not found'
                };
            }

            const isValid = await this.validateBreakpointLocation(breakpoint);
            const status = this.createBreakpointStatus(breakpoint);
            status.valid = isValid;

            return {
                success: true,
                data: status
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 处理更新断点命令
     */
    private async handleUpdateBreakpoint(args: any): Promise<HotReloadDebugResponse> {
        try {
            const { breakpointId, updates } = args;
            if (!breakpointId || !updates) {
                return {
                    success: false,
                    error: 'Breakpoint ID and updates are required'
                };
            }

            const success = this.breakpointMapper.updateBreakpointLocation(breakpointId, updates);
            if (!success) {
                return {
                    success: false,
                    error: 'Failed to update breakpoint'
                };
            }

            const breakpoint = this.breakpointMapper.getBreakpoint(breakpointId);
            const status = this.createBreakpointStatus(breakpoint!);

            return {
                success: true,
                data: {
                    message: 'Breakpoint updated successfully',
                    breakpoint: status
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 处理获取热更新状态命令
     */
    private async handleGetHotReloadStatus(args: any): Promise<HotReloadDebugResponse> {
        try {
            const status = this.hotReloadManager.getStatus();
            const config = this.hotReloadManager.getConfig();

            return {
                success: true,
                data: {
                    status,
                    config,
                    timestamp: Date.now()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 处理获取断点列表命令
     */
    private async handleGetBreakpoints(args: any): Promise<HotReloadDebugResponse> {
        try {
            const breakpoints = this.breakpointMapper.getAllBreakpoints();
            const breakpointStatuses: BreakpointStatus[] = [];

            for (const breakpoint of breakpoints) {
                const isValid = await this.validateBreakpointLocation(breakpoint);
                const status = this.createBreakpointStatus(breakpoint);
                status.valid = isValid;
                breakpointStatuses.push(status);
            }

            return {
                success: true,
                data: {
                    breakpoints: breakpointStatuses,
                    count: breakpointStatuses.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 验证断点位置是否有效
     */
    private async validateBreakpointLocation(breakpoint: BreakpointLocation): Promise<boolean> {
        try {
            const fs = require('fs');
            const content = await fs.promises.readFile(breakpoint.filePath, 'utf8');
            const lines = content.split('\n');
            
            if (breakpoint.line > lines.length) {
                return false;
            }

            const lineContent = lines[breakpoint.line - 1];
            return lineContent.trim().length > 0 && !lineContent.trim().startsWith('//');
        } catch (error) {
            return false;
        }
    }

    /**
     * 重定位断点
     */
    private async relocateBreakpoint(breakpoint: BreakpointLocation): Promise<Partial<BreakpointLocation> | null> {
        try {
            const fs = require('fs');
            const content = await fs.promises.readFile(breakpoint.filePath, 'utf8');
            const lines = content.split('\n');
            
            // 在附近查找有效位置
            const searchRange = 10;
            for (let offset = 1; offset <= searchRange; offset++) {
                // 向上搜索
                const upLine = breakpoint.line - offset;
                if (upLine > 0 && this.isValidBreakpointLine(lines[upLine - 1])) {
                    return { line: upLine, column: 0 };
                }
                
                // 向下搜索
                const downLine = breakpoint.line + offset;
                if (downLine <= lines.length && this.isValidBreakpointLine(lines[downLine - 1])) {
                    return { line: downLine, column: 0 };
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
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
     * 创建断点状态对象
     */
    private createBreakpointStatus(breakpoint: BreakpointLocation): BreakpointStatus {
        return {
            id: breakpoint.id,
            filePath: breakpoint.filePath,
            line: breakpoint.line,
            column: breakpoint.column,
            enabled: breakpoint.enabled,
            valid: true, // 将在调用时更新
            lastModified: breakpoint.lastModified,
            methodSignature: breakpoint.methodSignature
        };
    }

    /**
     * 获取支持的自定义请求列表
     */
    public getSupportedCustomRequests(): string[] {
        return Array.from(this.customRequestHandlers.keys());
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        this.customRequestHandlers.clear();
    }
}
