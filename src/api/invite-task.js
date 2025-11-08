/**
 * 邀请任务管理 API
 */

import apiClient, { handleApiResponse } from './client.js';

/**
 * 获取优先级最高的邀请任务
 * @description 按优先级和创建时间获取下一个待处理的邀请任务(未完成的任务)
 * 选择规则:
 * 1. 只返回未完成的任务(已邀请次数 < 需邀请次数)
 * 2. 按优先级降序排序(4-紧急 > 3-高 > 2-普通 > 1-低)
 * 3. 优先级相同时,按创建时间升序排序(早创建的优先)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 * @example
 * const result = await getTopPriorityTask();
 * if (result.success) {
 *   const task = result.data;
 *   console.log('任务ID:', task._id);
 *   console.log('邀请码:', task.aff_code);
 *   console.log('优先级:', task.priority);
 *   console.log('进度:', `${task.completed_invite_count}/${task.required_invite_count}`);
 * } else if (result.error === '暂无邀请任务') {
 *   console.log('当前没有待处理的邀请任务');
 * }
 */
export async function getTopPriorityTask() {
	return handleApiResponse(apiClient.post('/anyrouter2/getTopPriorityTask', {}));
}

/**
 * 增加邀请任务的已邀请次数(自增+1)
 * @description 对指定邀请任务的已邀请次数进行原子自增操作(+1),使用数据库原子操作避免并发问题
 * @param {Object} params - 请求参数
 * @param {string} params.task_id - 邀请任务的记录ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 * @example
 * // 邀请成功后更新计数
 * const result = await updateInviteCount({ task_id: '507f1f77bcf86cd799439011' });
 * if (result.success) {
 *   console.log('更新成功,当前已邀请:', result.data.completed_invite_count);
 *   if (result.data.completed_invite_count >= result.data.required_invite_count) {
 *     console.log('任务已完成!');
 *   }
 * }
 */
export async function updateInviteCount({ task_id }) {
	return handleApiResponse(apiClient.post('/anyrouter2/updateInviteCount', { task_id }));
}

export default {
	getTopPriorityTask,
	updateInviteCount,
};
