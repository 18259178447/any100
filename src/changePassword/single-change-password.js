/**
 * AnyRouter 单账户改账密模块
 * 从服务端获取账密修改申请，执行修改，并上传结果到服务端
 */

import { fileURLToPath } from 'url';
import AnyRouterChangePassword from './change-password.js';
import { updatePasswordChange } from '../api/index.js';

/**
 * 生成随机后缀（2个字符，数字或字母）
 */
function generateRandomSuffix() {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let suffix = '';
	for (let i = 0; i < 2; i++) {
		suffix += chars[Math.floor(Math.random() * chars.length)];
	}
	return suffix;
}

/**
 * 执行单个账号的密码修改
 * @param {Object} passwordChangeData - 密码修改数据
 * @param {string} passwordChangeData.record_id - 申请记录ID
 * @param {string} passwordChangeData.old_username - 旧用户名
 * @param {string} passwordChangeData.old_password - 旧密码
 * @param {string} passwordChangeData.new_username - 新用户名
 * @param {string} passwordChangeData.new_password - 新密码
 * @param {number} [passwordChangeData.error_count=0] - 错误次数
 * @returns {Promise<{success: boolean, message: string, userInfo?: object}>}
 */
async function executeSingleChangePassword(passwordChangeData) {
	const {
		record_id,
		old_username,
		old_password,
		new_username,
		new_password,
		error_count = 0,
	} = passwordChangeData;

	console.log('\n===== 开始执行账密修改 =====');
	console.log(`[记录ID] ${record_id}`);
	console.log(`[旧用户名] ${old_username}`);
	console.log(`[新用户名] ${new_username || '(不修改)'}`);
	console.log(`[新密码] ${new_password ? '******' : '(不修改)'}`);
	console.log(`[错误次数] ${error_count}`);

	const changer = new AnyRouterChangePassword();

	try {
		// 1. 初始化浏览器
		console.log('\n[步骤1] 初始化浏览器...');
		const initResult = await changer.initialize();
		if (!initResult.success) {
			console.error('[失败] 浏览器初始化失败:', initResult.message);

			// 上传错误状态到服务端
			await updatePasswordChange({
				record_id,
				status: 3,
				error_reason: `浏览器初始化失败: ${initResult.message}`,
			});

			return {
				success: false,
				message: `浏览器初始化失败: ${initResult.message}`,
			};
		}

		// 2. 执行账密修改
		console.log('\n[步骤2] 执行账密修改...');
		const changeResult = await changer.changePassword(
			old_username,
			old_password,
			new_username,
			new_password
		);

		// 3. 处理修改结果
		if (changeResult.success) {
			console.log('\n[成功] 账密修改成功！');
			console.log(`[用户信息] ${JSON.stringify(changeResult.userInfo, null, 2)}`);

			// 上传成功状态到服务端
			const uploadResult = await updatePasswordChange({
				record_id,
				status: 2,
				account_info: changeResult.userInfo,
			});

			if (uploadResult.success) {
				console.log('[成功] 结果已上传到服务端');
			} else {
				console.warn('[警告] 上传结果到服务端失败:', uploadResult.error);
			}

			return {
				success: true,
				message: '账密修改成功',
				userInfo: changeResult.userInfo,
			};
		} else {
			console.log('\n[失败] 账密修改失败');
			console.log(`[错误信息] ${changeResult.message}`);

			// 检查是否是用户名重复错误且错误次数为2
			const isDuplicateUsernameError =
				changeResult.message.includes('Duplicate entry') &&
				changeResult.message.includes("for key 'username'");

			if (isDuplicateUsernameError && error_count === 2) {
				console.log('\n[重试] 检测到用户名重复且错误次数为2，生成新用户名重试...');

				// 生成新用户名（原用户名 + 2个随机字符）
				const randomSuffix = generateRandomSuffix();
				const retryUsername = new_username + randomSuffix;

				console.log(`[新用户名] ${retryUsername}`);

				// 重新执行修改
				const retryResult = await changer.changePassword(
					old_username,
					old_password,
					retryUsername,
					new_password
				);

				if (retryResult.success) {
					console.log('\n[成功] 重试修改成功！');
					console.log(`[用户信息] ${JSON.stringify(retryResult.userInfo, null, 2)}`);

					// 上传成功状态到服务端（使用新的用户名）
					const uploadResult = await updatePasswordChange({
						record_id,
						status: 2,
						new_username: retryResult.userInfo?.username || retryUsername,
						account_info: retryResult.userInfo,
					});

					if (uploadResult.success) {
						console.log('[成功] 结果已上传到服务端');
					} else {
						console.warn('[警告] 上传结果到服务端失败:', uploadResult.error);
					}

					return {
						success: true,
						message: '账密修改成功（重试）',
						userInfo: retryResult.userInfo,
					};
				} else {
					console.log('\n[失败] 重试修改失败');
					console.log(`[错误信息] ${retryResult.message}`);

					// 上传错误状态到服务端
					await updatePasswordChange({
						record_id,
						status: 3,
						error_reason: `重试修改失败: ${retryResult.message}`,
					});

					return {
						success: false,
						message: `重试修改失败: ${retryResult.message}`,
					};
				}
			} else {
				// 非用户名重复错误或错误次数不是2，直接上传错误状态
				await updatePasswordChange({
					record_id,
					status: 3,
					error_reason: changeResult.message,
				});

				return {
					success: false,
					message: changeResult.message,
				};
			}
		}
	} catch (error) {
		console.error('\n[异常] 执行过程中发生异常:', error.message);
		console.error(error.stack);

		// 上传错误状态到服务端
		await updatePasswordChange({
			record_id,
			status: 3,
			error_reason: `执行异常: ${error.message}`,
		});

		return {
			success: false,
			message: `执行异常: ${error.message}`,
		};
	} finally {
		// 4. 清理资源
		console.log('\n[步骤3] 清理浏览器资源...');
		await changer.cleanup();
		console.log('[完成] 资源已清理');
	}
}

export default executeSingleChangePassword;

// 如果直接运行此文件，从命令行参数读取数据
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
	(async () => {
		try {
			// 从命令行参数读取 password_change_data（JSON 字符串）
			const passwordChangeDataJson = process.argv[2];

			if (!passwordChangeDataJson) {
				console.error('[错误] 缺少 password_change_data 参数');
				console.error(
					'用法: node single-change-password.js \'{"record_id":"xxx","old_username":"xxx",...}\''
				);
				process.exit(1);
			}

			const passwordChangeData = JSON.parse(passwordChangeDataJson);

			// 验证必需字段
			const requiredFields = ['record_id', 'old_username', 'old_password'];
			for (const field of requiredFields) {
				if (!passwordChangeData[field]) {
					console.error(`[错误] 缺少必需字段: ${field}`);
					process.exit(1);
				}
			}

			// 验证至少提供新用户名或新密码之一
			if (!passwordChangeData.new_username && !passwordChangeData.new_password) {
				console.error('[错误] new_username 和 new_password 至少需要提供一个');
				process.exit(1);
			}

			// 执行修改
			const result = await executeSingleChangePassword(passwordChangeData);

			if (result.success) {
				console.log('\n===== 执行成功 =====');
				process.exit(0);
			} else {
				console.log('\n===== 执行失败 =====');
				console.log(`错误信息: ${result.message}`);
				process.exit(1);
			}
		} catch (error) {
			console.error('\n===== 执行异常 =====');
			console.error(error.message);
			console.error(error.stack);
			process.exit(1);
		}
	})();
}
