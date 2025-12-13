/**
 * AI Key 管理 API
 */

import apiClient, { handleApiResponse } from './client.js';

/**
 * 添加AI API Key
 * @description 添加一个新的AI接口密钥。支持多种Key类型，如CodeRouter等。自动检查Key是否已存在，防止重复添加。
 *
 * **注意事项**：
 * - 当 key_type 为 coderouter 时，建议在 source_name 字段填写 GitHub 用户名，用于标识 Key 的来源
 *
 * @param {Object} keyData - Key数据
 * @param {string} keyData.key - AI接口的API密钥（必需）
 * @param {string} keyData.key_type - API Key的类型（必需）：coderouter | anyrouter | other
 * @param {number} [keyData.quota=0] - API Key的可用额度（可选，默认0）
 * @param {string} [keyData.source_name] - Key的来源或提供者名称（可选）。注意：如果 key_type 是 coderouter，则此字段应填写 GitHub 用户名
 * @param {boolean} [keyData.is_sold=false] - 该Key是否已出售（可选，默认false）
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 * @example
 * // 添加一个 CodeRouter Key
 * const result = await addKey({
 *   key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
 *   key_type: 'coderouter',
 *   quota: 100,
 *   source_name: 'github_username'
 * });
 * if (result.success) {
 *   console.log('Key添加成功:', result.data);
 * }
 *
 * @example
 * // 添加一个已出售的 AnyRouter Key
 * const result = await addKey({
 *   key: 'sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
 *   key_type: 'anyrouter',
 *   is_sold: true
 * });
 */
export async function addKey(keyData) {
	const { key, key_type, quota = 0, source_name, is_sold = false } = keyData;

	// 验证必需字段
	if (!key) {
		return {
			success: false,
			error: 'API Key不能为空',
		};
	}

	if (!key_type) {
		return {
			success: false,
			error: 'Key类型不能为空',
		};
	}

	// 验证 key 长度
	if (key.length < 1 || key.length > 500) {
		return {
			success: false,
			error: 'API Key长度必须在1-500个字符之间',
		};
	}

	// 验证 key_type 枚举值
	if (!['coderouter', 'anyrouter', 'other'].includes(key_type)) {
		return {
			success: false,
			error: 'Key类型必须为 coderouter、anyrouter 或 other',
		};
	}

	// 验证 quota 必须为非负数
	if (typeof quota !== 'number' || quota < 0) {
		return {
			success: false,
			error: '额度必须为非负数',
		};
	}

	// 验证 source_name 长度（如果提供）
	if (source_name !== undefined && source_name.length > 200) {
		return {
			success: false,
			error: '来源名称不能超过200个字符',
		};
	}

	// 构建请求数据
	const requestData = {
		key,
		key_type,
		quota,
		is_sold,
	};

	// 只有在提供了 source_name 时才添加到请求中
	if (source_name !== undefined) {
		requestData.source_name = source_name;
	}

	return handleApiResponse(apiClient.post('/ai-key/addKey', requestData));
}

/**
 * 批量添加AI API Key
 * @description 批量添加多个AI接口密钥。支持一次性添加多个Key，自动检查重复并返回详细的处理结果。
 *
 * **功能特点**：
 * - 单次最多添加100个Key
 * - 自动跳过已存在的Key
 * - 返回成功和失败的详细统计
 * - 部分失败不影响其他Key的添加
 *
 * **注意事项**：
 * - 当 key_type 为 coderouter 时，建议在 source_name 字段填写 GitHub 用户名
 *
 * @param {Array<Object>} keys - Key数组，最多100个
 * @param {string} keys[].key - AI接口的API密钥（必需）
 * @param {string} keys[].key_type - API Key的类型（必需）：coderouter | anyrouter | other
 * @param {number} [keys[].quota=0] - API Key的可用额度（可选，默认0）
 * @param {string} [keys[].source_name] - Key的来源或提供者名称（可选）
 * @param {boolean} [keys[].is_sold=false] - 该Key是否已出售（可选，默认false）
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 * @example
 * // 批量添加多个 Key
 * const result = await addKeys([
 *   { key: 'sk-xxx1', key_type: 'anyrouter', quota: 10, source_name: 'user1_出售_1' },
 *   { key: 'sk-xxx2', key_type: 'anyrouter', quota: 20, source_name: 'user2_出售_2' }
 * ]);
 * if (result.success) {
 *   console.log('批量添加结果:', result.data);
 * }
 */
export async function addKeys(keys) {
	// 验证必需字段
	if (!keys || !Array.isArray(keys)) {
		return {
			success: false,
			error: 'keys必须是数组',
		};
	}

	if (keys.length === 0) {
		return {
			success: false,
			error: 'keys数组不能为空',
		};
	}

	if (keys.length > 100) {
		return {
			success: false,
			error: '单次最多添加100个Key',
		};
	}

	// 验证每个 key 对象
	for (let i = 0; i < keys.length; i++) {
		const keyData = keys[i];

		if (!keyData.key) {
			return {
				success: false,
				error: `第${i + 1}个Key的API Key不能为空`,
			};
		}

		if (!keyData.key_type) {
			return {
				success: false,
				error: `第${i + 1}个Key的类型不能为空`,
			};
		}

		if (keyData.key.length < 1 || keyData.key.length > 500) {
			return {
				success: false,
				error: `第${i + 1}个Key的长度必须在1-500个字符之间`,
			};
		}

		if (!['coderouter', 'anyrouter', 'other'].includes(keyData.key_type)) {
			return {
				success: false,
				error: `第${i + 1}个Key的类型必须为 coderouter、anyrouter 或 other`,
			};
		}

		if (keyData.quota !== undefined && (typeof keyData.quota !== 'number' || keyData.quota < 0)) {
			return {
				success: false,
				error: `第${i + 1}个Key的额度必须为非负数`,
			};
		}

		if (keyData.source_name !== undefined && keyData.source_name.length > 200) {
			return {
				success: false,
				error: `第${i + 1}个Key的来源名称不能超过200个字符`,
			};
		}
	}

	// 构建请求数据，为每个 key 设置默认值
	const requestKeys = keys.map((keyData) => {
		const item = {
			key: keyData.key,
			key_type: keyData.key_type,
			quota: keyData.quota ?? 0,
			is_sold: keyData.is_sold ?? false,
		};

		if (keyData.source_name !== undefined) {
			item.source_name = keyData.source_name;
		}

		return item;
	});

	return handleApiResponse(apiClient.post('/ai-key/addKeys', { keys: requestKeys }));
}

export default {
	addKey,
	addKeys,
};
