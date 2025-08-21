/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/*
 * extension.ts (and activateMockDebug.ts) forms the "plugin" that plugs into VS Code and contains the code that
 * connects VS Code with the debug adapter.
 * 
 * extension.ts contains code for launching the debug adapter in three different ways:
 * - as an external program communicating with VS Code via stdin/stdout,
 * - as a server process communicating with VS Code via sockets or named pipes, or
 * - as inlined code running in the extension itself (default).
 * 
 * Since the code in extension.ts uses node.js APIs it cannot run in the browser.
 */

'use strict';
import * as DGram from 'dgram';
import * as Net from 'net';
import * as vscode from 'vscode';
import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import { platform } from 'process';
import { ProviderResult } from 'vscode';
import { MockDebugSession } from './mockDebug';
import { activateMockDebug, workspaceFileAccessor } from './activateMockDebug';
import { BreakpointMapper } from './breakpointMapper';
import { HotReloadManager, HotReloadConfig } from './hotReloadManager';
import { DebugProtocolExtension } from './debugProtocolExtension';
import * as path from 'path';
import * as fs from 'fs';
import * as Path from 'path';
import * as Fs from 'fs';
// import { DebugSession } from '@vscode/debugadapter';

/*
 * The compile time flag 'runMode' controls how the debug adapter is run.
 * Please note: the test suite only supports 'external' mode.
 */
const runMode: 'external' | 'server' | 'namedPipeServer' | 'inline' = 'external';
let socket : DGram.Socket;
const maximumActiveTime : number  = 3000;
let activeServers :Map<string, ServerInfo> = new Map<string, ServerInfo>();

class BufferReader{
	private buffer: Buffer;
    private	offset: number = 0;

	constructor(buffer:Buffer){
		this.buffer = buffer;
	}

	readString():string{
		let len = this.buffer.readInt16LE(this.offset);
		this.offset= this.offset + 2;
		let res= this.buffer.toString(undefined, this.offset, this.offset+len);
		this.offset= this.offset + len;
		return res;
	}

	readInt():number{
		let res = this.buffer.readInt32LE(this.offset);
		this.offset = this.offset + 4;
		return res;
	}
}
export class ServerInfo{
	private address : string;
	private lastActive : number;
	private project : string;
	private machineName : string;
	private processId : number;
	private port : number;
	
	constructor(msg:Buffer, rInfo : DGram.RemoteInfo){
		let reader = new BufferReader(msg);
		this.project = reader.readString();
		this.machineName = reader.readString();
		this.processId = reader.readInt();
		this.port = reader.readInt();
		this.address = rInfo.address + ":" + this.port;
		this.lastActive = Date.now();
	}

	getAddress():string{
		return this.address;
	}

	getProject():string{
		return this.project;
	}

	getMachine():string{
		return this.machineName;
	}

	getProcessId():number{
		return this.processId;
	}

