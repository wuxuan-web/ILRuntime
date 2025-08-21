#!/usr/bin/env node

/**
 * ILRuntime集成功能测试运行器
 * 用于自动化测试扩展功能
 */

const fs = require('fs');
const path = require('path');

class ILRuntimeTestRunner {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🚀 开始ILRuntime集成功能测试...\n');

        // 测试1: 检查扩展文件
        await this.testExtensionFiles();

        // 测试2: 检查编译输出
        await this.testCompilationOutput();

        // 测试3: 检查配置文件
        await this.testConfigurationFiles();

        // 测试4: 检查示例文件
        await this.testSampleFiles();

        // 输出测试结果
        this.printTestResults();
    }

    /**
     * 测试扩展文件
     */
    async testExtensionFiles() {
        this.testCount++;
        const testName = '扩展文件检查';
        
        try {
            const requiredFiles = [
                'src/extension.ts',
                'src/breakpointMapper.ts',
                'src/hotReloadManager.ts',
                'src/debugProtocolExtension.ts',
                'src/breakpointPersistence.ts',
                'src/ilruntimeIntegration.ts',
                'package.json',
                'tsconfig.json'
            ];

            let allFilesExist = true;
            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    console.log(`❌ 缺少文件: ${file}`);
                    allFilesExist = false;
                }
            }

            if (allFilesExist) {
                console.log(`✅ ${testName}: 所有必需文件都存在`);
                this.passedCount++;
                this.testResults.push({ name: testName, status: 'PASSED' });
            } else {
                console.log(`❌ ${testName}: 缺少必需文件`);
                this.failedCount++;
                this.testResults.push({ name: testName, status: 'FAILED' });
            }
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`);
            this.failedCount++;
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
        }
    }

    /**
     * 测试编译输出
     */
    async testCompilationOutput() {
        this.testCount++;
        const testName = '编译输出检查';
        
        try {
            const distFiles = [
                'dist/extension.js',
                'dist/extension.js.map'
            ];

            let allFilesExist = true;
            for (const file of distFiles) {
                if (!fs.existsSync(file)) {
                    console.log(`❌ 缺少编译文件: ${file}`);
                    allFilesExist = false;
                }
            }

            if (allFilesExist) {
                // 检查文件大小
                const stats = fs.statSync('dist/extension.js');
                const fileSizeKB = Math.round(stats.size / 1024);
                console.log(`✅ ${testName}: 编译文件存在 (大小: ${fileSizeKB}KB)`);
                this.passedCount++;
                this.testResults.push({ name: testName, status: 'PASSED', details: `文件大小: ${fileSizeKB}KB` });
            } else {
                console.log(`❌ ${testName}: 缺少编译文件`);
                this.failedCount++;
                this.testResults.push({ name: testName, status: 'FAILED' });
            }
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`);
            this.failedCount++;
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
        }
    }

    /**
     * 测试配置文件
     */
    async testConfigurationFiles() {
        this.testCount++;
        const testName = '配置文件检查';
        
        try {
            // 检查package.json
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // 检查必需的字段
            const requiredFields = ['name', 'version', 'contributes', 'activationEvents'];
            let allFieldsExist = true;
            
            for (const field of requiredFields) {
                if (!packageJson[field]) {
                    console.log(`❌ package.json缺少字段: ${field}`);
                    allFieldsExist = false;
                }
            }

            // 检查命令配置
            const commands = packageJson.contributes?.commands || [];
            const requiredCommands = [
                'extension.ilruntime-debug.hotReloadStatus',
                'extension.ilruntime-debug.manualHotReload',
                'extension.ilruntime-debug.syncBreakpoints',
                'extension.ilruntime-debug.showILRuntimeStatus'
            ];

            let allCommandsExist = true;
            for (const command of requiredCommands) {
                const exists = commands.some(cmd => cmd.command === command);
                if (!exists) {
                    console.log(`❌ 缺少命令: ${command}`);
                    allCommandsExist = false;
                }
            }

            if (allFieldsExist && allCommandsExist) {
                console.log(`✅ ${testName}: 配置文件正确 (${commands.length}个命令)`);
                this.passedCount++;
                this.testResults.push({ name: testName, status: 'PASSED', details: `${commands.length}个命令已配置` });
            } else {
                console.log(`❌ ${testName}: 配置文件有问题`);
                this.failedCount++;
                this.testResults.push({ name: testName, status: 'FAILED' });
            }
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`);
            this.failedCount++;
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
        }
    }

    /**
     * 测试示例文件
     */
    async testSampleFiles() {
        this.testCount++;
        const testName = '示例文件检查';
        
        try {
            const sampleFiles = [
                'test-samples/TestHotfix.cs',
                'UNITY-TEST-GUIDE.md',
                'HOT-RELOAD-TEST.md'
            ];

            let allFilesExist = true;
            for (const file of sampleFiles) {
                if (!fs.existsSync(file)) {
                    console.log(`❌ 缺少示例文件: ${file}`);
                    allFilesExist = false;
                }
            }

            if (allFilesExist) {
                console.log(`✅ ${testName}: 示例文件存在`);
                this.passedCount++;
                this.testResults.push({ name: testName, status: 'PASSED' });
            } else {
                console.log(`❌ ${testName}: 缺少示例文件`);
                this.failedCount++;
                this.testResults.push({ name: testName, status: 'FAILED' });
            }
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`);
            this.failedCount++;
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
        }
    }

    /**
     * 输出测试结果
     */
    printTestResults() {
        console.log('\n📊 测试结果汇总:');
        console.log('='.repeat(50));
        
        for (const result of this.testResults) {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            const details = result.details ? ` (${result.details})` : '';
            console.log(`${status} ${result.name}${details}`);
        }
        
        console.log('='.repeat(50));
        console.log(`总计: ${this.testCount} 个测试`);
        console.log(`通过: ${this.passedCount} 个`);
        console.log(`失败: ${this.failedCount} 个`);
        
        if (this.failedCount === 0) {
            console.log('\n🎉 所有测试通过！扩展已准备就绪。');
            console.log('\n📝 下一步操作:');
            console.log('1. 在VSCode中按 F5 启动扩展调试模式');
            console.log('2. 打开Unity项目进行实际测试');
            console.log('3. 参考 UNITY-TEST-GUIDE.md 进行详细测试');
        } else {
            console.log('\n⚠️  有测试失败，请检查相关问题。');
        }
    }
}

// 运行测试
if (require.main === module) {
    const runner = new ILRuntimeTestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = ILRuntimeTestRunner;
