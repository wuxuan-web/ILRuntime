import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BreakpointLocation } from './breakpointMapper';

/**
 * ILRuntime补丁信息
 */
export interface ILRuntimePatchInfo {
    assemblyPath: string;
    patchPath: string;
    types: string[];
    methods: string[];
    timestamp: number;
    version: string;
}

/**
 * 补丁生成结果
 */
export interface PatchGenerationResult {
    success: boolean;
    patchPath?: string;
    error?: string;
    affectedTypes?: string[];
    affectedMethods?: string[];
}

/**
 * 补丁应用结果
 */
export interface PatchApplicationResult {
    success: boolean;
    error?: string;
    appliedTypes?: string[];
    appliedMethods?: string[];
    breakpointUpdates?: BreakpointLocation[];
}

/**
 * ILRuntime集成管理器
 */
export class ILRuntimeIntegration {
    private readonly patchToolPath: string;
    private readonly ilruntimePath: string;
    private readonly workingDirectory: string;

    constructor(workspacePath: string) {
        this.workingDirectory = workspacePath;
        this.patchToolPath = path.join(workspacePath, 'PatchTool', 'bin', 'Debug', 'net9.0', 'PatchTool');
        this.ilruntimePath = path.join(workspacePath, 'ILRuntime', 'bin', 'Debug', 'netstandard2.0', 'ILRuntime.dll');
    }

