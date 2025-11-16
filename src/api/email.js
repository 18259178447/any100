/**
 * 邮件管理 API
 */

import apiClient, { handleApiResponse } from './client.js';

/**
 * 添加邮件
 * @description 添加一封新邮件到数据库
 * @param {Object} emailData - 邮件数据
 * @param {string} emailData.email_source - 邮件来源，支持: 'swpu'（西南石油大学）, 'huel'（河南财经政法大学）, '892507222'（QQ邮箱）
 * @param {number} emailData.email_type - 邮件类型：1-发件，2-收件
 * @param {string} emailData.sender_email - 发件人邮箱地址
 * @param {string} emailData.recipient_email - 收件人邮箱地址
 * @param {string} emailData.subject - 邮件主题（最大长度500）
 * @param {string} [emailData.sender_name] - 发件人显示名称（可选）
 * @param {string} [emailData.content] - 邮件正文内容（可选，支持HTML）
 * @param {string} [emailData.email_id] - 邮件ID（可选）
 * @param {number} [emailData.mail_time] - 邮件时间戳（可选，默认为当前时间）
 * @returns {Promise<{success: boolean, data?: {_id: string}, error?: string}>}
 * @example
 * const result = await addEmail({
 *   email_source: 'huel',
 *   email_type: 2,
 *   sender_email: 'noreply@service.com',
 *   recipient_email: 'user@huel.edu.cn',
 *   subject: 'AnyRouter注册验证码',
 *   content: '<p>您的验证码是: 123456</p>'
 * });
 * if (result.success) {
 *   console.log('邮件添加成功，ID:', result.data._id);
 * }
 */
export async function addEmail(emailData) {
	const {
		email_source,
		email_type,
		sender_email,
		recipient_email,
		subject,
		sender_name,
		content,
		email_id,
		mail_time,
	} = emailData;

	// 验证必需字段
	if (!email_source) {
		return {
			success: false,
			error: '邮件来源不能为空',
		};
	}

	if (!['swpu', 'huel', '892507222'].includes(email_source)) {
		return {
			success: false,
			error: '邮件来源必须为 \'swpu\', \'huel\' 或 \'892507222\'',
		};
	}

	if (!email_type) {
		return {
			success: false,
			error: '邮件类型不能为空',
		};
	}

	if (![1, 2].includes(email_type)) {
		return {
			success: false,
			error: '邮件类型必须为 1（发件）或 2（收件）',
		};
	}

	if (!sender_email || !recipient_email) {
		return {
			success: false,
			error: '发件人和收件人邮箱不能为空',
		};
	}

	if (!subject) {
		return {
			success: false,
			error: '邮件主题不能为空',
		};
	}

	if (subject.length > 500) {
		return {
			success: false,
			error: '邮件主题长度不能超过500字符',
		};
	}

	// 构建请求体（仅包含有值的字段）
	const requestBody = {
		email_source,
		email_type,
		sender_email,
		recipient_email,
		subject,
	};

	// 添加可选字段
	if (sender_name) requestBody.sender_name = sender_name;
	if (content) requestBody.content = content;
	if (email_id) requestBody.email_id = email_id;
	if (mail_time) requestBody.mail_time = mail_time;

	return handleApiResponse(apiClient.post('/email/addEmail', requestBody));
}

/**
 * 获取最新一封邮件
 * @description 根据邮件来源和类型获取最新一封邮件信息
 * @param {Object} params - 查询参数
 * @param {string} params.email_source - 邮件来源，支持: 'swpu', 'huel', '892507222'
 * @param {number} params.email_type - 邮件类型：1-发件，2-收件
 * @returns {Promise<{success: boolean, data?: {
 *   _id: string,
 *   email_source: string,
 *   email_type: number,
 *   sender_email: string,
 *   sender_name?: string,
 *   recipient_email: string,
 *   subject: string,
 *   content?: string,
 *   email_id?: string,
 *   mail_time: number,
 *   create_date: number
 * }|null, error?: string}>}
 * @example
 * const result = await getLatestEmail({
 *   email_source: 'huel',
 *   email_type: 2
 * });
 * if (result.success && result.data) {
 *   console.log('最新邮件主题:', result.data.subject);
 * } else if (result.success && !result.data) {
 *   console.log('未找到符合条件的邮件');
 * }
 */
