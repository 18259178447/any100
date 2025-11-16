/**
 * 随机延迟工具函数
 * 用于模拟真人操作的随机延迟
 */

/**
 * 生成随机延迟时间（使用正态分布模拟真人操作）
 * @param {number} min - 最小延迟时间（毫秒）
 * @param {number} max - 最大延迟时间（毫秒）
 * @returns {number} - 随机延迟时间（毫秒）
 */
export function getRandomDelay(min = 500, max = 1500) {
	const u = 1 - Math.random();
	const v = Math.random();
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	const delay = min + ((max - min) * (z + 3)) / 6;
	return Math.max(min, Math.min(max, Math.floor(delay)));
}

/**
 * 等待随机时间
 * @param {number} min - 最小延迟时间（毫秒）
 * @param {number} max - 最大延迟时间（毫秒）
 * @returns {Promise<void>}
 */
export async function randomDelay(min = 500, max = 1500) {
	const delay = getRandomDelay(min, max);
	await new Promise((resolve) => setTimeout(resolve, delay));
}
