/**
 * 注册申请管理 API
 */

import apiClient, { handleApiResponse } from './client.js';

/**
 * 随机获取未使用的注册申请数据
 * @description 从数据库中随机选择一个未使用的LinuxDo注册申请数据(包含姓名拼音和申请自述),并自动标记为已使用
 * @returns {Promise<{success: boolean, data?: {id: string, name_pinyin: string, application: string}, error?: string}>}
 * @example
 * const result = await getRandomApplication();
 * if (result.success) {
 *   console.log('申请ID:', result.data.id);
 *   console.log('姓名拼音:', result.data.name_pinyin);
 *   console.log('申请自述:', result.data.application);
 * }
 */
export async function getRandomApplication() {
	return handleApiResponse(apiClient.post('/anyrouter2/getRandomApplication', {}));
}

/**
 * 重置注册申请数据为未使用状态
 * @description 将指定的注册申请数据重新标记为未使用状态,以便后续可以再次被使用
 * @param {Object} params - 请求参数
 * @param {string} params.id - 注册申请数据的记录ID
 * @returns {Promise<{success: boolean, data?: {id: string, name_pinyin: string, application: string, is_used: boolean}, error?: string}>}
 * @example
 * // 注册失败后回收申请数据
 * const result = await resetApplicationUsage({ id: '507f1f77bcf86cd799439011' });
 * if (result.success) {
 *   console.log('重置成功,申请数据可以再次使用');
 * }
 */
export async function resetApplicationUsage({ id }) {
	return handleApiResponse(apiClient.post('/anyrouter2/resetApplicationUsage', { id }));
}

export default {
	getRandomApplication,
	resetApplicationUsage,
};
