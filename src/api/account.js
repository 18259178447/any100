/**
 * 账号管理 API
 */

import apiClient, { handleApiResponse } from './client.js';

/**
 * 添加官方账号
 * @description 添加一个新的官方账号，可以用于出售。支持三种登录类型：账号密码登录、LinuxDo登录、GitHub登录
 * @param {Object} accountData - 账号数据
 * @param {string} accountData.username - 账号名称，根据account_type不同含义不同：0-AnyRouter账号名，1-LinuxDo账号名，2-GitHub账号名
 * @param {string} accountData.password - 账号密码，根据account_type不同含义不同：0-AnyRouter密码，1-LinuxDo密码，2-GitHub密码
 * @param {number} [accountData.account_type=0] - 账号类型（可选，默认0）：0-账号密码登录，1-LinuxDo登录，2-GitHub登录
 * @returns {Promise<{success: boolean, data?: {account_id: string, username: string, account_type: number}, error?: string}>}
 */
export async function addOfficialAccount(accountData) {
	const { username, password, account_type = 0 } = accountData;

	// 验证必需字段
	if (!username || !password) {
		return {
			success: false,
			error: '用户名和密码不能为空',
		};
	}

	// 验证账号类型
	if (![0, 1, 2].includes(account_type)) {
		return {
			success: false,
			error: '账号类型必须为0（账号密码）、1（LinuxDo）或2（GitHub）',
		};
	}

	return handleApiResponse(
		apiClient.post('/anyrouter2/addOfficialAccount', {
			username,
			password,
			account_type,
		})
	);
}

/**
 * 添加AnyRouter账号
 * @description 为指定用户添加新的AnyRouter账号。支持三种账号类型：
 * - 0: AnyRouter账号（账号密码登录）
 * - 1: LinuxDo账号（第三方登录）
 * - 2: GitHub账号（第三方登录）
 *
 * 功能特性：
 * 1. 自动验证用户是否存在
 * 2. 检查用户账号数量是否达到上限
 * 3. 自动设置签到模式（AnyRouter账号强制为1，其他类型可自定义）
 * 4. 支持可选字段：session、session_expire_time、aff_code、account_id、balance、used、notes
 * 5. 自动创建时间戳和初始化字段
 * @param {Object} accountData - 账号数据
 * @param {string} accountData.user_id - AnyRouter用户ID（关联anyrouter-users表的_id）
 * @param {string} accountData.username - 账号用户名，根据account_type不同含义不同：0-AnyRouter账号名，1-LinuxDo账号名，2-GitHub账号名
 * @param {string} accountData.password - 账号密码，根据account_type不同含义不同：0-AnyRouter密码，1-LinuxDo密码，2-GitHub密码
 * @param {number} [accountData.account_type=0] - 账号类型（可选，默认0）：0-AnyRouter账号，1-LinuxDo账号，2-GitHub账号
 * @param {number} [accountData.checkin_mode] - 签到模式（可选）：1-只签到AnyRouter，2-只签到AgentRouter，3-两者都签到。注意：AnyRouter账号（account_type=0）强制只能签到AnyRouter（忽略此参数）；其他类型账号：优先使用此参数，未传入则使用用户的allowed_checkin_mode
 * @param {string} [accountData.session=''] - 会话标识（可选，默认为空字符串）
 * @param {number} [accountData.session_expire_time=0] - Session过期时间戳（可选，默认为0）
 * @param {string} [accountData.aff_code=''] - AnyRouter邀请码（可选，默认为空字符串）
 * @param {string} [accountData.account_id=''] - AnyRouter平台账号ID（可选，默认为空字符串）
 * @param {number} [accountData.balance=0] - AnyRouter余额，单位为$（可选，默认为0）
 * @param {number} [accountData.used=0] - AnyRouter账号已使用的额度，单位为$（可选，默认为0）
 * @param {string} [accountData.notes=''] - 备注信息（可选，默认为空字符串）
 * @returns {Promise<{success: boolean, data?: {_id: string, user_id: string, username: string, account_type: number, checkin_mode: number, create_date: number}, error?: string}>}
 */