	isExipired():boolean{
		let pastTime = Date.now() - this.lastActive;
		return pastTime > maximumActiveTime;
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('🚀 ILRuntime扩展激活中...');
	console.log(`📁 工作区路径: ${vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '未设置'}`);
	
	let config = vscode.workspace.getConfiguration('ilruntime');
	console.log(`⚙️  ILRuntime配置:`, JSON.stringify(config, null, 2));
	activeServers.clear();
	
	// 尝试连接到Unity的TCP调试服务
	let port = config.get("broadcastPort") as number;
	console.log(`🔧 尝试连接到Unity调试服务，端口: ${port}`);
	
	// 创建TCP连接
	const client = Net.createConnection(port, 'localhost', () => {
		console.log(`✅ 已连接到Unity调试服务: localhost:${port}`);
		
		// 创建服务器信息
		let serverInfo = new ServerInfo(Buffer.from('Unity Debug Service'), { 
			address: 'localhost', 
			port: port,
			family: 'IPv4',
			size: 0
		});
		activeServers.set(serverInfo.getAddress(), serverInfo);
		console.log(`✅ 服务器信息已添加: ${serverInfo.getAddress()}`);
		console.log(`📊 当前活跃服务器数量: ${activeServers.size}`);
	});
	
	client.on('error', (err) => {
		console.error('❌ 连接Unity调试服务失败:', err.message);
		console.log('💡 请确保Unity项目正在运行，并且调试服务已启动');
	});
	
	client.on('close', () => {
		console.log('🔌 与Unity调试服务的连接已关闭');
	});
	
	// 保持UDP监听作为备用
	socket = DGram.createSocket("udp4");
	
	socket.on("message", function (msg, rinfo) {
		console.log(`📡 收到UDP消息: ${rinfo.address}:${rinfo.port}`);
		let serverInfo = new ServerInfo(msg, rinfo);
		activeServers.set(serverInfo.getAddress(), serverInfo);
		console.log(`✅ 服务器信息已添加: ${serverInfo.getAddress()}`);
	});
	
	socket.on("error", function (err) {
		console.error('❌ UDP监听错误:', err);
	});
	
	socket.on("listening", function () {
		const address = socket.address();
		console.log(`🎯 UDP监听已启动: ${address.address}:${address.port}`);
	});
	
	socket.bind(port);

	// 初始化热更新功能
	initializeHotReload(context);
	
    // debug adapters can be run in different ways by using a vscode.DebugAdapterDescriptorFactory:
	switch (runMode) {
		case 'server':
			// run the debug adapter as a server inside the extension and communicate via a socket
			activateMockDebug(context, activeServers, new MockDebugAdapterServerDescriptorFactory());
			break;

		case 'namedPipeServer':
			// run the debug adapter as a server inside the extension and communicate via a named pipe (Windows) or UNIX domain socket (non-Windows)
			activateMockDebug(context, activeServers, new MockDebugAdapterNamedPipeServerDescriptorFactory());
			break;

		case 'external': default:
			// run the debug adapter as a separate process
			activateMockDebug(context, activeServers, new DebugAdapterExecutableFactory());
			break;

		case 'inline':
			// run the debug adapter inside the extension and directly talk to it
			activateMockDebug(context, activeServers);
			break;
	}
}

// 热更新管理器实例
let hotReloadManager: HotReloadManager | undefined;
let breakpointMapper: BreakpointMapper | undefined;
let debugProtocolExtension: DebugProtocolExtension | undefined;

/**
 * 查找热更新程序集
 */
function findHotfixAssembly(workspacePath: string): string {
	// 常见的ILRuntime Demo项目结构
	const possiblePaths = [
		path.join(workspacePath, 'HotfixAOT', 'bin', 'Debug', 'net9.0', 'HotfixAOT.dll'),
		path.join(workspacePath, 'HotfixAOT', 'bin', 'Release', 'net9.0', 'HotfixAOT.dll'),
		path.join(workspacePath, 'Hotfix', 'bin', 'Debug', 'net9.0', 'Hotfix.dll'),
		path.join(workspacePath, 'Hotfix', 'bin', 'Release', 'net9.0', 'Hotfix.dll'),
		path.join(workspacePath, 'Assets', 'StreamingAssets', 'HotfixAOT.dll'),
		path.join(workspacePath, 'Assets', 'StreamingAssets', 'Hotfix.dll')
	];
	
	for (const dllPath of possiblePaths) {
		if (fs.existsSync(dllPath)) {
			return dllPath;
		}
	}
	
	// 如果找不到，返回默认路径
	return path.join(workspacePath, 'HotfixAOT', 'bin', 'Debug', 'net9.0', 'HotfixAOT.dll');
}

/**
 * 初始化热更新功能
 */
function initializeHotReload(context: vscode.ExtensionContext): void {
	try {
		// 获取工作区路径
		const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
		
		// 创建断点映射器
		breakpointMapper = new BreakpointMapper(workspacePath);
		
		// 创建热更新配置
		const hotReloadConfig: HotReloadConfig = {
			dllPath: workspacePath, // 工作区路径
			patchPath: path.join(workspacePath, 'Patches'), // 补丁文件路径
			autoReload: true,
			watchPattern: '**/*.cs',
			sourceAssembly: findHotfixAssembly(workspacePath), // 自动查找热更新程序集
			targetAssembly: findHotfixAssembly(workspacePath) // 自动查找热更新程序集
		};
		
		// 创建热更新管理器
		hotReloadManager = new HotReloadManager(breakpointMapper, hotReloadConfig);
		
		// 创建调试协议扩展
		debugProtocolExtension = new DebugProtocolExtension(breakpointMapper, hotReloadManager);
		
		// 注册热更新事件处理
		hotReloadManager.onEvent((event) => {
			console.log('Hot reload event:', event);
			
			// 显示通知
			switch (event.type) {
				case 'started':
					vscode.window.showInformationMessage(`热更新开始: ${event.message}`);
					break;
				case 'completed':
					vscode.window.showInformationMessage(`热更新完成: ${event.message}`);
					break;
				case 'failed':
					vscode.window.showErrorMessage(`热更新失败: ${event.error}`);
					break;
				case 'breakpoints-updated':
					vscode.window.showInformationMessage(`断点已更新: ${event.message}`);
					break;
			}
		});
		
		// 注册命令
		context.subscriptions.push(
			vscode.commands.registerCommand('extension.ilruntime-debug.hotReloadStatus', () => {
				if (hotReloadManager) {
					const status = hotReloadManager.getStatus();
					const config = hotReloadManager.getConfig();
					vscode.window.showInformationMessage(
						`热更新状态: ${status}\n配置: ${JSON.stringify(config, null, 2)}`
					);
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.manualHotReload', async () => {
				if (hotReloadManager) {
					try {
						await hotReloadManager.manualHotReload();
						vscode.window.showInformationMessage('手动热更新完成');
					} catch (error) {
						vscode.window.showErrorMessage(`手动热更新失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.syncBreakpoints', async () => {
				if (breakpointMapper && hotReloadManager) {
					try {
						await hotReloadManager.manualHotReload();
						vscode.window.showInformationMessage('断点同步完成');
					} catch (error) {
						vscode.window.showErrorMessage(`断点同步失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.exportBreakpoints', async () => {
				if (breakpointMapper) {
					try {
						const uri = await vscode.window.showSaveDialog({
							filters: { 'JSON Files': ['json'] }
						});
						
						if (uri) {
							const success = await breakpointMapper.exportBreakpoints(uri.fsPath);
							if (success) {
								vscode.window.showInformationMessage('断点配置导出成功');
							} else {
								vscode.window.showErrorMessage('断点配置导出失败');
							}
						}
					} catch (error) {
						vscode.window.showErrorMessage(`导出失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.importBreakpoints', async () => {
				if (breakpointMapper) {
					try {
						const uris = await vscode.window.showOpenDialog({
							filters: { 'JSON Files': ['json'] },
							canSelectMany: false
						});
						
						if (uris && uris.length > 0) {
							const success = await breakpointMapper.importBreakpoints(uris[0].fsPath);
							if (success) {
								vscode.window.showInformationMessage('断点配置导入成功');
							} else {
								vscode.window.showErrorMessage('断点配置导入失败');
							}
						}
					} catch (error) {
						vscode.window.showErrorMessage(`导入失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.backupBreakpoints', async () => {
				if (breakpointMapper) {
					try {
						const backupPath = await breakpointMapper.backupBreakpoints();
						if (backupPath) {
							vscode.window.showInformationMessage(`断点配置已备份到: ${backupPath}`);
						} else {
							vscode.window.showErrorMessage('断点配置备份失败');
						}
					} catch (error) {
						vscode.window.showErrorMessage(`备份失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.showBreakpointInfo', async () => {
				if (breakpointMapper) {
					try {
						const configInfo = await breakpointMapper.getConfigInfo();
						const message = configInfo.exists 
							? `断点配置文件: ${configInfo.path}\n断点数量: ${configInfo.breakpointCount}\n最后修改: ${new Date(configInfo.lastModified || 0).toLocaleString()}`
							: '未找到断点配置文件';
						vscode.window.showInformationMessage(message);
					} catch (error) {
						vscode.window.showErrorMessage(`获取配置信息失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.showILRuntimeStatus', async () => {
				if (hotReloadManager) {
					try {
						const ilruntimeStatus = await hotReloadManager.getILRuntimeStatus();
						const patchToolStatus = await hotReloadManager.getPatchToolStatus();
						
						let message = 'ILRuntime集成状态:\n';
						message += `ILRuntime: ${ilruntimeStatus.available ? '可用' : '不可用'}\n`;
						if (ilruntimeStatus.path) message += `路径: ${ilruntimeStatus.path}\n`;
						message += `补丁工具: ${patchToolStatus.available ? '可用' : '不可用'}\n`;
						if (patchToolStatus.path) message += `路径: ${patchToolStatus.path}`;
						
						vscode.window.showInformationMessage(message);
					} catch (error) {
						vscode.window.showErrorMessage(`获取ILRuntime状态失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.showPatchHistory', async () => {
				if (hotReloadManager) {
					try {
						const history = await hotReloadManager.getPatchHistory();
						if (history.length === 0) {
							vscode.window.showInformationMessage('没有补丁历史记录');
						} else {
							const message = `补丁历史 (共${history.length}个):\n` + 
								history.slice(0, 5).map(patch => 
									`- ${new Date(patch.timestamp).toLocaleString()}: ${patch.types.length}个类型`
								).join('\n');
							vscode.window.showInformationMessage(message);
						}
					} catch (error) {
						vscode.window.showErrorMessage(`获取补丁历史失败: ${error}`);
					}
				}
			}),
			
			vscode.commands.registerCommand('extension.ilruntime-debug.cleanupPatches', async () => {
				if (hotReloadManager) {
					try {
						await hotReloadManager.cleanupPatchFiles(7);
						vscode.window.showInformationMessage('已清理7天前的补丁文件');
					} catch (error) {
						vscode.window.showErrorMessage(`清理补丁文件失败: ${error}`);
					}
				}
			})
		);
		
		console.log('Hot reload functionality initialized successfully');
		
	} catch (error) {
		console.error('Failed to initialize hot reload functionality:', error);
		vscode.window.showErrorMessage(`热更新功能初始化失败: ${error}`);
	}
}

export function deactivate() {
	// 清理热更新资源
	if (hotReloadManager) {
		hotReloadManager.dispose();
		hotReloadManager = undefined;
	}
	
	if (breakpointMapper) {
		breakpointMapper.dispose();
		breakpointMapper = undefined;
	}
	
	if (debugProtocolExtension) {
		debugProtocolExtension.dispose();
		debugProtocolExtension = undefined;
	}
	
	// 清理原有资源
	if(socket !== null){
		socket.close();
	}
	activeServers.clear();	
}
export let currentSession : vscode.DebugSession;
class DebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {

	createDebugAdapterDescriptor(_session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): ProviderResult<vscode.DebugAdapterDescriptor> {
		console.log('🔧 创建ILRuntime调试适配器描述符...');
		console.log(`📋 会话配置:`, JSON.stringify(_session.configuration, null, 2));
		console.log(`📋 会话类型: ${_session.type}`);
		console.log(`📋 会话名称: ${_session.name}`);
		
		currentSession = _session;
		
		// 获取ILRuntime配置
		let config = vscode.workspace.getConfiguration('ilruntime');
		let program = config.get("debugAdapterPath") as string;
		console.log(`🔍 配置的调试适配器路径: ${program}`);
		console.log(`📁 当前目录: ${process.cwd()}`);
		console.log(`📁 __dirname: ${__dirname}`);
		console.log(`📁 扩展根目录: ${Path.dirname(__dirname)}`);
		
		// 如果配置中没有路径，尝试自动查找
		if (!program) {
			console.log('🔍 配置中未指定路径，尝试自动查找...');
			
					// 获取扩展根目录 - 尝试多种方式
		let extensionRoot = '';
		const possibleRoots = [
			Path.dirname(__dirname), // 从dist目录向上
			Path.dirname(Path.dirname(__dirname)), // 从dist目录向上两级
			Path.resolve(__dirname, '../..'), // 相对路径
			Path.resolve(process.cwd(), '../VSCodeDAILRuntime').replace('/VSCodeDAILRuntime', '') // 从当前工作目录
		];
		
		for (const root of possibleRoots) {
			const testPath = Path.join(root, 'VSCodeDAILRuntime', 'bin', 'Debug', 'net9.0', 'osx-arm64', 'VSCodeDAILRuntime');
			if (Fs.existsSync(testPath)) {
				extensionRoot = root;
				console.log(`✅ 找到扩展根目录: ${extensionRoot}`);
				break;
			}
		}
		
		if (!extensionRoot) {
			console.log('⚠️  无法确定扩展根目录，使用备用方案');
			extensionRoot = Path.dirname(__dirname);
		}
		
		console.log(`📁 扩展根目录: ${extensionRoot}`);
		
		const possiblePaths = [
			// 从扩展根目录
			Path.join(extensionRoot, 'VSCodeDAILRuntime', 'bin', 'Debug', 'net9.0', 'osx-arm64', 'VSCodeDAILRuntime'),
			Path.join(extensionRoot, 'VSCodeDAILRuntime', 'bin', 'Debug', 'net6.0', 'osx-arm64', 'VSCodeDAILRuntime'),
			Path.join(extensionRoot, 'VSCodeDAILRuntime', 'bin', 'Release', 'net9.0', 'osx-arm64', 'VSCodeDAILRuntime'),
			Path.join(extensionRoot, 'VSCodeDAILRuntime', 'bin', 'Release', 'net6.0', 'osx-arm64', 'VSCodeDAILRuntime'),
			// 从当前工作目录
			Path.resolve(process.cwd(), '../VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/VSCodeDAILRuntime'),
			Path.resolve(process.cwd(), '../VSCodeDAILRuntime/bin/Debug/net6.0/osx-arm64/VSCodeDAILRuntime'),
			// 从__dirname
			Path.resolve(__dirname, '../VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/VSCodeDAILRuntime'),
			Path.resolve(__dirname, '../VSCodeDAILRuntime/bin/Debug/net6.0/osx-arm64/VSCodeDAILRuntime'),
			// 绝对路径
			'/Users/newuser/Project/ILRuntime/Debugging/VSCode/VSCodeDAILRuntime/bin/Debug/net9.0/osx-arm64/VSCodeDAILRuntime'
		];
			
			for (const fullPath of possiblePaths) {
				console.log(`🔍 检查路径: ${fullPath}`);
				if (Fs.existsSync(fullPath)) {
					console.log(`✅ 找到调试适配器: ${fullPath}`);
					program = fullPath;
					break;
				}
			}
		}
		
		if (!program) {
			console.error('❌ 未找到调试适配器程序');
			throw new Error('未找到调试适配器程序，请检查配置或确保已编译VSCodeDAILRuntime');
		}
		
		// 检查文件是否存在
		if (!Fs.existsSync(program)) {
			console.error(`❌ 调试适配器文件不存在: ${program}`);
			throw new Error(`调试适配器文件不存在: ${program}`);
		}
		
		console.log(`✅ 调试适配器文件存在: ${program}`);
		console.log(`📊 文件大小: ${Fs.statSync(program).size} 字节`);
		console.log(`📊 文件权限: ${Fs.statSync(program).mode.toString(8)}`);
		
		// 检查文件是否可执行
		try {
			Fs.accessSync(program, Fs.constants.X_OK);
			console.log('✅ 文件具有执行权限');
		} catch (error) {
			console.warn('⚠️  文件没有执行权限，尝试添加...');
			try {
				Fs.chmodSync(program, 0o755);
				console.log('✅ 已添加执行权限');
			} catch (chmodError) {
				console.error('❌ 无法添加执行权限:', chmodError);
			}
		}
		
		// 创建调试适配器可执行文件
		const args: string[] = [];
		const options = {
			cwd: Path.dirname(program),
			env: { 
				...process.env,
				"ILRUNTIME_DEBUG": "1"
			}
		};
		
		console.log(`🚀 启动调试适配器: ${program}`);
		console.log(`📁 工作目录: ${options.cwd}`);
		console.log(`🔧 参数: ${args.join(' ')}`);
		
		executable = new vscode.DebugAdapterExecutable(program, args, options);
		
		// make VS Code launch the DA executable
		return executable;
	}
}

class MockDebugAdapterServerDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {

	private server?: Net.Server;

	createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {

		if (!this.server) {
			// start listening on a random port
			this.server = Net.createServer(socket => {
				const session = new MockDebugSession(workspaceFileAccessor);
				session.setRunAsServer(true);
				session.start(socket as NodeJS.ReadableStream, socket);
			}).listen(0);
		}

		// make VS Code connect to debug server
		return new vscode.DebugAdapterServer((this.server.address() as Net.AddressInfo).port);
	}

	dispose() {
		if (this.server) {
			this.server.close();
		}
	}
}

class MockDebugAdapterNamedPipeServerDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {

	private server?: Net.Server;

	createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {

		if (!this.server) {
			// start listening on a random named pipe path
			const pipeName = randomBytes(10).toString('utf8');
			const pipePath = platform === "win32" ? join('\\\\.\\pipe\\', pipeName) : join(tmpdir(), pipeName);

			this.server = Net.createServer(socket => {
				const session = new MockDebugSession(workspaceFileAccessor);
				session.setRunAsServer(true);
				session.start(<NodeJS.ReadableStream>socket, socket);
			}).listen(pipePath);
		}

		// make VS Code connect to debug server
		return new vscode.DebugAdapterNamedPipeServer(this.server.address() as string);
	}

	dispose() {
		if (this.server) {
			this.server.close();
		}
	}
}