export async function getLatestEmail(params) {
	const { email_source, email_type } = params;

	// 验证必需字段
	if (!email_source) {
		return {
			success: false,
			error: '邮件来源不能为空',
		};
	}

	if (!['swpu', 'huel', '892507222'].includes(email_source)) {
		return {
			success: false,
			error: '邮件来源必须为 \'swpu\', \'huel\' 或 \'892507222\'',
		};
	}

	if (!email_type) {
		return {
			success: false,
			error: '邮件类型不能为空',
		};
	}

	if (![1, 2].includes(email_type)) {
		return {
			success: false,
			error: '邮件类型必须为 1（发件）或 2（收件）',
		};
	}

	return handleApiResponse(
		apiClient.post('/email/getLatestEmail', {
			email_source,
			email_type,
		})
	);
}

/**
 * 查询邮件
 * @description 根据条件查询邮件列表，支持分页和多条件筛选
 * @param {Object} params - 查询参数
 * @param {string} params.email_source - 邮件来源（必填），支持: 'swpu', 'huel', '892507222'
 * @param {number} params.email_type - 邮件类型（必填）：1-发件，2-收件
 * @param {string} [params.recipient_email] - 收件人邮箱地址（可选，精确匹配）
 * @param {string} [params.sender_email] - 发件人邮箱地址（可选，精确匹配）
 * @param {string} [params.subject] - 邮件主题（可选，支持模糊查询，不区分大小写）
 * @param {number} [params.page=1] - 页码（可选，默认为1）
 * @param {number} [params.pageSize=20] - 每页数量（可选，默认为20，最大100）
 * @returns {Promise<{success: boolean, data?: {
 *   list: Array<{
 *     _id: string,
 *     email_source: string,
 *     email_type: number,
 *     sender_email: string,
 *     sender_name?: string,
 *     recipient_email: string,
 *     subject: string,
 *     content?: string,
 *     email_id?: string,
 *     mail_time: number,
 *     create_date: number
 *   }>,
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }, error?: string}>}
 * @example
 * // 查询河南财经政法大学收到的验证码邮件
 * const result = await queryEmails({
 *   email_source: 'huel',
 *   email_type: 2,
 *   subject: '验证码',
 *   page: 1,
 *   pageSize: 10
 * });
 * if (result.success) {
 *   console.log(`找到 ${result.data.total} 封邮件`);
 *   result.data.list.forEach(email => {
 *     console.log(`主题: ${email.subject}, 发件人: ${email.sender_email}`);
 *   });
 * }
 */
export async function queryEmails(params) {
	const {
		email_source,
		email_type,
		recipient_email,
		sender_email,
		subject,
		page = 1,
		pageSize = 20,
	} = params;

	// 验证必需字段
	if (!email_source) {
		return {
			success: false,
			error: '邮件来源不能为空',
		};
	}

	if (!['swpu', 'huel', '892507222'].includes(email_source)) {
		return {
			success: false,
			error: '邮件来源必须为 \'swpu\', \'huel\' 或 \'892507222\'',
		};
	}

	if (!email_type) {
		return {
			success: false,
			error: '邮件类型不能为空',
		};
	}

	if (![1, 2].includes(email_type)) {
		return {
			success: false,
			error: '邮件类型必须为 1（发件）或 2（收件）',
		};
	}

	// 验证分页参数
	if (page < 1) {
		return {
			success: false,
			error: '页码必须大于等于1',
		};
	}

	if (pageSize < 1 || pageSize > 100) {
		return {
			success: false,
			error: '每页数量必须在1-100之间',
		};
	}

	// 构建请求体（仅包含有值的字段）
	const requestBody = {
		email_source,
		email_type,
		page,
		pageSize,
	};

	// 添加可选过滤条件
	if (recipient_email) requestBody.recipient_email = recipient_email;
	if (sender_email) requestBody.sender_email = sender_email;
	if (subject) requestBody.subject = subject;

	return handleApiResponse(apiClient.post('/email/queryEmails', requestBody));
}

export default {
	addEmail,
	getLatestEmail,
	queryEmails,
};