export async function addAccount(accountData) {
	const {
		user_id,
		username,
		password,
		account_type = 0,
		checkin_mode,
		session = '',
		session_expire_time = 0,
		aff_code = '',
		account_id = '',
		balance = 0,
		used = 0,
		notes = '',
	} = accountData;

	// 验证必需字段
	if (!user_id || !username || !password) {
		return {
			success: false,
			error: '用户ID、用户名和密码不能为空',
		};
	}

	// 验证账号类型
	if (![0, 1, 2].includes(account_type)) {
		return {
			success: false,
			error: '账号类型必须为0（AnyRouter）、1（LinuxDo）或2（GitHub）',
		};
	}

	// 验证签到模式（如果提供）
	if (checkin_mode !== undefined && ![1, 2, 3].includes(checkin_mode)) {
		return {
			success: false,
			error: '签到模式必须为1、2或3',
		};
	}

	// 验证余额必须为非负数
	if (typeof balance !== 'number' || balance < 0) {
		return {
			success: false,
			error: '余额必须为非负数',
		};
	}

	// 验证已使用额度必须为非负数
	if (typeof used !== 'number' || used < 0) {
		return {
			success: false,
			error: '已使用额度必须为非负数',
		};
	}

	// 构建请求数据
	const requestData = {
		user_id,
		username,
		password,
		account_type,
		session,
		session_expire_time,
		aff_code,
		account_id,
		balance,
		used,
		notes,
	};

	// 只有在明确提供了 checkin_mode 时才添加到请求中
	if (checkin_mode !== undefined) {
		requestData.checkin_mode = checkin_mode;
	}

	return handleApiResponse(apiClient.post('/anyrouter2/addAccount', requestData));
}

/**
 * 更新账号信息
 * @description 更新指定账号的信息，支持部分字段更新
 * @param {string} _id - 账号记录ID
 * @param {Object} updateData - 要更新的数据
 * @param {string} [updateData.username] - 账号名称，根据account_type不同含义不同
 * @param {string} [updateData.password] - 账号密码，根据account_type不同含义不同
 * @param {string} [updateData.session] - 会话标识
 * @param {number} [updateData.session_expire_time] - Session过期时间戳
 * @param {string} [updateData.account_id] - AnyRouter平台账号ID
 * @param {number} [updateData.checkin_date] - 签到时间戳
 * @param {number} [updateData.balance] - AnyRouter账号余额
 * @param {number} [updateData.agentrouter_balance] - AgentRouter账号余额
 * @param {boolean} [updateData.is_sold] - 是否已售出
 * @param {number} [updateData.sell_date] - 出售时间戳
 * @param {number} [updateData.account_type] - 登录类型：0-账号密码登录，1-LinuxDo登录（username/password为LinuxDo账号），2-GitHub登录（username/password为GitHub账号）
 * @param {boolean} [updateData.can_sell] - 是否可出售
 * @param {string} [updateData.workflow_url] - 工作流URL
 * @param {string} [updateData.notes] - 备注信息
 * @param {string} [updateData.cache_key] - 用户持久化时的辅助key
 * @param {number} [updateData.checkin_error_count] - 连续签到失败的次数统计
 * @param {number} [updateData.checkin_mode] - 签到模式：1-只签到anyrouter，2-只签到agentrouter，3-两者都签到
 * @param {Array<{id: number, key: string, unlimited_quota?: boolean, used_quota?: number, remain_quota?: number}>} [updateData.tokens] - AnyRouter账号的所有令牌信息。每个令牌包含：id(令牌ID)、key(访问密钥)、unlimited_quota(是否无限额度)、used_quota(已使用额度)、remain_quota(剩余额度)
 * @param {string} [updateData.aff_code] - 推广码（本地定义字段，API不支持）
 * @param {number} [updateData.used] - 已使用额度（本地定义字段，API不支持）
 * @returns {Promise<{success: boolean, data?: {updated: number, updatedFields: string[]}, error?: string}>}
 */
export async function updateAccountInfo(_id, updateData) {
	// 验证必需字段
	if (!_id) {
		return {
			success: false,
			error: '账号ID不能为空',
		};
	}

	if (!updateData || Object.keys(updateData).length === 0) {
		return {
			success: false,
			error: '更新数据不能为空',
		};
	}

	// 移除不允许更新的字段
	const filteredData = { ...updateData };
	delete filteredData.create_date;
	delete filteredData._id;
	// 注意：account_type 字段现在允许更新，以支持账号类型转换（如从 LinuxDo 登录转为账号密码登录）

	return handleApiResponse(
		apiClient.post('/anyrouter2/updateAccountInfo', {
			_id,
			updateData: filteredData,
		})
	);
}

/**
 * 获取账号登录信息
 * @param {Object} params - 查询参数
 * @param {string} params.login_info_id - 登录信息记录ID
 * @param {string} params.account_id - 账号记录ID（关联anyrouter-accounts表的_id）
 * @returns {Promise<{success: boolean, data?: {_id: string, account_id: string, github_device_code: string, linuxdo_login_url: string, create_date: number}|null, error?: string}>}
 */
export async function getAccountLoginInfo(params) {
	const { login_info_id, account_id } = params;

	// 验证必需字段
	if (!login_info_id || !account_id) {
		return {
			success: false,
			error: '登录信息ID和账号ID不能为空',
		};
	}

	return handleApiResponse(
		apiClient.post('/anyrouter2/getAccountLoginInfo', {
			login_info_id,
			account_id,
		})
	);
}

