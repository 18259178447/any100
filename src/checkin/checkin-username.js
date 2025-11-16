/**
 * AnyRouter 登录签到模块
 * 通过 API 调用方式实现登录和签到
 */

import { chromium } from 'playwright';
import {
	applyStealthToContext,
	getStealthArgs,
	getIgnoreDefaultArgs,
} from '../utils/playwright-stealth.js';
import { fileURLToPath } from 'url';

class AnyRouterSignIn {
	constructor() {
		this.baseUrl = 'https://anyrouter.top';
	}

	/**
	 * 生成随机延迟时间（模拟真人操作）
	 */
	getRandomDelay(min = 500, max = 1500) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	 * 等待随机时间
	 */
	async randomDelay(min = 500, max = 1500) {
		const delay = this.getRandomDelay(min, max);
		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	/**
	 * 通过 API 调用方式实现登录和签到
	 * @param {string} username - 用户名或邮箱
	 * @param {string} password - 密码
	 * @returns {Object|null} - { session: string, apiUser: string, userInfo: object }
	 */
	async loginAndGetSession(username, password) {
		console.log(`[登录签到] 开始处理账号: ${username}`);

		let browser = null;
		let context = null;
		let page = null;

		try {
			console.log('[浏览器] 启动 Chromium 浏览器（已启用反检测）...');

			// 启动浏览器（非持久化模式）
			browser = await chromium.launch({
				headless: true,
				args: getStealthArgs(),
				ignoreDefaultArgs: getIgnoreDefaultArgs(),
			});

			// 创建浏览器上下文
			context = await browser.newContext({
				viewport: { width: 1920, height: 1080 },
				userAgent:
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				locale: 'zh-CN',
				timezoneId: 'Asia/Shanghai',
				deviceScaleFactor: 1,
				isMobile: false,
				hasTouch: false,
				permissions: ['geolocation', 'notifications'],
				colorScheme: 'light',
			});

			// 应用反检测脚本到上下文
			await applyStealthToContext(context);

			// 创建新页面
			page = await context.newPage();

			// 步骤1: 打开首页，等待页面加载完成并稳定
			console.log('[页面] 访问首页，等待页面稳定...');
			await page.goto(this.baseUrl, {
				waitUntil: 'networkidle',
				timeout: 600000,
			});

			// 等待页面完全稳定
			await this.randomDelay(2000, 3000);

			// 步骤1.5: 查看并打印当前 cookies 和 localStorage
			console.log('[调试] 登录前的浏览器状态:');
			const beforeLoginState = await page.evaluate(() => {

				// 获取 localStorage
				const localStorageData = {};
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					localStorageData[key] = localStorage.getItem(key);
				}

				return {
					localStorage: localStorageData,
				};
			});
			const cookies2 = await context.cookies();

			console.log('[Cookies] 登录前 cookies:', cookies2);
			console.log('[localStorage] 登录前 localStorage:', JSON.stringify(beforeLoginState.localStorage, null, 2));

			// 步骤2: 调用登录接口（使用 page.evaluate + fetch）
			console.log('[API] 调用登录接口...', "2" + username + "1", "2" + password + "2");
			const loginResult = await page.evaluate(
				async ({ baseUrl, username, password }) => {
					try {
						const requestHeaders = {
							'Content-Type': 'application/json',
						};

						const response = await fetch(`${baseUrl}/api/user/login?turnstile=`, {
							method: 'POST',
							headers: requestHeaders,
							body: JSON.stringify({ username, password }),
							credentials: 'include', // 重要：确保接收 cookies
						});

						// 获取响应头（只能访问允许的响应头）
						const responseHeaders = {};
						response.headers.forEach((value, key) => {
							responseHeaders[key] = value;
						});

						const data = await response.json();

						return {
							success: response.ok,
							status: response.status,
							data: data,
							requestHeaders: requestHeaders,
							responseHeaders: responseHeaders,
						};
					} catch (error) {
						return {
							success: false,
							error: error.message,
						};
					}
				},
				{ baseUrl: this.baseUrl, username, password }
			);

			// 打印请求和响应头部
			if (loginResult.requestHeaders) {
				console.log('[请求头] 登录接口请求头:', JSON.stringify(loginResult.requestHeaders, null, 2));
			}
			if (loginResult.responseHeaders) {
				console.log('[响应头] 登录接口响应头:', JSON.stringify(loginResult.responseHeaders, null, 2));
			}

			if (!loginResult.success) {
				console.log(`[错误] 登录接口调用失败: ${loginResult.error || loginResult.status}`);
				return null;
			}

			if (!loginResult.data.success) {
				console.log(`[错误] 登录失败: ${loginResult.data.message || '未知原因'}`);
				return null;
			}

			const apiUser = loginResult.data.data?.id;
			if (!apiUser) {
				console.log('[错误] 登录响应中未找到用户 ID');
				return null;
			}

			console.log(`[成功] 登录成功，用户ID: ${apiUser}`);

			// 从浏览器 cookies 中获取 session
			const cookies = await context.cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');

			if (!sessionCookie) {
				console.log('[错误] 未能从 cookies 中获取 session');
				return null;
			}

			console.log('[成功] 获取到 session cookie');

			// 步骤3: 调用签到接口
			console.log('[API] 调用签到接口...');
			const signInResult = await page.evaluate(
				async ({ baseUrl, apiUser }) => {
					try {
						const requestHeaders = {
							'Content-Type': 'application/json',
							'new-api-user': String(apiUser),
							referer: `${baseUrl}/console`,
						};

						const response = await fetch(`${baseUrl}/api/user/sign_in`, {
							method: 'POST',
							headers: requestHeaders,
							credentials: 'include',
						});

						// 获取响应头
						const responseHeaders = {};
						response.headers.forEach((value, key) => {
							responseHeaders[key] = value;
						});

						const data = await response.json();

						return {
							success: response.ok,
							data: data,
							requestHeaders: requestHeaders,
							responseHeaders: responseHeaders,
						};
					} catch (error) {
						return {
							success: false,
							error: error.message,
						};
					}
				},
				{ baseUrl: this.baseUrl, apiUser }
			);

			// 打印请求和响应头部
			if (signInResult.requestHeaders) {
				console.log('[请求头] 签到接口请求头:', JSON.stringify(signInResult.requestHeaders, null, 2));
			}
			if (signInResult.responseHeaders) {
				console.log('[响应头] 签到接口响应头:', JSON.stringify(signInResult.responseHeaders, null, 2));
			}

			if (signInResult.success && signInResult.data.success) {
				console.log('[签到] 签到成功！');
			} else {
				console.log(
					`[签到] 签到失败: ${signInResult.data?.message || signInResult.error || '未知原因'}`
				);
			}

			// 步骤4: 获取用户信息（以这里的用户信息为准）
			console.log('[API] 获取用户信息...');
			const userInfoResult = await page.evaluate(
				async ({ baseUrl, apiUser }) => {
					try {
						const response = await fetch(`${baseUrl}/api/user/self`, {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								'new-api-user': String(apiUser),
								referer: `${baseUrl}/console`,
							},
							credentials: 'include',
						});

						const data = await response.json();

						return {
							success: response.ok,
							data: data,
						};
					} catch (error) {
						return {
							success: false,
							error: error.message,
						};
					}
				},
				{ baseUrl: this.baseUrl, apiUser }
			);

			let userData = null;
			if (userInfoResult.success && userInfoResult.data.success) {
				userData = userInfoResult.data.data;
				console.log(`[信息] 用户ID: ${userData.id}`);
				console.log(`[信息] 用户名: ${userData.username}`);
				console.log(`[信息] 邮箱: ${userData.email}`);
				console.log(`[信息] 余额: $${(userData.quota / 500000).toFixed(2)}`);
				console.log(`[信息] 已使用: $${(userData.used_quota / 500000).toFixed(2)}`);
				console.log(`[信息] 推广码: ${userData.aff_code}`);
			} else {
				console.log(
					`[警告] 获取用户信息失败: ${userInfoResult.data?.message || userInfoResult.error || '未知原因'}`
				);
				// 使用登录接口返回的用户数据作为备用
				userData = loginResult.data.data;
			}

			// 返回结果
			console.log('[成功] 成功获取 session 和 api_user');
			return {
				session: sessionCookie.value,
				apiUser: String(apiUser),
				userInfo: userData,
			};
		} catch (error) {
			console.log(`[错误] 登录过程发生错误: ${error.message}`);
			return null;
		} finally {
			// 清理资源
			try {
				if (page && !page.isClosed()) await page.close();
				if (context) await context.close();
				if (browser) await browser.close();
				console.log('[浏览器] 浏览器已关闭');
			} catch (cleanupError) {
				console.log(`[警告] 清理浏览器资源时出错: ${cleanupError.message}`);
			}
		}
	}

	/**
	 * 批量处理多个账号
	 * @param {Array} accounts - 账号数组 [{username: '', password: ''}, ...]
	 * @returns {Array} - 结果数组
	 */
	async processAccounts(accounts) {
		const results = [];

		for (let i = 0; i < accounts.length; i++) {
			const account = accounts[i];
			console.log(`\n[处理] 开始处理账号 ${i + 1}/${accounts.length}`);

			const result = await this.loginAndGetSession(account.username, account.password);

			results.push({
				username: account.username,
				success: result !== null,
				data: result,
			});

			// 账号之间添加延迟，避免频繁操作
			if (i < accounts.length - 1) {
				console.log('[等待] 等待 5 秒后处理下一个账号...');
				await this.randomDelay(5000, 7000);
			}
		}

		return results;
	}
}

// 导出模块
export default AnyRouterSignIn;

// 如果直接运行此文件，执行注册
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
	(async () => {
		const signin = new AnyRouterSignIn();

		// 示例：单个账号登录
		console.log('===== AnyRouter 登录签到测试 =====\n');

		// 从环境变量或命令行参数获取账号信息
		const username = 'liyong2005';
		const password = 'liyong2005';

		const result = await signin.loginAndGetSession(username, password);

		if (result) {
			console.log('\n===== 登录成功，获取到以下信息 =====');
			console.log(`Session: ${result.session.substring(0, 50)}...`);
			console.log(`API User: ${result.apiUser}`);
			console.log(`用户名: ${result.userInfo?.username}`);
			console.log(`余额: $${(result.userInfo?.quota / 500000).toFixed(2)}`);
		} else {
			console.log('\n===== 登录失败 =====');
		}
	})();
}
