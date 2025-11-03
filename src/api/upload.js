/**
 * 文件上传 API
 */

import apiClient, { handleApiResponse } from './client.js';

/**
 * 上传图片到云存储
 * @description 接收base64编码的图片数据，上传到云存储并返回文件信息
 *
 * **功能特性：**
 * - 支持多种图片格式：png、jpg、jpeg、gif、webp、bmp
 * - 自动移除base64编码头部
 * - 文件大小验证（默认最大1MB）
 * - 支持自定义文件名或自动生成唯一文件名
 * - 返回云存储fileID和可直接访问的图片URL
 *
 * **文件命名规则：**
 * - 指定fileName：`{fileName}.{ext}`
 * - 自动生成：`images/{timestamp}_{random}.{ext}`
 *
 * @param {Object} uploadData - 上传数据
 * @param {string} uploadData.base64 - base64编码的图片数据。支持两种格式：1. 纯base64字符串 2. 带编码头的完整格式（如：data:image/png;base64,iVBORw0KG...）
 * @param {string} uploadData.fileExtension - 文件扩展名（不区分大小写，可带或不带点号）。支持的格式：png、jpg、jpeg、gif、webp、bmp
 * @param {string} [uploadData.fileName] - 可选的自定义文件名（不包含扩展名）。如果不指定，将自动生成格式为 `images/{timestamp}_{random}` 的文件名
 * @param {number} [uploadData.maxSize=1048576] - 文件大小限制（字节）。默认值：1048576（1MB），最大：10485760（10MB）
 * @returns {Promise<{success: boolean, data?: {fileID: string, cloudPath: string, fileURL: string, size: number, timestamp: number}, error?: string}>}
 * @example
 * // 基础使用
 * const result = await uploadImage({
 *   base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
 *   fileExtension: 'png'
 * });
 *
 * // 自定义文件名和大小限制
 * const result = await uploadImage({
 *   base64: 'data:image/png;base64,iVBORw0KG...',
 *   fileExtension: 'png',
 *   fileName: 'avatar_user123',
 *   maxSize: 2097152  // 2MB
 * });
 *
 * if (result.success) {
 *   console.log('文件ID:', result.data.fileID);
 *   console.log('云路径:', result.data.cloudPath);
 *   console.log('图片URL:', result.data.fileURL);
 *   console.log('文件大小:', result.data.size);
 *   console.log('上传时间:', result.data.timestamp);
 * }
 */
export async function uploadImage(uploadData) {
	const { base64, fileExtension, fileName, maxSize = 1048576 } = uploadData;

	// 验证必需字段
	if (!base64 || !base64.trim()) {
		return {
			success: false,
			error: 'base64参数不能为空',
		};
	}

	if (!fileExtension || !fileExtension.trim()) {
		return {
			success: false,
			error: 'fileExtension参数不能为空',
		};
	}

	// 验证文件扩展名
	const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
	const normalizedExt = fileExtension.toLowerCase().trim();
	if (!validExtensions.includes(normalizedExt)) {
		return {
			success: false,
			error: '不支持的文件格式。支持的格式：png、jpg、jpeg、gif、webp、bmp',
		};
	}

	// 验证文件大小限制
	if (typeof maxSize !== 'number' || maxSize < 1 || maxSize > 10485760) {
		return {
			success: false,
			error: '文件大小限制必须在 1 字节到 10MB 之间',
		};
	}

	// 构建请求数据
	const requestData = {
		base64,
		fileExtension,
		maxSize,
	};

	// 添加可选的自定义文件名
	if (fileName && fileName.trim()) {
		requestData.fileName = fileName.trim();
	}

	return handleApiResponse(
		apiClient.post('/upload/uploadImage', requestData)
	);
}

export default {
	uploadImage,
};