/**
 * 添加账号登录信息
 * @param {Object} params - 请求参数
 * @param {string} params.account_id - 账号记录ID（关联anyrouter-accounts表的_id）
 * @returns {Promise<{success: boolean, data?: {login_info_id: string, expire_time: number}, error?: string}>}
 */
export async function addAccountLoginInfo(params) {
	const { account_id } = params;

	// 验证必需字段
	if (!account_id) {
		return {
			success: false,
			error: '账号ID不能为空',
		};
	}

	return handleApiResponse(
		apiClient.post('/anyrouter2/addAccountLoginInfo', {
			account_id,
		})
	);
}

/**
 * 获取存在Session的LinuxDo账号列表
 * @description 查询符合以下所有条件的 LinuxDo 账号：
 * 1. LinuxDo 类型账号 (account_type = 1)
 * 2. 存在 session 且不为空
 * @returns {Promise<{success: boolean, data?: Array<{
 *   _id: string,
 *   username: string,
 *   password: string,
 *   account_type: 1,
 *   session: string,
 *   session_expire_time: number|null,
 *   account_id: string,
 *   cache_key: string,
 *   workflow_url: string
 * }>, error?: string}>}
 */
export async function getLinuxDoAccountsWithSession() {
	return handleApiResponse(apiClient.post('/anyrouter2/getLinuxDoAccountsWithSession', {}));
}

/**
 * 自增AnyRouter账号余额
 * @description 对指定账号的AnyRouter余额进行自增或扣减操作
 * - 支持正数增加余额，负数扣减余额
 * - 扣减时会自动检查余额是否足够
 * - 使用数据库原子操作，保证并发安全
 * - 返回操作前后的余额变化详情
 * @param {Object} params - 请求参数
 * @param {string} params._id - 账号记录ID
 * @param {number} params.amount - 自增额度（必须为整数）。正数：增加余额；负数：扣减余额（会检查余额是否足够）
 * @returns {Promise<{success: boolean, data?: {_id: string, old_balance: number, amount: number, new_balance: number}, error?: string}>}
 * @example
 * // 增加余额
 * const result = await incrementBalance({ _id: '507f1f77bcf86cd799439011', amount: 100 });
 * if (result.success) {
 *   console.log(`余额从 ${result.data.old_balance} 增加到 ${result.data.new_balance}`);
 * }
 *
 * @example
 * // 扣减余额
 * const result = await incrementBalance({ _id: '507f1f77bcf86cd799439011', amount: -50 });
 * if (result.success) {
 *   console.log(`余额从 ${result.data.old_balance} 扣减到 ${result.data.new_balance}`);
 * } else {
 *   console.error('扣减失败:', result.error); // 可能是余额不足
 * }
 */
export async function incrementBalance({ _id, amount }) {
	// 验证必需字段
	if (!_id) {
		return {
			success: false,
			error: '账号ID不能为空',
		};
	}

	if (amount === undefined || amount === null) {
		return {
			success: false,
			error: '变动额度不能为空',
		};
	}

	// 验证amount必须为整数
	if (!Number.isInteger(amount)) {
		return {
			success: false,
			error: '变动额度必须为整数',
		};
	}

	return handleApiResponse(
		apiClient.post('/anyrouter2/incrementBalance', {
			_id,
			amount,
		})
	);
}

/**
 * 获取可签到的账号列表
 * @description 查询符合以下所有条件的账号，用于批量更新Session：
 * 1. **账号条件**：
 *    - 未售出（is_sold !== true）
 *    - session 不存在或已过期（session_expire_time < 当前时间 或 session_expire_time 不存在）
 * 2. **用户条件**（关联 anyrouter-users 表）：
 *    - 用户已激活（is_active = true）
 *    - 会员未过期（member_expire_time > 当前时间）
 * 3. **签到状态**：
 *    - 今天（北京时间）未签到
 * @param {Object} [params] - 查询参数
 * @param {number} [params.limit] - 返回记录数量限制（可选，不传则返回所有符合条件的记录）
 * @returns {Promise<{success: boolean, data?: {
 *   total: number,
 *   accounts: Array<{
 *     _id: string,
 *     username: string,
 *     password: string,
 *     account_type: 0|1|2,
 *     workflow_url: string,
 *     checkin_date: number|null,
 *     cache_key: string,
 *     anyrouter_user_id: string,
 *     notice_email: string,
 *     user_username: string,
 *     member_expire_time: number,
 *     checkin_mode: 1|2|3,
 *     session: string|null,
 *     account_id: string,
 *     session_expire_time: number|null,
 *     tokens: Array<{id: number, key: string, unlimited_quota?: boolean, used_quota?: number, remain_quota?: number}>
 *   }>,
 *   query_time: number,
 *   beijing_date: string
 * }, error?: string}>}
 * @example
 * // 获取所有可签到账号
 * const result = await getCheckinableAccounts();
 * if (result.success) {
 *   console.log(`找到 ${result.data.total} 个可签到账号`);
 *   console.log(`查询日期: ${result.data.beijing_date}`);
 *   result.data.accounts.forEach(account => {
 *     console.log(`账号: ${account.username}, 类型: ${account.account_type}`);
 *   });
 * }
 *
 * @example
 * // 限制返回数量
 * const result = await getCheckinableAccounts({ limit: 10 });
 * if (result.success) {
 *   console.log(`返回 ${result.data.accounts.length} / ${result.data.total} 个账号`);
 * }
 */