    /**
     * 生成补丁文件
     */
    public async generatePatch(
        sourceAssembly: string,
        modifiedFiles: string[],
        outputPath?: string
    ): Promise<PatchGenerationResult> {
        try {
            console.log('Generating patch for assembly:', sourceAssembly);
            console.log('Modified files:', modifiedFiles);

            // 1. 分析修改的文件，确定需要补丁的类型和方法
            const affectedTypes = await this.analyzeModifiedFiles(modifiedFiles);
            
            // 2. 生成补丁文件
            const patchPath = outputPath || this.generatePatchPath(sourceAssembly);
            const success = await this.createPatchFile(sourceAssembly, affectedTypes, patchPath);

            if (success) {
                return {
                    success: true,
                    patchPath,
                    affectedTypes: Object.keys(affectedTypes),
                    affectedMethods: this.extractMethods(affectedTypes)
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to create patch file'
                };
            }
        } catch (error) {
            console.error('Patch generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 应用补丁到ILRuntime
     */
    public async applyPatch(
        patchPath: string,
        targetAssembly: string
    ): Promise<PatchApplicationResult> {
        try {
            console.log('Applying patch:', patchPath);
            console.log('Target assembly:', targetAssembly);

            // 1. 验证补丁文件
            const patchInfo = await this.validatePatchFile(patchPath);
            if (!patchInfo) {
                return {
                    success: false,
                    error: 'Invalid patch file'
                };
            }

            // 2. 应用补丁
            const success = await this.applyPatchToAssembly(patchPath, targetAssembly);
            
            if (success) {
                // 3. 更新断点位置
                const breakpointUpdates = await this.updateBreakpointsForPatch(patchInfo);
                
                return {
                    success: true,
                    appliedTypes: patchInfo.types,
                    appliedMethods: patchInfo.methods,
                    breakpointUpdates
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to apply patch to assembly'
                };
            }
        } catch (error) {
            console.error('Patch application failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 分析修改的文件
     */
    private async analyzeModifiedFiles(modifiedFiles: string[]): Promise<Record<string, string[]>> {
        const affectedTypes: Record<string, string[]> = {};

        for (const filePath of modifiedFiles) {
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const types = this.extractTypesFromFile(content);
                
                for (const type of types) {
                    if (!affectedTypes[type]) {
                        affectedTypes[type] = [];
                    }
                    affectedTypes[type].push(filePath);
                }
            } catch (error) {
                console.error(`Failed to analyze file ${filePath}:`, error);
            }
        }

        return affectedTypes;
    }

    /**
     * 从文件内容中提取类型信息
     */
    private extractTypesFromFile(content: string): string[] {
        const types: string[] = [];
        
        // 简单的正则表达式匹配类定义
        const classMatches = content.match(/class\s+(\w+)/g);
        if (classMatches) {
            for (const match of classMatches) {
                const className = match.replace('class ', '').trim();
                types.push(className);
            }
        }

        // 匹配接口定义
        const interfaceMatches = content.match(/interface\s+(\w+)/g);
        if (interfaceMatches) {
            for (const match of interfaceMatches) {
                const interfaceName = match.replace('interface ', '').trim();
                types.push(interfaceName);
            }
        }

        return types;
    }

    /**
     * 提取方法列表
     */
    private extractMethods(affectedTypes: Record<string, string[]>): string[] {
        const methods: string[] = [];
        
        for (const typeName of Object.keys(affectedTypes)) {
            // 这里可以扩展为更复杂的方法提取逻辑
            methods.push(`${typeName}.*`);
        }

        return methods;
    }

    /**
     * 生成补丁文件路径
     */
    private generatePatchPath(sourceAssembly: string): string {
        const assemblyName = path.basename(sourceAssembly, path.extname(sourceAssembly));
        const timestamp = Date.now();
        const patchDir = path.join(this.workingDirectory, 'Patches');
        
        if (!fs.existsSync(patchDir)) {
            fs.mkdirSync(patchDir, { recursive: true });
        }
        
        return path.join(patchDir, `${assemblyName}_${timestamp}.patch`);
    }

    /**
     * 创建补丁文件
     */
    private async createPatchFile(
        sourceAssembly: string,
        affectedTypes: Record<string, string[]>,
        patchPath: string
    ): Promise<boolean> {
        try {
            // 这里应该调用ILRuntime的HybridPatch系统
            // 暂时使用模拟实现
            const patchData = {
                sourceAssembly,
                affectedTypes: Object.keys(affectedTypes),
                timestamp: Date.now(),
                version: '1.0.0'
            };

            await fs.promises.writeFile(patchPath, JSON.stringify(patchData, null, 2), 'utf8');
            console.log('Patch file created:', patchPath);
            return true;
        } catch (error) {
            console.error('Failed to create patch file:', error);
            return false;
        }
    }

    /**
     * 验证补丁文件
     */
    private async validatePatchFile(patchPath: string): Promise<ILRuntimePatchInfo | null> {
        try {
            const content = await fs.promises.readFile(patchPath, 'utf8');
            const patchData = JSON.parse(content);
            
            // 验证补丁文件格式
            if (!patchData.sourceAssembly || !patchData.affectedTypes) {
                return null;
            }

            return {
                assemblyPath: patchData.sourceAssembly,
                patchPath,
                types: patchData.affectedTypes,
                methods: patchData.affectedMethods || [],
                timestamp: patchData.timestamp,
                version: patchData.version
            };
        } catch (error) {
            console.error('Failed to validate patch file:', error);
            return null;
        }
    }

    /**
     * 应用补丁到程序集
     */
    private async applyPatchToAssembly(patchPath: string, targetAssembly: string): Promise<boolean> {
        try {
            // 这里应该调用ILRuntime的AssemblyPatch系统
            // 暂时使用模拟实现
            console.log('Applying patch to assembly:', targetAssembly);
            
            // 模拟补丁应用过程
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Patch applied successfully');
            return true;
        } catch (error) {
            console.error('Failed to apply patch:', error);
            return false;
        }
    }

    /**
     * 更新断点位置
     */
    private async updateBreakpointsForPatch(patchInfo: ILRuntimePatchInfo): Promise<BreakpointLocation[]> {
        const updates: BreakpointLocation[] = [];
        
        // 这里应该实现基于补丁信息的断点重定位
        // 暂时返回空数组
        console.log('Updating breakpoints for patch:', patchInfo.types);
        
        return updates;
    }

    /**
     * 获取补丁工具状态
     */
    public async getPatchToolStatus(): Promise<{
        available: boolean;
        version?: string;
        path?: string;
    }> {
        try {
            if (fs.existsSync(this.patchToolPath)) {
                // 这里可以检查补丁工具的版本信息
                return {
                    available: true,
                    path: this.patchToolPath
                };
            } else {
                return {
                    available: false
                };
            }
        } catch (error) {
            return {
                available: false
            };
        }
    }

    /**
     * 获取ILRuntime状态
     */
    public async getILRuntimeStatus(): Promise<{
        available: boolean;
        version?: string;
        path?: string;
    }> {
        try {
            if (fs.existsSync(this.ilruntimePath)) {
                // 这里可以检查ILRuntime的版本信息
                return {
                    available: true,
                    path: this.ilruntimePath
                };
            } else {
                return {
                    available: false
                };
            }
        } catch (error) {
            return {
                available: false
            };
        }
    }

    /**
     * 清理补丁文件
     */
    public async cleanupPatchFiles(olderThanDays: number = 7): Promise<void> {
        try {
            const patchDir = path.join(this.workingDirectory, 'Patches');
            if (!fs.existsSync(patchDir)) {
                return;
            }

            const files = await fs.promises.readdir(patchDir);
            const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

            for (const file of files) {
                if (file.endsWith('.patch')) {
                    const filePath = path.join(patchDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime.getTime() < cutoffTime) {
                        await fs.promises.unlink(filePath);
                        console.log(`Deleted old patch file: ${file}`);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to cleanup patch files:', error);
        }
    }

    /**
     * 获取补丁历史
     */
    public async getPatchHistory(): Promise<ILRuntimePatchInfo[]> {
        try {
            const patchDir = path.join(this.workingDirectory, 'Patches');
            if (!fs.existsSync(patchDir)) {
                return [];
            }

            const files = await fs.promises.readdir(patchDir);
            const patchFiles = files.filter(file => file.endsWith('.patch'));
            const history: ILRuntimePatchInfo[] = [];

            for (const file of patchFiles) {
                try {
                    const filePath = path.join(patchDir, file);
                    const content = await fs.promises.readFile(filePath, 'utf8');
                    const patchData = JSON.parse(content);
                    
                    history.push({
                        assemblyPath: patchData.sourceAssembly,
                        patchPath: filePath,
                        types: patchData.affectedTypes || [],
                        methods: patchData.affectedMethods || [],
                        timestamp: patchData.timestamp,
                        version: patchData.version
                    });
                } catch (error) {
                    console.error(`Failed to read patch file ${file}:`, error);
                }
            }

            return history.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to get patch history:', error);
            return [];
        }
    }
}