export async function getCheckinableAccounts(params = {}) {
	const { limit } = params;

	// 验证limit必须为正整数
	if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
		return {
			success: false,
			error: '返回数量限制必须为正整数',
		};
	}

	return handleApiResponse(
		apiClient.post('/anyrouter2/getCheckinableAccounts', {
			...(limit && { limit }),
		})
	);
}

/**
 * 更新账密修改申请记录信息
 * @description 更新账密修改申请记录的状态、用户名、错误信息等
 *
 * **核心逻辑**：
 * - 当状态设置为错误(3)且提供了错误原因时，错误次数会自动递增
 * - 当状态设置为已完成(2)时，会自动记录完成时间
 * - 每次更新都会自动更新 update_date 时间戳
 * - 新用户名由调用方处理业务逻辑后传入
 *
 * @param {Object} params - 请求参数
 * @param {string} params.record_id - 申请记录ID（必需）
 * @param {string} [params.new_username] - 新用户名（可选，由调用方处理业务逻辑后传入）
 * @param {number} [params.status] - 申请状态（可选）：0-未开始，1-进行中，2-已完成（会自动记录 complete_date），3-错误（配合 error_reason 使用时会自动递增 error_count）
 * @param {string} [params.error_reason] - 错误原因（可选，当 status=3 时建议提供，会自动递增错误次数）
 * @param {Object} [params.account_info] - 账号信息（可选，从AnyRouter获取的完整账号信息对象）
 * @returns {Promise<{success: boolean, data?: {errCode: number, errMsg: string}, error?: string}>}
 * @example
 * // 示例1：更新为错误状态（错误次数会自动递增）
 * const result = await updatePasswordChange({
 *   record_id: '65a1b2c3d4e5f6789012345',
 *   status: 3,
 *   error_reason: '密码修改失败：账号已被锁定'
 * });
 *
 * @example
 * // 示例2：更新为已完成状态
 * const result = await updatePasswordChange({
 *   record_id: '65a1b2c3d4e5f6789012345',
 *   status: 2,
 *   new_username: 'new_account_name',
 *   account_info: {
 *     username: 'new_account_name',
 *     password: 'encrypted_password'
 *   }
 * });
 *
 * @example
 * // 示例3：只更新用户名
 * const result = await updatePasswordChange({
 *   record_id: '65a1b2c3d4e5f6789012345',
 *   new_username: 'modified_username_AB'
 * });
 */
export async function updatePasswordChange(params) {
	const { record_id, new_username, status, error_reason, account_info } = params;

	// 验证必需字段
	if (!record_id) {
		return {
			success: false,
			error: '申请记录ID不能为空',
		};
	}

	// 验证状态值（如果提供）
	if (status !== undefined && ![0, 1, 2, 3].includes(status)) {
		return {
			success: false,
			error: '申请状态必须为0（未开始）、1（进行中）、2（已完成）或3（错误）',
		};
	}

	// 验证错误原因长度（如果提供）
	if (error_reason && error_reason.length > 500) {
		return {
			success: false,
			error: '错误原因不能超过500个字符',
		};
	}

	// 构建请求数据
	const requestData = { record_id };

	if (new_username !== undefined) {
		requestData.new_username = new_username;
	}

	if (status !== undefined) {
		requestData.status = status;
	}

	if (error_reason !== undefined) {
		requestData.error_reason = error_reason;
	}

	if (account_info !== undefined) {
		requestData.account_info = account_info;
	}

	return handleApiResponse(apiClient.post('/anyrouter2/updatePasswordChange', requestData));
}

export default {
	addOfficialAccount,
	addAccount,
	updateAccountInfo,
	getAccountLoginInfo,
	addAccountLoginInfo,
	getLinuxDoAccountsWithSession,
	incrementBalance,
	getCheckinableAccounts,
	updatePasswordChange,
};
